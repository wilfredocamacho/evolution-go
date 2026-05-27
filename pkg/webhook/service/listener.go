package webhook_service

import (
	"encoding/json"
	"log"
	"regexp"
	"strings"
	"sync"

	instance_model "github.com/EvolutionAPI/evolution-go/pkg/instance/model"
	logger_wrapper "github.com/EvolutionAPI/evolution-go/pkg/logger"
	"github.com/EvolutionAPI/evolution-go/pkg/webhook/model"
	"go.mau.fi/whatsmeow/types/events"
)

type SendTextFunc func(instanceID, remoteJid, text string) error
type ResolvePNFromLIDFunc func(instanceID, lidJID string) string

// MessageListener interface for whatsmeow injection.
type MessageListener interface {
	OnMessage(instance *instance_model.Instance, msg *events.Message)
}

type ChatbotListener struct {
	service          *WebhookService
	sessions         *SessionManager
	dispatcher       *Dispatcher
	sendText         SendTextFunc
	resolvePNFromLID ResolvePNFromLIDFunc
	logger           *logger_wrapper.LoggerManager
}

func NewChatbotListener(service *WebhookService, sessions *SessionManager, dispatcher *Dispatcher, sendText SendTextFunc, resolvePNFromLID ResolvePNFromLIDFunc, logger *logger_wrapper.LoggerManager) *ChatbotListener {
	return &ChatbotListener{
		service:          service,
		sessions:         sessions,
		dispatcher:       dispatcher,
		sendText:         sendText,
		resolvePNFromLID: resolvePNFromLID,
		logger:           logger,
	}
}

func (l *ChatbotListener) OnMessage(instance *instance_model.Instance, msg *events.Message) {
	remoteJid := msg.Info.Chat.String()
	pushName := msg.Info.PushName
	if pushName == "" {
		pushName = remoteJid
	}
	content := extractTextContent(msg)
	fromMe := msg.Info.IsFromMe

	// Extract LID/JID resolution fields from message event.
	// Phone JID is source of truth when available.
	chatJid := msg.Info.Chat.String()
	senderJid := msg.Info.Sender.String()
	senderAltJid := msg.Info.SenderAlt.String()

	var senderPn, senderLid string
	if strings.HasSuffix(chatJid, "@lid") {
		senderLid = chatJid
	}

	for _, candidate := range []string{senderJid, senderAltJid, chatJid} {
		if strings.HasSuffix(candidate, "@s.whatsapp.net") || strings.HasSuffix(candidate, "@c.us") {
			senderPn = candidate
			break
		}
	}

	if senderLid == "" {
		for _, candidate := range []string{chatJid, senderJid, senderAltJid} {
			if strings.HasSuffix(candidate, "@lid") {
				senderLid = candidate
				break
			}
		}
	}

	if senderPn == "" && senderLid != "" && l.resolvePNFromLID != nil {
		if resolvedPn := l.resolvePNFromLID(instance.Id, senderLid); resolvedPn != "" {
			senderPn = resolvedPn
			l.logger.GetLogger(instance.Id).LogInfo(
				"[%s] chatbot identity resolved from lid mapping senderLid=%s senderPn=%s",
				instance.Id,
				senderLid,
				senderPn,
			)
			log.Printf("[CHATBOT_LID_RESOLVED] instance=%s senderLid=%s senderPn=%s", instance.Id, senderLid, senderPn)
		}
	}

	if senderPn == "" {
		l.logger.GetLogger(instance.Id).LogWarn(
			"[%s] chatbot dispatch skipped: phone JID not resolvable chat=%s sender=%s senderAlt=%s senderLid=%s",
			instance.Id,
			chatJid,
			senderJid,
			senderAltJid,
			senderLid,
		)
		log.Printf("[CHATBOT_DISPATCH_SKIPPED] instance=%s reason=no_sender_pn chat=%s sender=%s senderAlt=%s senderLid=%s", instance.Id, chatJid, senderJid, senderAltJid, senderLid)
		return
	}

	l.logger.GetLogger(instance.Id).LogInfo(
		"[%s] chatbot identity extracted chat=%s sender=%s senderAlt=%s senderPn=%s senderLid=%s",
		instance.Id,
		chatJid,
		senderJid,
		senderAltJid,
		senderPn,
		senderLid,
	)
	log.Printf("[CHATBOT_IDENTITY] instance=%s chat=%s sender=%s senderAlt=%s senderPn=%s senderLid=%s", instance.Id, chatJid, senderJid, senderAltJid, senderPn, senderLid)

	webhooks, err := l.service.FindByInstanceAndEnabled(instance.Id)
	if err != nil || len(webhooks) == 0 {
		return
	}

	var wg sync.WaitGroup

	for _, w := range webhooks {
		if !w.Enabled {
			continue
		}

		// Check ignoreJids
		if l.isIgnored(&w, remoteJid) {
			continue
		}

		// Check listeningFromMe
		if fromMe && !w.ListeningFromMe {
			continue
		}

		wg.Add(1)
		go func(wh webhook_model.Webhook) {
			defer wg.Done()
			l.processWebhook(wh, instance, remoteJid, pushName, content, fromMe, senderPn, senderLid)
		}(w)
	}

	wg.Wait()
}

func (l *ChatbotListener) processWebhook(w webhook_model.Webhook, instance *instance_model.Instance, remoteJid, pushName, content string, fromMe bool, senderPn, senderLid string) {
	session := l.sessions.Get(w.ID, remoteJid)

	if session != nil && session.Status == "opened" {
		l.sessions.Touch(w.ID, remoteJid)

		if w.StopBotFromMe && fromMe {
			l.sessions.CloseSession(w.ID, remoteJid)
			l.logger.GetLogger(instance.Id).LogInfo("[%s] Session closed by StopBotFromMe for %s", instance.Id, remoteJid)
			return
		}

		if w.KeywordFinish != "" && strings.EqualFold(strings.TrimSpace(content), w.KeywordFinish) {
			l.sessions.CloseSession(w.ID, remoteJid)
			l.logger.GetLogger(instance.Id).LogInfo("[%s] Session closed by keywordFinish for %s", instance.Id, remoteJid)
			return
		}

		l.dispatchAndRespond(&w, instance, remoteJid, pushName, content, session.SessionID, senderPn, senderLid)
		return
	}

	// No session or closed — evaluate trigger
	if session == nil || session.Status == "closed" {
		if !l.matchTrigger(&w, content) {
			return
		}

		s := l.sessions.CreateOrGet(w.ID, remoteJid, pushName, instance.Id, w.Expire)
		if w.StopBotFromMe && fromMe {
			l.sessions.CloseSession(w.ID, remoteJid)
			return
		}

		l.dispatchAndRespond(&w, instance, remoteJid, pushName, content, s.SessionID, senderPn, senderLid)
	}
}

func (l *ChatbotListener) dispatchAndRespond(w *webhook_model.Webhook, instance *instance_model.Instance, remoteJid, pushName, content, sessionID string, senderPn, senderLid string) {
	payload := map[string]interface{}{
		"chatInput":    content,
		"sessionId":    sessionID,
		"remoteJid":    remoteJid,
		"pushName":     pushName,
		"instanceName": instance.Name,
		"instanceId":   instance.Id,
	}

	// LID/JID resolution fields for downstream identity resolution.
	// senderPn is the phone JID (@s.whatsapp.net) when available.
	// senderLid is the LID JID (@lid) when the chat uses LID.
	// Omit empty values for backward compatibility.
	if senderPn != "" {
		payload["senderPn"] = senderPn
	}
	if senderLid != "" {
		payload["senderLid"] = senderLid
	}

	if w.IsTrusted {
		payload["apiKey"] = instance.Token
	}

	l.logger.GetLogger(instance.Id).LogInfo(
		"[%s] chatbot dispatch payload webhook=%s remoteJid=%s senderPn=%v senderLid=%v sessionId=%s",
		instance.Id,
		w.ID,
		remoteJid,
		payload["senderPn"],
		payload["senderLid"],
		sessionID,
	)
	log.Printf("[CHATBOT_DISPATCH] instance=%s webhook=%s remoteJid=%s senderPn=%v senderLid=%v sessionId=%s", instance.Id, w.ID, remoteJid, payload["senderPn"], payload["senderLid"], sessionID)

	response, err := l.dispatcher.Dispatch(w, payload)
	if err != nil {
		l.logger.GetLogger(instance.Id).LogError("[%s] webhook dispatch error for %s: %v", instance.Id, w.ID, err)
		return
	}

	if response != "" && strings.TrimSpace(response) != "" {
		if err := l.sendText(instance.Id, remoteJid, response); err != nil {
			l.logger.GetLogger(instance.Id).LogError("[%s] sendText error for %s: %v", instance.Id, remoteJid, err)
		}
	}
}

func (l *ChatbotListener) isIgnored(w *webhook_model.Webhook, remoteJid string) bool {
	if w.IgnoreJids == nil {
		return false
	}

	var ignoreJids []string
	if err := json.Unmarshal(w.IgnoreJids, &ignoreJids); err != nil {
		return false
	}

	for _, jid := range ignoreJids {
		switch {
		case jid == "@g.us" && strings.HasSuffix(remoteJid, "@g.us"):
			return true
		case jid == "@s.whatsapp.net" && strings.HasSuffix(remoteJid, "@s.whatsapp.net"):
			return true
		case jid == remoteJid:
			return true
		}
	}
	return false
}

func (l *ChatbotListener) matchTrigger(w *webhook_model.Webhook, content string) bool {
	if w.TriggerType == "all" || w.TriggerType == "none" {
		return true
	}

	if w.TriggerType == "keyword" {
		switch w.TriggerOperator {
		case "equals":
			return strings.EqualFold(strings.TrimSpace(content), w.TriggerValue)
		case "contains":
			return strings.Contains(strings.ToLower(content), strings.ToLower(w.TriggerValue))
		case "startsWith":
			return strings.HasPrefix(strings.ToLower(content), strings.ToLower(w.TriggerValue))
		case "endsWith":
			return strings.HasSuffix(strings.ToLower(content), strings.ToLower(w.TriggerValue))
		case "regex":
			matched, err := regexp.MatchString(w.TriggerValue, content)
			if err != nil {
				return false
			}
			return matched
		}
	}

	if w.TriggerType == "advanced" {
		return strings.Contains(strings.ToLower(content), strings.ToLower(w.TriggerValue))
	}

	return false
}

func extractTextContent(msg *events.Message) string {
	if msg.Message == nil {
		return ""
	}

	if txt := msg.Message.GetConversation(); txt != "" {
		return txt
	}

	if ext := msg.Message.GetExtendedTextMessage(); ext != nil {
		if txt := ext.GetText(); txt != "" {
			return txt
		}
	}

	if msg.Message.GetAudioMessage() != nil {
		return "audioMessage"
	}

	return ""
}
