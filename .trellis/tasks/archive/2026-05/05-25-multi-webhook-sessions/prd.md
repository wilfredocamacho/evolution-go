# PRD: Multi-webhook con Triggers Regex y Sistema de Sesiones

## Goal
Reemplazar el webhook único actual por un sistema multi-webhook donde cada webhook tiene su propio trigger (regex/palabra) y URL. Cada instancia puede tener N webhooks configurados. Cuando un mensaje entrante coincide con un trigger, se dispara el webhook correspondiente y se crea una sesión para ese número de WhatsApp.

## User Value
- Flexibilidad total: diferentes webhooks para diferentes tipos de mensajes
- Integración con n8n y otros servicios sin depender de un solo endpoint
- Sesiones permiten trackear conversaciones activas vs cerradas
- Reemplaza la necesidad de un chatbot externo para enrutamiento básico

## Confirmed Facts (from codebase inspection)

### Reference: evolution-api N8n integration
- **Modelo N8n**: `enabled`, `description`, `webhookUrl`, `basicAuthUser`, `basicAuthPass`, `triggerType` (all|keyword|none|advanced), `triggerOperator` (equals|contains|startsWith|endsWith|regex), `triggerValue`, `keywordFinish`, `expire`, `delayMessage`, `unknownMessage`, `listeningFromMe`, `stopBotFromMe`, `keepOpen`, `debounceTime`, `ignoreJids`, `splitMessages`, `timePerChar`
- **IntegrationSession**: `sessionId` (unique), `remoteJid`, `pushName`, `status` (opened|closed|paused), `awaitUser`, `type`, `botId`, `instanceId`
- CRUD completo para bots (create, find, fetch, update, delete), settings, sessions, status change, ignoreJid
- **Trigger match order**: `all/none` → `advanced` → `keyword:equals` → `keyword:regex` → `keyword:startsWith` → `keyword:endsWith` → `keyword:contains`
- **ChangeStatus**: endpoint con `{ remoteJid, status: "closed"|"delete" }` — close marca sesión como cerrada, delete la elimina

### Current Evolution Go webhook
- `Instance.Webhook` (string) — single webhook URL per instance
- `WebhookUrl` in `CreateStruct` — set at instance creation
- Webhook dispatch via `CallWebhook` → `sendToQueueOrWebhook`
- Message events flow: `myEventHandler` → `CallWebhook` → `sendToQueueOrWebhook` → rabbitmq/nats/websocket/single-webhook

### Project structure
- Layered pattern: `/handler/`, `/service/`, `/model/`, `/repository/`
- GORM + PostgreSQL
- Gin HTTP framework
- `pkg/instance/` manages instance lifecycle
- Events dispatched via webhook/rabbitmq/nats producers
- SendMessage service has `SendText()` for programmatic replies

## Confirmed Decisions (from brainstorming)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multiple webhooks match | **Todos los que coincidan** | Cada webhook que haga match recibe el mensaje. Para logging + acción simultánea |
| Session storage | **En memoria** | Simple, rápido. Se pierde al reiniciar. Sesiones mueren con el servidor |
| Auto-close | **API endpoint + Timeout 5 min** | Punto final HTTP para cerrar sesión manual + timeout automático de inactividad (5 min) |
| Integration point | **Nuevo productor independiente** | No toca el pipeline existente. Se registra como capa separada en la cadena de eventos |
| Chatbot flow | **Completo (bidireccional)** | POST a webhook → recibe respuesta → reenvía al WhatsApp |
| Existing webhook | **Se mantiene** | El webhook único actual sigue funcionando para eventos generales. El nuevo sistema es chatbot-only |

## Requirements

### Webhook Management (CRUD) — nuevo package `pkg/webhook/`
- [ ] Admin puede crear múltiples webhooks por instancia
- [ ] Cada webhook tiene: URL, trigger definition (type + operator + value), optional basic auth, enabled/disabled
- [ ] Trigger types: `all` (todos los mensajes), `keyword` (match con operador), `advanced` (operadores compuestos)
- [ ] Trigger operators: `equals`, `contains`, `startsWith`, `endsWith`, `regex`
- [ ] Orden de evaluación de triggers: `all` → `advanced` → `keyword:equals` → `keyword:regex` → `keyword:startsWith` → `keyword:endsWith` → `keyword:contains`
- [ ] Update, delete, list webhooks per instance

### Message Dispatch & Chatbot
- [ ] Capa independiente (ChatbotListener) se registra en `myEventHandler`
- [ ] Cuando llega mensaje MESSAGE, evalúa todos los webhooks enabled de la instancia
- [ ] Si no existe sesión → evaluar trigger. Si match → crear sesión + POST a webhook URL
- [ ] Si existe sesión (opened) → POST directo (saltar trigger check)
- [ ] Payload incluye: message content, sender, session info, instance info
- [ ] Basic auth opcional por webhook
- [ ] Recibir respuesta del webhook → reenviar a WhatsApp via `SendText`
- [ ] Audio messages: transcribir con Whisper antes de enviar al webhook

### Session System (in-memory)
- [ ] Mapa en memoria: `map[webhookID + remoteJid]*Session`
- [ ] Session struct: sessionId, remoteJid, pushName, status, webhookID, instanceID, createdAt, lastActive
- [ ] Estados: `opened`, `closed`
- [ ] Crear sesión cuando trigger match y no existe
- [ ] Cerrar sesión vía API: `POST /webhook/change-status` con `{ remoteJid, status: "closed"|"delete" }`
- [ ] Cerrar sesión cuando llega `keywordFinish`
- [ ] Cerrar sesión tras 5 minutos de inactividad (timeout por goroutine)
- [ ] `delete` → remover del mapa; `closed` → marcar como cerrada (para no reabrir automáticamente)

### Edge Cases
- [ ] Webhook delivery failures (retry con backoff, como webhook_producer actual)
- [ ] IgnoreJids por webhook (lista de JIDs a ignorar)
- [ ] ListeningFromMe: si false, ignorar mensajes del propio usuario
- [ ] StopBotFromMe: si true, pausar sesión cuando el usuario responde
- [ ] Sesión closed → en próxima iteración, evaluar triggers de nuevo (no mandar directo)
- [ ] Sesión en pausa → ignorar mensajes hasta nueva activación

## Documentation Requirement

Toda la implementación debe estar completamente documentada en `docs/` usando el skill `docs`. La documentación debe incluir:

- **Referencia de API**: cada endpoint con request/response examples, headers, descripción
- **Arquitectura**: diagrama de flujo mensaje → trigger → sesión → webhook → respuesta → WhatsApp
- **Configuración**: cómo crear webhooks, triggers, gestionar sesiones, keywordFinish
- **Integración con n8n**: ejemplo paso a paso de cómo conectar n8n con el sistema
- **Guía de triggers**: cómo funcionan los tipos de trigger, operadores, orden de evaluación
- **Guía de sesiones**: cómo se crean, cierran, timeout, endpoint change-status

## Out of Scope (Initial MVP)
- SplitMessages, timePerChar, delayMessage (media-specific formatting)
- Webhook response caching
- Dashboard UI para webhooks (solo API)

## Open Questions
1. ~~¿Disparan todos o solo el primero?~~ → **Todos los que coincidan**
2. ~~¿Session storage?~~ → **En memoria**
3. ~~¿Auto-close?~~ → **API + Timeout 5 min**
4. ~~¿Síncrono o fire-and-forget?~~ → **Síncrono (esperar respuesta para reenviar)**

## Acceptance Criteria
- [ ] Admin puede crear N webhooks por instancia con triggers y URLs distintas
- [ ] Mensaje entrante: todos los webhooks con trigger match reciben el payload
- [ ] Sesión se crea en memoria al primer match
- [ ] Mensajes siguientes dentro de sesión: POST directo (sin trigger check)
- [ ] Respuesta del webhook se reenvía al WhatsApp
- [ ] Cierre de sesión vía endpoint HTTP + timeout 5 min + keywordFinish
- [ ] Audio se transcribe antes de enviar
- [ ] Webhook único existente sigue funcionando normalmente
