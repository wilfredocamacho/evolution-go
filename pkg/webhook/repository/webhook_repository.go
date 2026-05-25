package webhook_repository

import (
	"github.com/EvolutionAPI/evolution-go/pkg/webhook/model"
	"gorm.io/gorm"
)

type WebhookRepository struct {
	db *gorm.DB
}

func NewWebhookRepository(db *gorm.DB) *WebhookRepository {
	return &WebhookRepository{db: db}
}

func (r *WebhookRepository) FindByInstance(instanceID string) ([]webhook_model.Webhook, error) {
	var webhooks []webhook_model.Webhook
	err := r.db.Where("instance_id = ?", instanceID).Find(&webhooks).Error
	return webhooks, err
}

func (r *WebhookRepository) FindByID(id string) (*webhook_model.Webhook, error) {
	var webhook webhook_model.Webhook
	err := r.db.First(&webhook, id).Error
	if err != nil {
		return nil, err
	}
	return &webhook, nil
}

func (r *WebhookRepository) Create(webhook *webhook_model.Webhook) error {
	return r.db.Create(webhook).Error
}

func (r *WebhookRepository) Update(webhook *webhook_model.Webhook) error {
	return r.db.Save(webhook).Error
}

func (r *WebhookRepository) Delete(id string) error {
	return r.db.Delete(&webhook_model.Webhook{}, id).Error
}

func (r *WebhookRepository) FindByInstanceAndEnabled(instanceID string) ([]webhook_model.Webhook, error) {
	var webhooks []webhook_model.Webhook
	err := r.db.Where("instance_id = ? AND enabled = ?", instanceID, true).Find(&webhooks).Error
	return webhooks, err
}
