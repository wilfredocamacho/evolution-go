# Design: Multi-webhook con Triggers Regex y Sistema de Sesiones

## Architecture Overview

```
WhatsApp Message
  → mycli.myEventHandler() [existing]
    → CallWebhook() [existing single webhook - unchanged]
      → sendToQueueOrWebhook() [RabbitMQ, NATS, WebSocket, single-webhook]
    → NEW: ChatbotListener.OnMessage()
      → Load all enabled webhooks for instance
      → For each webhook:
          Check session (in-memory)
          Match trigger if no session
          POST to webhook URL
          Receive response
          SendText() back to WhatsApp
```

## Package Structure

```
pkg/webhook/
├── handler/
│   └── webhook_handler.go       # CRUD HTTP endpoints + change-status
├── service/
│   ├── webhook_service.go        # CRUD business logic
│   ├── listener.go               # Message event listener
│   ├── dispatcher.go             # HTTP dispatch to webhooks + response handling
│   └── session_manager.go        # In-memory session store + timeout cleanup
├── model/
│   └── webhook_model.go          # WebhookConfig struct, Session struct
└── repository/
    └── webhook_repository.go     # GORM database operations
```

## Data Models

### WebhookConfig (PostgreSQL via GORM)

```go
type Webhook struct {
    ID              string         `gorm:"type:uuid;primaryKey" json:"id"`
    InstanceID      string         `gorm:"index;not null" json:"instanceId"`
    Enabled         bool           `gorm:"default:true" json:"enabled"`
    Description     string         `json:"description"`
    WebhookURL      string         `json:"webhookUrl"`
    BasicAuthUser   string         `json:"basicAuthUser"`
    BasicAuthPass   string         `json:"basicAuthPass"`
    
    // Trigger definition
    TriggerType     string         `json:"triggerType"`     // all|keyword|advanced
    TriggerOperator string         `json:"triggerOperator"` // equals|contains|startsWith|endsWith|regex
    TriggerValue    string         `json:"triggerValue"`
    
    // Session behavior
    KeywordFinish   string         `json:"keywordFinish"`
    Expire          int            `json:"expire"`          // timeout seconds, default 300 (5 min)
    
    // Message filters
    ListeningFromMe bool           `gorm:"default:false" json:"listeningFromMe"`
    StopBotFromMe   bool           `gorm:"default:false" json:"stopBotFromMe"`
    IgnoreJids      datatypes.JSON `json:"ignoreJids"`
    
    CreatedAt       time.Time      `json:"createdAt" gorm:"autoCreateTime"`
    UpdatedAt       time.Time      `json:"updatedAt" gorm:"autoUpdateTime"`
}
```

### Session (in-memory)

```go
type Session struct {
    SessionID   string    // key: webhookID + ":" + remoteJid
    RemoteJid   string    // WhatsApp JID
    PushName    string
    Status      string    // opened|closed
    WebhookID   string
    InstanceID  string
    CreatedAt   time.Time
    LastActive  time.Time
}
```

## Session Manager

```go
type SessionManager struct {
    mu       sync.RWMutex
    sessions map[string]*Session // key: "webhookID:remoteJid"
}

func NewSessionManager() *SessionManager
func (sm *SessionManager) Get(webhookID, remoteJid string) *Session
func (sm *SessionManager) CreateOrGet(webhookID, remoteJid, pushName, instanceID string) *Session
func (sm *SessionManager) CloseSession(remoteJid string)    // set status=closed for all sessions with this remoteJid
func (sm *SessionManager) DeleteSession(remoteJid string)   // remove all sessions for this remoteJid
func (sm *SessionManager) Touch(webhookID, remoteJid string) // update LastActive
func (sm *SessionManager) StartCleanup(interval time.Duration) // goroutine to remove expired sessions
```

### Cleanup goroutine
- Runs every 60s
- Iterates all sessions
- If `time.Since(session.LastActive) > expire` (default 300s = 5 min) → delete session
- If session status == `closed` → delete session

## Trigger Evaluation

### Order (matching evolution-api reference)
1. `all` / `none` — matches any message (only one `all` webhook allowed per instance)
2. `advanced` — composite operators (contains:word, notcontains:word)
3. `keyword` + `equals` — exact match
4. `keyword` + `regex` — regex test
5. `keyword` + `startsWith` — prefix match
6. `keyword` + `endsWith` — suffix match
7. `keyword` + `contains` — substring match

### All webhooks with matching triggers fire simultaneously (user decision)

## Message Flow (Listener)

```
func (l *ChatbotListener) OnMessage(instance, remoteJid, pushName, content, msg)
  1. Load all enabled webhooks for instance
  2. For each webhook:
     a. Check ignoreJids, listeningFromMe, stopBotFromMe
     b. Get session: sessions[webhookID + ":" + remoteJid]
     c. If session exists AND status == "opened":
        - Touch session (update LastActive)
        - Dispatch to webhook (skip trigger check)
        - On response: SendText(remoteJid, response)
     d. If no session OR session status == "closed":
        - Evaluate trigger against content
        - If match:
          - Create new session (opened)
          - Dispatch to webhook
          - On response: SendText(remoteJid, response)
        - If no match: skip
     e. If session status == "paused": skip
  3. Check keywordFinish for each webhook with open session:
     - If content == keywordFinish: close/delete session
```

## Webhook Dispatch (Dispatcher)

```go
func (d *Dispatcher) Dispatch(webhook *model.Webhook, payload map[string]interface{}) (string, error)
  1. Prepare payload:
     {
       "chatInput": content,
       "sessionId": session.sessionId,
       "remoteJid": remoteJid,
       "pushName": pushName,
       "instanceName": instance.Name,
       "instanceId": instance.Id,
       "apiKey": instance.Token
     }
  2. Add Basic Auth header if configured
  3. POST to webhook.WebhookURL with timeout (30s)
  4. Parse response:
     - response.data.output
     - response.data.answer
     - response.output
     - response.answer
  5. Return text response (or empty if no response)
```

### Audio Messages
- When content contains `audioMessage` → trigger Whisper transcription before dispatch
- Prefixed as `[audio] transcripción` in `chatInput` payload

## API Endpoints

All under `/webhook/` group:

### Admin endpoints (requires GlobalApiKey)
| Method | Path | Description |
|--------|------|-------------|
| POST   | `/webhook/create` | Create new webhook config |
| GET    | `/webhook/find` | List all webhooks for instance |
| GET    | `/webhook/fetch/:webhookId` | Get single webhook |
| PUT    | `/webhook/update/:webhookId` | Update webhook config |
| DELETE | `/webhook/delete/:webhookId` | Delete webhook (+ its sessions) |
| POST   | `/webhook/ignore-jid` | Add/remove JID from ignore list |

### Instance token endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST   | `/webhook/change-status` | Close/delete sessions for remoteJid |

### Change Status Request/Response
```
POST /webhook/change-status
Body: { "remoteJid": "5511999999999@s.whatsapp.net", "status": "closed"|"delete" }
- "closed" → mark session as closed (can be reopened on next trigger match)
- "delete" → remove session from memory entirely
```

## Integration Points

### 1. whatsmeowService changes
- Add `SetChatbotListener(listener)` method
- Store reference to `ChatbotListener` in `whatsmeowService`
- Pass through to `MyClient`

### 2. myEventHandler changes
- After existing message processing, call:
  ```go
  if mycli.chatbotListener != nil && doWebhook {
      mycli.chatbotListener.OnMessage(...)
  }
  ```

### 3. main.go changes
- Initialize `webhookRepository`, `webhookService`, `webhookHandler`
- Initialize `sessionManager` and `chatbotListener`
- Pass `chatbotListener` to `whatsmeowService`

## WebhookCreateRequest Payload

```json
{
  "enabled": true,
  "description": "Soporte al cliente",
  "webhookUrl": "https://n8n.midominio.com/webhook/abc123",
  "basicAuthUser": "user",
  "basicAuthPass": "pass",
  "triggerType": "keyword",
  "triggerOperator": "contains",
  "triggerValue": "ayuda",
  "keywordFinish": "salir",
  "expire": 300,
  "listeningFromMe": false,
  "stopBotFromMe": false,
  "ignoreJids": ["5551999999999@s.whatsapp.net"]
}
```

## Key Files to Modify

| File | Change |
|------|--------|
| `pkg/routes/routes.go` | Add WebhookHandler field + routes |
| `pkg/whatsmeow/service/whatsmeow.go` | Add chatbot listener reference + `SetChatbotListener()` |
| `cmd/evolution-go/main.go` | Initialize webhook package + inject into whatsmeowService |

## New Files to Create

| File | Purpose |
|------|---------|
| `pkg/webhook/model/webhook_model.go` | Webhook, Session structs |
| `pkg/webhook/repository/webhook_repository.go` | GORM CRUD |
| `pkg/webhook/service/webhook_service.go` | Business logic |
| `pkg/webhook/service/listener.go` | Message event listener |
| `pkg/webhook/service/dispatcher.go` | Webhook HTTP dispatch |
| `pkg/webhook/service/session_manager.go` | In-memory sessions |
| `pkg/webhook/handler/webhook_handler.go` | HTTP endpoints |

## Migration (AutoMigrate)
```go
db.AutoMigrate(&webhook_model.Webhook{})
```

## Rollback Plan
- Delete `pkg/webhook/` directory
- Revert changes to `routes.go`, `whatsmeow.go`, `main.go`
- No schema migration needed (new table only)
- In-memory sessions have no persistence to clean
