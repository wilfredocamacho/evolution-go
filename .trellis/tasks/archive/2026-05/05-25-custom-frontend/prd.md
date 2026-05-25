# Custom Evolution Go Frontend

## Goal

Build a custom frontend (web UI) for Evolution Go that can fully manage WhatsApp instances, send/receive messages, and configure all features exposed by the REST API — replacing the encrypted/obfuscated `manager/dist/` React app with a clean, open-source, maintainable alternative.

## Confirmed Facts (from codebase inspection)

### Authentication
- Two auth levels: `apikey` header
  - **Auth (instance-level)**: per-instance token — used for most operations
  - **AuthAdmin (global)**: `GlobalApiKey` from env — used for instance CRUD (create/delete/proxy), listing all instances, force reconnect, logs

### API Endpoints (inferred from `pkg/routes/routes.go`)

| Group | Endpoints | Auth |
|-------|-----------|------|
| `GET /server/ok` | Health check | None |
| `GET /swagger/*any` | Swagger docs | None |
| **Instance (admin)** | `POST /instance/create`, `GET /instance/all`, `GET /instance/info/:id`, `DELETE /instance/delete/:id`, `POST /instance/proxy/:id`, `DELETE /instance/proxy/:id`, `POST /instance/forcereconnect/:id`, `GET /instance/logs/:id` | GlobalApiKey |
| **Instance (auth)** | `POST /instance/connect`, `GET /instance/status`, `GET /instance/qr`, `POST /instance/pair`, `POST /instance/disconnect`, `POST /instance/reconnect`, `DELETE /instance/logout`, `GET /instance/:id/advanced-settings`, `PUT /instance/:id/advanced-settings` | Instance token |
| **Send** | `POST /send/text`, `/link`, `/media`, `/poll`, `/sticker`, `/location`, `/contact`, `/button`, `/list`, `/carousel`, `POST /send/status/text`, `/status/media` | Instance token |
| **User** | `POST /user/info`, `/check`, `/avatar`, `GET /user/contacts`, `GET /user/privacy`, `POST /user/privacy`, `POST /user/block`, `/unblock`, `GET /user/blocklist`, `POST /user/profilePicture`, `/profileName`, `/profileStatus` | Instance token |
| **Message** | `POST /message/react`, `/presence`, `/markread`, `/downloadmedia`, `/status`, `/delete`, `/edit` | Instance token |
| **Chat** | `POST /chat/pin`, `/unpin`, `/archive`, `/unarchive`, `/mute`, `/unmute`, `POST /chat/history-sync` | Instance token |
| **Group** | `GET /group/list`, `POST /group/info`, `/invitelink`, `/photo`, `/name`, `/description`, `/create`, `/participant`, `GET /group/myall`, `POST /group/join`, `/leave` | Instance token |
| **Call** | `POST /call/reject` | Instance token |
| **Community** | `POST /community/create`, `/add`, `/remove` | Instance token |
| **Label** | `POST /label/chat`, `/message`, `/edit`, `GET /label/list` | Instance token |
| **Unlabel** | `POST /unlabel/chat`, `/message` | Instance token |
| **Newsletter** | `POST /newsletter/create`, `GET /newsletter/list`, `POST /newsletter/info`, `/link`, `/subscribe`, `/messages` | Instance token |
| **Polls** | `GET /polls/:pollMessageId/results` | Instance token |

### Existing Frontend Tech
- React SPA served from `manager/dist/`
- Served at `/manager/*` and `/manager` routes
- ~685KB JS + 160KB CSS (obfuscated/encrypted — no source)
- Built with Vite (based on `index.html` references)

### Instance Model Fields
- id (UUID), name, token, webhook, rabbitmqEnable, websocketEnable, natsEnable
- jid, qrcode, connected, expiration, disconnect_reason, events, os_name
- proxy, client_name, createdAt
- **Advanced Settings**: alwaysOnline, rejectCall, msgRejectCall, readMessages, ignoreGroups, ignoreStatus

### Existing project patterns
- Gin web framework
- PostgreSQL via GORM
- Event producers: webhook, websocket, RabbitMQ, NATS
- Swagger docs available at `/swagger/`

## Requirements (to be refined)

- [ ] Web UI for managing Evolution Go instances
- [ ] Instance lifecycle: create, connect (QR code), pair (phone number), reconnect, disconnect, logout, delete
- [ ] Instance settings: webhook, advanced settings, proxy
- [ ] Send messages: text, media, links, polls, stickers, location, contacts, buttons, lists, carousel, status
- [ ] User management: info, contacts, privacy, block/unblock, profile settings
- [ ] Message management: reactions, presence, mark read, delete, edit, download media
- [ ] Chat management: archive, mute, history sync
- [ ] Group management: list, info, create, participants, invite link, photo, name, description, join, leave
- [ ] Label management: assign, unassign, edit, list
- [ ] Newsletter management: create, list, info, subscribe, messages
- [ ] Community management: create, add/remove participants
- [ ] Logs viewer for instances
- [ ] Health/status monitoring

## Out of Scope (tentative)

- TBD

## Decisions Made

- **Tech Stack**: React + Vite
- **Auth Flow**: Global API Key login (single auth for all operations)
- **Auth Detail**: Frontend auto-uses each instance's token internally for per-instance operations. Transparent to the user.
- **Layout**: Sidebar + Content (admin panel style)
- **Design**: New from scratch, modern minimalist (Linear/Raycast inspired), Spanish
- **UI Library**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **State Management**: TanStack Query (React Query)
- **Real-time**: Polling (2-3s interval) for QR code and connection status
- **Repo Location**: `frontend/` directory (separate from backend)
- **Dev/Deploy**: Vite dev server (HMR) in development; production build output to `manager/dist/` served by Gin
- **MVP Pages**: `/login`, `/` (dashboard), `/instances/:id` (detail+settings), `/instances/:id/send` (composer)
- **Instance Detail Layout**: Tabs (Info/QR, Settings, Webhook, Proxy)
- **Persist API Key**: localStorage (logout button clears it)
- **Theme**: Light + Dark mode (toggle in sidebar)
- **MVP Scope (Fase 1)**: Instance management + Send messages + Dashboard

## Phased Plan

### Fase 1 (MVP) — Instance Management + Send
- Login page (Global API Key)
- Dashboard: instance list with status indicators (connected/disconnected/qr)
- Create instance form (name, token, optional webhook, settings)
- Instance detail: view info, QR code display, pair phone, reconnect, disconnect, logout, delete
- Advanced settings: alwaysOnline, rejectCall, readMessages, ignoreGroups, ignoreStatus
- Webhook configuration
- Send messages: text, media (image/video/doc), links, polls, stickers, location, contact, button, list, carousel
- Status messages (text + media)
- Proxy configuration per instance
- Connection state polling

### Fase 2 (future) — Messaging & Groups
- Chat management (archive, mute, history sync)
- Message actions (react, mark read, delete, edit, download media)
- User info, contacts, privacy settings, block/unblock
- Group management (create, list, participants, invite link, settings)
- Call reject configuration

### Fase 3 (future) — Advanced Features
- Labels (assign, unassign, edit, list)
- Newsletters (create, list, subscribe, messages)
- Communities (create, add/remove)
- Poll results viewer
- Instance logs viewer
- Event configuration (webhook, rabbitmq, websocket, nats)

## Acceptance Criteria (Fase 1)

- [ ] Login with Global API Key works
- [ ] Instance list shows all instances with connection status
- [ ] Create instance with name + token generates a new instance
- [ ] Connect instance shows QR code, auto-refreshes on expiry
- [ ] Pair phone displays pairing code
- [ ] Disconnect/reconnect/logout/delete work on each instance
- [ ] Advanced settings can be read and updated
- [ ] Proxy can be set and removed
- [ ] Send text message works
- [ ] Send media (image) works
- [ ] Send link, poll, sticker, location, contact, button, list, carousel work
- [ ] Send status text and status media work
- [ ] UI is in English, responsive, modern

## Out of Scope

- End-to-end encryption features (handled by WhatsApp)
- Real-time chat interface (this is a management UI, not a chat client)
- User registration (users are created via API by admin)
- Multi-language i18n in MVP (Spanish only)
- License management pages (SaaS/pro feature)
- WebSocket event viewer (WhatsApp event stream)
