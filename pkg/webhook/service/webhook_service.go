package webhook_service

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"

	"github.com/EvolutionAPI/evolution-go/pkg/webhook/model"
	"github.com/EvolutionAPI/evolution-go/pkg/webhook/repository"
	"gorm.io/datatypes"
)

type WebhookService struct {
	repo     *webhook_repository.WebhookRepository
	sessions *SessionManager
}

type CreateWebhookDTO struct {
	Enabled         *bool    `json:"enabled"`
	Description     string   `json:"description"`
	WebhookURL      string   `json:"webhookUrl" binding:"required"`
	BasicAuthUser   string   `json:"basicAuthUser"`
	BasicAuthPass   string   `json:"basicAuthPass"`
	TriggerType     string   `json:"triggerType" binding:"required"`
	TriggerOperator string   `json:"triggerOperator"`
	TriggerValue    string   `json:"triggerValue"`
	KeywordFinish   string   `json:"keywordFinish"`
	Expire          *int     `json:"expire"`
	ListeningFromMe *bool    `json:"listeningFromMe"`
	StopBotFromMe   *bool    `json:"stopBotFromMe"`
	IsTrusted       *bool    `json:"isTrusted"`
	IgnoreJids      []string `json:"ignoreJids"`
}

type UpdateWebhookDTO = CreateWebhookDTO

type ChangeStatusDTO struct {
	RemoteJid string `json:"remoteJid" binding:"required"`
	Status    string `json:"status" binding:"required,oneof=closed"`
}

func NewWebhookService(repo *webhook_repository.WebhookRepository, sessionManager *SessionManager) *WebhookService {
	return &WebhookService{repo: repo, sessions: sessionManager}
}

func (s *WebhookService) Create(instanceID string, data CreateWebhookDTO) (*webhook_model.Webhook, error) {
	if err := s.validateTrigger(data.TriggerType, data.TriggerOperator, data.TriggerValue, instanceID, ""); err != nil {
		return nil, err
	}

	ignoreJidsBytes, _ := json.Marshal(data.IgnoreJids)
	if len(data.IgnoreJids) == 0 {
		ignoreJidsBytes = []byte("[]")
	}

	enabled := true
	if data.Enabled != nil {
		enabled = *data.Enabled
	}

	expire := 300
	if data.Expire != nil {
		expire = *data.Expire
	}

	listeningFromMe := false
	if data.ListeningFromMe != nil {
		listeningFromMe = *data.ListeningFromMe
	}

	stopBotFromMe := false
	if data.StopBotFromMe != nil {
		stopBotFromMe = *data.StopBotFromMe
	}

	isTrusted := false
	if data.IsTrusted != nil {
		isTrusted = *data.IsTrusted
	}

	webhook := &webhook_model.Webhook{
		InstanceID:      instanceID,
		Enabled:         enabled,
		Description:     data.Description,
		WebhookURL:      data.WebhookURL,
		BasicAuthUser:   data.BasicAuthUser,
		BasicAuthPass:   data.BasicAuthPass,
		TriggerType:     data.TriggerType,
		TriggerOperator: data.TriggerOperator,
		TriggerValue:    data.TriggerValue,
		KeywordFinish:   data.KeywordFinish,
		Expire:          expire,
		ListeningFromMe: listeningFromMe,
		StopBotFromMe:   stopBotFromMe,
		IsTrusted:       isTrusted,
		IgnoreJids:      datatypes.JSON(ignoreJidsBytes),
	}

	if err := s.repo.Create(webhook); err != nil {
		return nil, err
	}
	return webhook, nil
}

func (s *WebhookService) FindByInstance(instanceID string) ([]webhook_model.Webhook, error) {
	return s.repo.FindByInstance(instanceID)
}

func (s *WebhookService) FindByID(id string) (*webhook_model.Webhook, error) {
	return s.repo.FindByID(id)
}

func (s *WebhookService) Update(id string, data UpdateWebhookDTO) (*webhook_model.Webhook, error) {
	webhook, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	triggerType := data.TriggerType
	triggerOperator := data.TriggerOperator
	triggerValue := data.TriggerValue

	if triggerType == "" {
		triggerType = webhook.TriggerType
	}
	if triggerOperator == "" {
		triggerOperator = webhook.TriggerOperator
	}
	if triggerValue == "" {
		triggerValue = webhook.TriggerValue
	}

	if err := s.validateTrigger(triggerType, triggerOperator, triggerValue, webhook.InstanceID, id); err != nil {
		return nil, err
	}

	if data.Enabled != nil {
		webhook.Enabled = *data.Enabled
	}
	if data.Description != "" {
		webhook.Description = data.Description
	}
	if data.WebhookURL != "" {
		webhook.WebhookURL = data.WebhookURL
	}
	if data.BasicAuthUser != "" {
		webhook.BasicAuthUser = data.BasicAuthUser
	}
	if data.BasicAuthPass != "" {
		webhook.BasicAuthPass = data.BasicAuthPass
	}
	if data.TriggerType != "" {
		webhook.TriggerType = data.TriggerType
	}
	if data.TriggerOperator != "" {
		webhook.TriggerOperator = data.TriggerOperator
	}
	if data.TriggerValue != "" {
		webhook.TriggerValue = data.TriggerValue
	}
	if data.KeywordFinish != "" {
		webhook.KeywordFinish = data.KeywordFinish
	}
	if data.Expire != nil {
		webhook.Expire = *data.Expire
	}
	if data.ListeningFromMe != nil {
		webhook.ListeningFromMe = *data.ListeningFromMe
	}
	if data.StopBotFromMe != nil {
		webhook.StopBotFromMe = *data.StopBotFromMe
	}
	if data.IsTrusted != nil {
		webhook.IsTrusted = *data.IsTrusted
	}
	if data.IgnoreJids != nil {
		ignoreJidsBytes, _ := json.Marshal(data.IgnoreJids)
		webhook.IgnoreJids = datatypes.JSON(ignoreJidsBytes)
	}

	if err := s.repo.Update(webhook); err != nil {
		return nil, err
	}
	return webhook, nil
}

func (s *WebhookService) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *WebhookService) ListSessions(instanceID string) []*Session {
	return s.sessions.ListByInstanceID(instanceID)
}

func (s *WebhookService) ChangeStatus(instanceId, remoteJid, status string) error {
	if status == "closed" {
		s.sessions.CloseSessionByRemoteJid(remoteJid)
	} else {
		return errors.New("invalid status")
	}
	return nil
}

func (s *WebhookService) FindByInstanceAndEnabled(instanceID string) ([]webhook_model.Webhook, error) {
	return s.repo.FindByInstanceAndEnabled(instanceID)
}

func (s *WebhookService) validateTrigger(triggerType, triggerOperator, triggerValue, instanceID, excludeID string) error {
	switch triggerType {
	case "all":
		// only one 'all' trigger per instance
		existing, err := s.repo.FindByInstance(instanceID)
		if err != nil {
			return err
		}
		for _, w := range existing {
			if excludeID != "" && w.ID == excludeID {
				continue
			}
			if w.TriggerType == "all" {
				return errors.New("only one 'all' trigger is allowed per instance")
			}
		}
	case "keyword":
		if triggerValue == "" {
			return errors.New("triggerValue is required for keyword trigger")
		}
		switch triggerOperator {
		case "equals", "contains", "startsWith", "endsWith":
			// valid
		case "regex":
			if _, err := regexp.Compile(triggerValue); err != nil {
				return fmt.Errorf("invalid regex in triggerValue: %w", err)
			}
		case "":
			return errors.New("triggerOperator is required for keyword trigger")
		default:
			return fmt.Errorf("invalid triggerOperator '%s' for keyword trigger", triggerOperator)
		}
	case "advanced":
		if triggerValue == "" {
			return errors.New("triggerValue is required for advanced trigger")
		}
	case "":
		return errors.New("triggerType is required")
	default:
		return fmt.Errorf("invalid triggerType '%s' (must be all, keyword, or advanced)", triggerType)
	}
	return nil
}

func ptr[T any](v T) *T {
	return &v
}
