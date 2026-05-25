# Custom Evolution Go Frontend — Design

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  React SPA (Vite)                  │
│  ┌──────────────────────────────────────────────┐ │
│  │              App (Router + QueryProvider)      │ │
│  │  ┌──────┐ ┌──────────────────────────────┐   │ │
│  │  │Sidebar│ │        Content Area          │   │ │
│  │  │       │ │  ┌──────────────────────┐   │   │ │
│  │  │ Nav   │ │  │     Page Routes       │   │   │ │
│  │  │ Theme │ │  │  /login → Login       │   │   │ │
│  │  │ Logout│ │  │  /      → Dashboard   │   │   │ │
│  │  └──────┘ │  │  /instances/:id        │   │   │ │
│  │           │  │  /instances/:id/send   │   │   │ │
│  │           │  └──────────────────────┘   │   │   │
│  │           └──────────────────────────────┘   │   │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │         TanStack Query (React Query)          │ │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────────┐   │ │
│  │  │useQuery  │ │useMutation│ │refetchInterval│ │ │
│  │  │ (fetch)  │ │ (POST/  │ │ (polling)    │   │ │
│  │  │          │ │ PUT/DEL)│ │ QR/status    │   │ │
│  │  └─────────┘ └─────────┘ └──────────────┘   │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │              API Client (fetch + TS)          │ │
│  │  - Admin key: GlobalApiKey                    │ │
│  │  - Instance key: instance.token               │ │
│  │  - Error response normalization               │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
        │                              │
        │ Production: same-origin      │ Dev: Vite proxy
        ▼                              ▼
┌──────────────────────────────────────────────┐
│          Gin Backend (port $SERVER_PORT)       │
│  /manager/* → index.html (prod only)          │
│  /instance/*, /send/*, /user/*, ...           │
│  CORS: * (any origin in dev)                  │
└──────────────────────────────────────────────┘
```

## Directory Structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx     # Sidebar + content shell
│   │   │   ├── Sidebar.tsx       # Navigation + theme toggle + logout
│   │   │   └── ThemeToggle.tsx   # Dark/Light switch
│   │   ├── instances/
│   │   │   ├── InstanceCard.tsx       # Dashboard card
│   │   │   ├── CreateInstanceDialog.tsx
│   │   │   ├── QRCodeDisplay.tsx      # QR w/ auto-refresh
│   │   │   ├── ConnectionActions.tsx  # connect/disconnect/reconnect/logout/delete
│   │   │   ├── PairPhoneForm.tsx      # Phone input for pairing
│   │   │   ├── AdvancedSettingsForm.tsx
│   │   │   ├── WebhookConfig.tsx
│   │   │   └── ProxyConfig.tsx
│   │   └── send/
│   │       ├── MessageTypeSelector.tsx
│   │       ├── TextMessageForm.tsx
│   │       ├── MediaMessageForm.tsx
│   │       ├── LinkMessageForm.tsx
│   │       ├── PollMessageForm.tsx
│   │       ├── StickerMessageForm.tsx
│   │       ├── LocationMessageForm.tsx
│   │       ├── ContactMessageForm.tsx
│   │       ├── ButtonMessageForm.tsx
│   │       ├── ListMessageForm.tsx
│   │       ├── CarouselMessageForm.tsx
│   │       ├── StatusTextForm.tsx
│   │       └── StatusMediaForm.tsx
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth context + API key management
│   │   ├── useInstanceQuery.ts  # TanStack Query for instances
│   │   ├── useQRPolling.ts      # Polling hook for QR code
│   │   └── useStatusPolling.ts  # Polling hook for connection status
│   ├── lib/
│   │   ├── api-client.ts        # Fetch wrapper with key switching
│   │   ├── instance-api.ts      # Instance endpoints
│   │   ├── send-api.ts          # Send endpoints
│   │   ├── utils.ts             # Shared utilities
│   │   └── constants.ts         # API paths, defaults
│   ├── types/
│   │   ├── instance.ts          # Instance types
│   │   ├── send.ts              # Send message types
│   │   └── api.ts               # API response types
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── InstanceDetail.tsx
│   │   └── SendMessage.tsx
│   ├── App.tsx                  # Router + providers
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind + shadcn/ui globals
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
└── components.json              # shadcn/ui config
```

## Routes

| Path | Page | Auth Required |
|------|------|---------------|
| `/login` | Login (GlobalApiKey input) | No |
| `/` | Dashboard (instance list + create) | Yes |
| `/instances/:id` | Instance detail (tabs) | Yes |
| `/instances/:id/send` | Send message composer | Yes |
| `*` | Redirect to `/` or `/login` | — |

## Auth Flow

```
Login ──► Store GlobalApiKey in localStorage ──► Fetch GET /instance/all
    │                                                  │
    │                                            Success: render Dashboard
    │                                                  │
    │                                            Each instance has {token}
    │                                                  │
    ▼                                                  ▼
  Error: show error                            Instance ops use instance.token
```

- Admin endpoints: `apikey` = `GlobalApiKey`
- Instance endpoints: `apikey` = `instance.token` (auto-selected by ID)
- Logout: clear localStorage → redirect `/login`

## API Client Design

```typescript
// api-client.ts — fetch wrapper
async function apiRequest<T>(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    apiKey?: string;          // explicit key override
    isAdmin?: boolean;        // use GlobalApiKey from storage
    instanceId?: string;      // use this instance's token
    params?: Record<string, string>;
  }
): Promise<T>
```

- Default `Content-Type: application/json` except for FormData
- Auto-reads GlobalApiKey from localStorage when `isAdmin: true`
- Auto-looks up instance token from cache when `instanceId` is set
- Transforms error responses into typed errors
- TanStack Query handles retry, caching, refetch

## Instance Detail Tabs

```
┌───────────────────────────────────────────────┐
│  [Info]   [Settings]   [Webhook]   [Proxy]     │
├───────────────────────────────────────────────┤
│                                                 │
│  Info tab:                                      │
│  ┌──────────┐  ┌────────────────────────┐      │
│  │ QR code  │  │ Status: ● Connected    │      │
│  │ (base64) │  │ JID: 551199999@c.us    │      │
│  │          │  │ Name: My Instance      │      │
│  │ refresh  │  │ ID: uuid               │      │
│  └──────────┘  │ [Connect] [Pair]       │      │
│                │ [Disconn][Reconn]      │      │
│                │ [Logout] [Delete]      │      │
│                └────────────────────────┘      │
│                                                 │
│  Settings tab: toggle each advanced setting     │
│  Webhook tab: URL input + save                  │
│  Proxy tab: form set/delete                     │
└───────────────────────────────────────────────┘
```

## Send Message Composer

```
Select message type → dynamic form → send

Types:
┌──────────┬────────────────────────────────────┐
│ Text     │ number, text, [mentions], [quoted]  │
│ Link     │ number, url, [title], [description] │
│ Media    │ number, file, [caption]              │
│ Poll     │ number, question, options[]          │
│ Sticker  │ number, file (image)                 │
│ Location │ number, name, lat, lng               │
│ Contact  │ number, fullName, phone              │
│ Button   │ number, title, buttons[]             │
│ List     │ number, title, sections[]            │
│ Carousel │ number, cards[]                      │
│ Status T │ text, [bgColor], [font]              │
│ Status M │ file, [caption]                      │
└──────────┴────────────────────────────────────┘
```

## Polling Strategy

| Query | Interval | Conditions |
|-------|----------|------------|
| `GET /instance/qr` | 2s | Only when instance not connected AND QR page visible |
| `GET /instance/status` | 3s | Always when instance detail is open |
| `GET /instance/all` | 10s | Only on dashboard (refresh instance list) |

TanStack Query `refetchInterval` handles automatic polling. Polling pauses when:
- Tab is not visible (browser/page visibility)
- Component unmounts
- Instance connects successfully

## Theming

- shadcn/ui CSS variables for colors
- `class` strategy for dark mode: `<html class="dark">`
- Tailwind v3 dark mode with CSS variables
- Theme persisted in localStorage
- Sidebar toggle + system preference detection

## API Type Definitions (key interfaces)

```typescript
interface Instance {
  id: string;
  name: string;
  token: string;
  webhook: string;
  rabbitmqEnable: string;
  websocketEnable: string;
  natsEnable: string;
  jid: string;
  qrcode: string;
  connected: boolean;
  expiration: number;
  disconnect_reason: string;
  events: string;
  os_name: string;
  proxy: string;
  client_name: string;
  createdAt: string;
  alwaysOnline: boolean;
  rejectCall: boolean;
  msgRejectCall: string;
  readMessages: boolean;
  ignoreGroups: boolean;
  ignoreStatus: boolean;
}

interface AdvancedSettings {
  alwaysOnline: boolean;
  rejectCall: boolean;
  msgRejectCall: string;
  readMessages: boolean;
  ignoreGroups: boolean;
  ignoreStatus: boolean;
}

interface ApiResponse<T> {
  message?: string;
  error?: string;
  data?: T;
}
```

## Key Trade-offs

1. **Same-origin in prod, direct in dev**: Vite proxy avoids CORS issues in development. In production, the Gin server serves the built frontend from `/manager/*`, making all API calls same-origin.

2. **LocalStorage for API key**: Simplest persistence. Risk: XSS could steal the key. Mitigation: proper CSP headers, no eval, sanitized inputs. Acceptable for a management tool.

3. **Polling over WebSocket**: The backend WebSocket is for WhatsApp events, not manager UI state. Polling is simpler to implement and debug. Trade-off: ~3 requests/sec per open instance detail page.

4. **shadcn/ui copy-paste approach**: Components are in Git, not a runtime dependency. Easy to customize. Trade-off: manual `npx shadcn add` for each component.

5. **TypeScript (not JS)**: Despite some preferences, shadcn/ui ecosystem is TS-native. Better autocomplete, fewer bugs. TS is standard for this stack.
6. **CSP headers recommended**: In production, Gin should serve `/manager/dist/` with strict Content-Security-Policy to mitigate XSS risk from localStorage API key.
7. **Custom shadcn/ui theme**: Default shadcn/ui is neutral palette. Customize CSS variables to achieve Linear/Raycast-inspired look (Inter font, muted backgrounds, subtle shadows).
