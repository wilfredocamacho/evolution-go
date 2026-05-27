package webhook_service

import (
	"encoding/json"
	"regexp"
	"strings"
	"sync"

	instance_model "github.com/EvolutionAPI/evolution-go/pkg/instance/model"
	logger_wrapper "github.com/EvolutionAPI/evolution-go/pkg/logger"
	"github.com/EvolutionAPI/evolution-go/pkg/webhook/model"
	"go.mau.fi/whatsmeow/types/events"
)

type SendTextFunc func(instanceID, remoteJid, text string) error

// MessageListener interface for whatsmeow injection.
type MessageListener interface {
	OnMessage(instance *instance_model.Instance, msg *events.Message)
}

type ChatbotListener struct {
	service    *WebhookService
	sessions   *SessionManager
	dispatcher *Dispatcher
	sendText   SendTextFunc
	logger     *logger_wrapper.LoggerManager
}

func NewChatbotListener(service *WebhookService, sessions *SessionManager, dispatcher *Dispatcher, sendText SendTextFunc, logger *logger_wrapper.LoggerManager) *ChatbotListener {
	return &ChatbotListener{
		service:    service,
		sessions:   sessions,
		dispatcher: dispatcher,
		sendText:   sendText,
		logger:     logger,
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

	// Extract LID/JID resolution fields from the message event.
	// senderPn is the phone JID (@s.whatsapp.net) when the sender's
	// server is a phone number JID. senderLid is the remoteJid itself
	// when the chat uses @lid.
	chatServer := msg.Info.Chat.Server
	senderServer := msg.Info.Sender.Server
	var senderPn, senderLid string
	if chatServer == "lid" {
		senderLid = remoteJid
		if senderServer == "s.whatsapp.net" {
			senderPn = msg.Info.Sender.String()
		}
	} else {
		senderPn = remoteJid
	}

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
