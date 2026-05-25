package webhook_model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Webhook struct {
	ID              string         `gorm:"type:uuid;primaryKey" json:"id"`
	InstanceID      string         `gorm:"index;not null" json:"instanceId"`
	Enabled         bool           `gorm:"default:true" json:"enabled"`
	Description     string         `json:"description"`
	WebhookURL      string         `json:"webhookUrl"`
	BasicAuthUser   string         `json:"basicAuthUser"`
	BasicAuthPass   string         `json:"basicAuthPass"`
	TriggerType     string         `json:"triggerType"`
	TriggerOperator string         `json:"triggerOperator"`
	TriggerValue    string         `json:"triggerValue"`
	KeywordFinish   string         `json:"keywordFinish"`
	Expire          int            `gorm:"default:300" json:"expire"`
	ListeningFromMe bool           `gorm:"default:false" json:"listeningFromMe"`
	StopBotFromMe   bool           `gorm:"default:false" json:"stopBotFromMe"`
	IgnoreJids      datatypes.JSON `json:"ignoreJids"`
	CreatedAt       time.Time      `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt       time.Time      `json:"updatedAt" gorm:"autoUpdateTime"`
}

func (w *Webhook) BeforeCreate(tx *gorm.DB) error {
	if w.ID == "" {
		w.ID = uuid.New().String()
	}
	return nil
}
