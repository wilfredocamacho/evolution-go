package webhook_service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/EvolutionAPI/evolution-go/pkg/webhook/model"
)

type Dispatcher struct {
	client *http.Client
}

func NewDispatcher() *Dispatcher {
	return &Dispatcher{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (d *Dispatcher) Dispatch(webhook *webhook_model.Webhook, payload map[string]interface{}) (string, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", webhook.WebhookURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	if webhook.BasicAuthUser != "" {
		req.SetBasicAuth(webhook.BasicAuthUser, webhook.BasicAuthPass)
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		snippet := string(body)
		if len(snippet) > 200 {
			snippet = snippet[:200]
		}
		return "", fmt.Errorf("webhook returned status %d: %s", resp.StatusCode, snippet)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		// Response is not JSON, might be empty
		return "", nil
	}

	// Try parsing n8n / common structures
	if data, ok := result["data"].(map[string]interface{}); ok {
		if output, ok := data["output"].(string); ok && output != "" {
			return output, nil
		}
		if answer, ok := data["answer"].(string); ok && answer != "" {
			return answer, nil
		}
	}
	if output, ok := result["output"].(string); ok && output != "" {
		return output, nil
	}
	if answer, ok := result["answer"].(string); ok && answer != "" {
		return answer, nil
	}

	return "", nil
}
