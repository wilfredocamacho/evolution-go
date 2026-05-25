# Implement: Multi-webhook con Triggers Regex y Sistema de Sesiones

## Phase Order
1. **Foundation**: model + repository (DB migration safe)
2. **Session Manager**: in-memory (no deps)
3. **Webhook Service**: CRUD business logic
4. **Dispatcher**: HTTP dispatch + response handling
5. **Listener**: event hook integration
6. **Handler + Routes**: API endpoints
7. **main.go wiring**: dependency injection
8. **Tests**: manual validation
9. **Docs**: API + architecture docs using skill `docs`

---

## Phase 1: Model + Repository

### Files
- `pkg/webhook/model/webhook_model.go`
- `pkg/webhook/repository/webhook_repository.go`

### Model
```go
// pkg/webhook/model/webhook_model.go
package webhook_model

import (
    "time"
    "github.com/google/uuid"
    "gorm.io/gorm"
    "gorm.io/datatypes"
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
```

### Repository
- `FindByInstance(instanceID string) ([]Webhook, error)`
- `FindByID(id string) (*Webhook, error)`
- `Create(webhook *Webhook) error`
- `Update(webhook *Webhook) error`
- `Delete(id string) error`
- `FindByInstanceAndEnabled(instanceID string) ([]Webhook, error)` — for listener

### Validation
- `triggerType` in: `all`, `keyword`, `advanced`
- `triggerOperator` required when `keyword`: `equals`, `contains`, `startsWith`, `endsWith`, `regex`
- `triggerValue` required when `keyword` or `advanced`
- Only one `all` trigger per instance (enforced in service)

---

## Phase 2: Session Manager

### File
- `pkg/webhook/service/session_manager.go`

### Structs
```go
type Session struct {
    SessionID  string
    RemoteJid  string
    PushName   string
    Status     string    // opened, closed
    WebhookID  string
    InstanceID string
    CreatedAt  time.Time
    LastActive time.Time
}

type SessionManager struct {
    mu       sync.RWMutex
    sessions map[string]*Session
    stopCh   chan struct{}
}
```

### Methods
- `NewSessionManager() *SessionManager`
- `Get(webhookID, remoteJid string) *Session`
- `CreateOrGet(webhookID, remoteJid, pushName, instanceID string) *Session` — if exists and opened, return; else create
- `CloseSession(remoteJid string)` — set all sessions with this remoteJid to "closed"
- `DeleteSession(remoteJid string)` — remove all sessions for this remoteJid
- `Touch(webhookID, remoteJid string)` — update LastActive
- `StartCleanup(defaultExpire time.Duration)` — goroutine, runs every 60s, removes expired sessions
- `StopCleanup()` — signal goroutine to stop

### Expiry logic
- If `time.Since(session.LastActive) > expire` → delete session

---

## Phase 3: Webhook Service

### File
- `pkg/webhook/service/webhook_service.go`

### Struct
```go
type WebhookService struct {
    repo    *webhook_repository.WebhookRepository
    sessions *SessionManager
}
```

### Methods
- `NewWebhookService(repo, sessionManager) *WebhookService`
- `Create(instanceID string, data CreateWebhookDTO) (*webhook_model.Webhook, error)`
  - Validate trigger uniqueness (no duplicate triggerValue+triggerOperator per instance)
  - Validate only one `all` trigger per instance
  - Set defaults (expire=300, enabled=true)
- `FindByInstance(instanceID string) ([]webhook_model.Webhook, error)`
- `FindByID(id string) (*webhook_model.Webhook, error)`
- `Update(id string, data UpdateWebhookDTO) (*webhook_model.Webhook, error)`
  - Same validation as Create
- `Delete(id string) error`
  - Also remove sessions for this webhook
- `ChangeStatus(remoteJid string, status string) error`
  - "closed" → CloseSession
  - "delete" → DeleteSession

### DTOs
```go
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
    ListeningFromMe *bool   `json:"listeningFromMe"`
    StopBotFromMe   *bool   `json:"stopBotFromMe"`
    IgnoreJids      []string `json:"ignoreJids"`
}

type UpdateWebhookDTO = CreateWebhookDTO // same fields but all optional

type ChangeStatusDTO struct {
    RemoteJid string `json:"remoteJid" binding:"required"`
    Status    string `json:"status" binding:"required,oneof=closed delete"`
}
```

---

## Phase 4: Dispatcher

### File
- `pkg/webhook/service/dispatcher.go`

### Struct
```go
type Dispatcher struct {
    client *http.Client
}

func NewDispatcher() *Dispatcher
func (d *Dispatcher) Dispatch(webhook *webhook_model.Webhook, payload map[string]interface{}) (string, error)
```

### Dispatch Logic
1. Prepare JSON payload:
   ```json
   {
     "chatInput": "<message content>",
     "sessionId": "<remoteJid>",
     "remoteJid": "<remoteJid>",
     "pushName": "<pushName>",
     "instanceName": "<instance.Name>",
     "instanceId": "<instance.Id>",
     "apiKey": "<instance.Token>"
   }
   ```
2. If `webhook.BasicAuthUser` set → add `Authorization: Basic` header
3. POST to `webhook.WebhookURL` with timeout 30s
4. Parse response looking for: `response.data.output`, `response.data.answer`, `response.output`, `response.answer`
5. Return response text (or empty string if no response)

---

## Phase 5: Listener

### File
- `pkg/webhook/service/listener.go`

### Struct
```go
type ChatbotListener struct {
    service  *WebhookService
    sessions *SessionManager
    dispatcher *Dispatcher
    sendText  SendTextFunc   // callback to send WhatsApp message
    logger    *logger.Logger
}

type SendTextFunc func(instanceID, remoteJid, text string) error
```

### Method
```go
func (l *ChatbotListener) OnMessage(instance *instance_model.Instance, remoteJid string, pushName string, content string, msg interface{})
```

### Flow per webhook
1. Load enabled webhooks for instance
2. For each webhook:
   a. Check ignoreJids → skip if remoteJid in list or matches group/contact filter
   b. Check listeningFromMe → skip if message is from me and !ListeningFromMe
   c. Get session: `sessions.Get(webhook.ID, remoteJid)`
   d. If session exists and status == "opened":
      - Touch session
      - Check keywordFinish → if matches, close/delete session, skip
      - Dispatch to webhook
      - On response: call sendText(remoteJid, response)
   e. If no session or session status == "closed":
      - Evaluate trigger match
      - If match: CreateOrGet session → Dispatch → sendText
      - If no match: skip
   f. If session status == "paused": skip

### Trigger Match Logic
- `all`/`none` → always match
- `advanced` → parse composite operators (like evolution-api's advancedOperatorsSearch)
- `keyword:equals` → content == triggerValue
- `keyword:regex` → regexp.MatchString(triggerValue, content)
- `keyword:startsWith` → strings.HasPrefix(content, triggerValue)
- `keyword:endsWith` → strings.HasSuffix(content, triggerValue)
- `keyword:contains` → strings.Contains(content, triggerValue)

### Audio Detection
- If `content` contains `audioMessage` and msg has audio → transcribe
- Use existing openai/whisper service if available
- Prefix as `[audio] transcription` in chatInput

---

## Phase 6: Handler + Routes

### Files
- `pkg/webhook/handler/webhook_handler.go`

### Endpoints

```go
type WebhookHandler struct {
    service *WebhookService
}

func NewWebhookHandler(service *WebhookService) *WebhookHandler

// POST /webhook/create — admin
func (h *WebhookHandler) Create(ctx *gin.Context)

// GET /webhook/find — admin
func (h *WebhookHandler) Find(ctx *gin.Context)

// GET /webhook/fetch/:webhookId — admin
func (h *WebhookHandler) Fetch(ctx *gin.Context)

// PUT /webhook/update/:webhookId — admin
func (h *WebhookHandler) Update(ctx *gin.Context)

// DELETE /webhook/delete/:webhookId — admin
func (h *WebhookHandler) Delete(ctx *gin.Context)

// POST /webhook/change-status — instance token
func (h *WebhookHandler) ChangeStatus(ctx *gin.Context)
```

### Route Registration
In `pkg/routes/routes.go`:
- Add `webhookHandler` field to `Routes` struct
- Add to `NewRouter()` constructor
- Add routes in `AssignRoutes()`:
  ```go
  routes := eng.Group("/webhook")
  {
      routes.Use(r.authMiddleware.AuthAdmin)  // admin CRUD
      {
          routes.POST("/create", r.webhookHandler.Create)
          routes.GET("/find", r.webhookHandler.Find)
          routes.GET("/fetch/:webhookId", r.webhookHandler.Fetch)
          routes.PUT("/update/:webhookId", r.webhookHandler.Update)
          routes.DELETE("/delete/:webhookId", r.webhookHandler.Delete)
      }
  }
  // change-status uses instance token (Auth middleware)
  eng.Group("/webhook").Use(r.authMiddleware.Auth).POST("/change-status", r.webhookHandler.ChangeStatus)
  ```

---

## Phase 7: main.go Wiring

In `cmd/evolution-go/main.go`:

1. Create webhook repository:
   ```go
   webhookRepo := webhook_repository.NewWebhookRepository(db)
   ```

2. Create session manager:
   ```go
   sessionManager := webhook_service.NewSessionManager()
   sessionManager.StartCleanup(5 * time.Minute)
   defer sessionManager.StopCleanup()
   ```

3. Create webhook service:
   ```go
   webhookSvc := webhook_service.NewWebhookService(webhookRepo, sessionManager)
   ```

4. Create dispatcher:
   ```go
   dispatcher := webhook_service.NewDispatcher()
   ```

5. Create chatbot listener:
   ```go
   sendTextFunc := func(instanceID, remoteJid, text string) error {
       // Use sendMessageService to send text
       instance, err := instanceService.Info(instanceID)
       if err != nil { return err }
       _, err = sendMessageService.SendText(&send_service.TextStruct{
           Number: remoteJid,
           Text:   text,
       }, instance)
       return err
   }
   listener := webhook_service.NewChatbotListener(webhookSvc, sessionManager, dispatcher, sendTextFunc, loggerWrapper)
   ```

6. Inject into whatsmeow service:
   ```go
   whatsmeowService.SetChatbotListener(listener)
   ```

7. Create webhook handler:
   ```go
   webhookHandler := webhook_handler.NewWebhookHandler(webhookSvc)
   ```

8. Add to routes:
   ```go
   routes.NewRouter(
       ...,
       webhookHandler,
   ).AssignRoutes(r)
   ```

### whatsmeowService Changes
- Add `chatbotListener` field
- Add `SetChatbotListener(listener)` method
- In `myEventHandler`, after existing webhook dispatch, call:
  ```go
  if mycli.chatbotListener != nil && postMap["event"] == "Message" {
      // Extract data from postMap
      mycli.chatbotListener.OnMessage(...)
  }
  ```

---

## Phase 8: Manual Validation

1. Build: `go build ./cmd/evolution-go`
2. Create instance → create webhook → send matching message → verify:
   - Webhook receives POST with correct payload
   - Response is sent back to WhatsApp
   - Session is created in memory
3. Send second message → verify it goes directly (no trigger re-check)
4. Send keywordFinish → verify session closes
5. Call change-status → verify session closes/removes
6. Wait 5 min → verify session auto-cleanup
7. Verify existing single webhook still works independently

---

## Phase 9: Documentation

Use `docs` skill to create:

- `docs/architecture/webhook-sessions.md` — flow diagram, architecture
- `docs/codebase/webhook-package.md` — file structure, key types
- `docs/project-pdr/webhook-api.md` — API reference with request/response examples
- `docs/project-pdr/n8n-integration.md` — guide for connecting n8n

---

## Files Summary

| # | Action | File |
|---|--------|------|
| 1 | CREATE | `pkg/webhook/model/webhook_model.go` |
| 2 | CREATE | `pkg/webhook/repository/webhook_repository.go` |
| 3 | CREATE | `pkg/webhook/service/session_manager.go` |
| 4 | CREATE | `pkg/webhook/service/webhook_service.go` |
| 5 | CREATE | `pkg/webhook/service/dispatcher.go` |
| 6 | CREATE | `pkg/webhook/service/listener.go` |
| 7 | CREATE | `pkg/webhook/handler/webhook_handler.go` |
| 8 | MODIFY | `pkg/routes/routes.go` |
| 9 | MODIFY | `pkg/whatsmeow/service/whatsmeow.go` |
| 10 | MODIFY | `cmd/evolution-go/main.go` |
| 11 | CREATE | docs (multiple files) |

---

## Risks

- **SendText dependency**: Listener needs `SendText` which requires instance object. Circular dependency risk. Solution: use a callback function (SendTextFunc) instead of direct service reference.
- **Event data extraction**: The `myEventHandler` serializes to JSON via `postMap`. We need to extract message content, remoteJid, pushName from the raw event. Solution: parse the `*events.Message` struct directly in the listener.
- **Whisper transcription**: Requires OpenAI service. May not be available. Solution: skip transcription if service unavailable, pass content as-is.
