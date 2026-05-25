package webhook_handler

import (
	"net/http"

	webhook_service "github.com/EvolutionAPI/evolution-go/pkg/webhook/service"
	"github.com/gin-gonic/gin"
)

type WebhookHandler struct {
	service *webhook_service.WebhookService
}

func NewWebhookHandler(service *webhook_service.WebhookService) *WebhookHandler {
	return &WebhookHandler{service: service}
}

func (h *WebhookHandler) Create(ctx *gin.Context) {
	instanceID := ctx.Param("instanceId")
	if instanceID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "instanceId is required"})
		return
	}

	var data webhook_service.CreateWebhookDTO
	if err := ctx.ShouldBindJSON(&data); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	webhook, err := h.service.Create(instanceID, data)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "success", "data": webhook})
}

func (h *WebhookHandler) Find(ctx *gin.Context) {
	instanceID := ctx.Param("instanceId")
	if instanceID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "instanceId is required"})
		return
	}

	webhooks, err := h.service.FindByInstance(instanceID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "success", "data": webhooks})
}

func (h *WebhookHandler) Fetch(ctx *gin.Context) {
	webhookID := ctx.Param("webhookId")
	if webhookID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "webhookId is required"})
		return
	}

	webhook, err := h.service.FindByID(webhookID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "webhook not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "success", "data": webhook})
}

func (h *WebhookHandler) Update(ctx *gin.Context) {
	webhookID := ctx.Param("webhookId")
	if webhookID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "webhookId is required"})
		return
	}

	var data webhook_service.UpdateWebhookDTO
	if err := ctx.ShouldBindJSON(&data); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	webhook, err := h.service.Update(webhookID, data)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "success", "data": webhook})
}

func (h *WebhookHandler) Delete(ctx *gin.Context) {
	webhookID := ctx.Param("webhookId")
	if webhookID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "webhookId is required"})
		return
	}

	err := h.service.Delete(webhookID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "success"})
}

func (h *WebhookHandler) ChangeStatus(ctx *gin.Context) {
	var data webhook_service.ChangeStatusDTO
	if err := ctx.ShouldBindJSON(&data); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instanceID := ctx.GetString("instance")

	err := h.service.ChangeStatus(instanceID, data.RemoteJid, data.Status)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "success"})
}
