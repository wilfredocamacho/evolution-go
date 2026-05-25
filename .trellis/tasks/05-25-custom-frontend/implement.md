# Custom Evolution Go Frontend — Implementation Plan

## Phase 1 (MVP) — Instance Management + Send Messages

### Prerequisites
- Node.js 18+ installed
- Understanding of existing API (swagger at `/swagger/`)

### Step 1: Project Scaffold
```bash
cd frontend/
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer
npm install @tanstack/react-query react-router-dom lucide-react
npx shadcn@latest init   # Default style, CSS variables, Tailwind
npx shadcn@latest add button input card badge tabs
npx shadcn@latest add dialog select switch label separator
npx shadcn@latest add dropdown-menu skeleton sonner
```

**Validation**: `npm run dev` shows Vite dev server on port 5173.

### Step 2: Project Structure
Create directory tree and remove default Vite boilerplate:
- `src/components/ui/` (auto by shadcn)
- `src/components/layout/`
- `src/components/instances/`
- `src/components/send/`
- `src/hooks/`
- `src/lib/`
- `src/types/`
- `src/pages/`

### Step 3: Base Configuration
- `src/index.css` — Tailwind directives + shadcn/ui CSS variables (auto)
- `vite.config.ts` — Vite proxy: use wildcard/regex to forward all unhandled paths to backend, instead of listing 12+ individual routes
- Tailwind config with dark mode class strategy

### Step 4: Type Definitions
- `src/types/api.ts` — ApiResponse<T>, error types
- `src/types/instance.ts` — Instance, AdvancedSettings, CreateInstancePayload, ProxyConfig
  Nota: `rabbitmqEnable`/`websocketEnable`/`natsEnable` son strings ("true"/"false"), no booleanos. Mapear como `string`.
- `src/types/send.ts` — All message type payloads

### Step 5: API Client
- `src/lib/constants.ts` — API paths as constants
- `src/lib/api-client.ts` — fetch wrapper:
  - `apiGet<T>(path, opts?)` / `apiPost<T>(path, body, opts?)` / `apiPut<T>` / `apiDelete<T>`
  - Auto-inject `apikey` header (admin key from localStorage or instance token)
  - Parse JSON, handle errors, return typed responses
- `src/lib/instance-api.ts` — Instance CRUD, connect, disconnect, etc.
- `src/lib/send-api.ts` — All send endpoints

### Step 6: Auth Context + Hooks
- `src/hooks/useAuth.ts`:
  - AuthContext with `apiKey`, `setApiKey`, `logout`
  - Persist to localStorage
  - `isAuthenticated` getter
- `src/hooks/useInstanceQuery.ts`:
  - `useInstances()` — fetches all instances
  - `useInstance(id)` — fetches single instance by ID
  - `useCreateInstance()` — mutation
  - `useDeleteInstance()` — mutation
  - Mutation hooks for connect/disconnect/reconnect/logout
  - `useAdvancedSettings(id)` — GET/PUT
  - `useInstanceTokenCache(id)` — returns token from cached instance list
- `src/hooks/useQRPolling.ts`:
  - Polls `GET /instance/qr` at 2s interval when instance detail open
  - Uses `instance.token` for API key
- `src/hooks/useStatusPolling.ts`:
  - Polls `GET /instance/status` at 3s interval

### Step 7: Layout Components
- `AppLayout.tsx` — Sidebar + main content area + query provider wrapper
- `Sidebar.tsx` — Nav items (Dashboard, etc.), ThemeToggle, Logout button
- `ThemeToggle.tsx` — Dark/Light switch with localStorage persistence

### Step 8: App Shell + Router
- `App.tsx`:
  - QueryClientProvider
  - AuthProvider
  - BrowserRouter with Routes
  - ProtectedRoute component (redirect to /login if no key)
- `main.tsx` — render App

### Step 9: Login Page
- `pages/Login.tsx`:
  - API key input field
  - Submit: store key, fetch `GET /instance/all` to validate
  - Error display on invalid key
  - On success → redirect to `/`

### Step 10: Dashboard Page
- `pages/Dashboard.tsx`:
  - Fetch `useInstances()` (using GlobalApiKey)
  - Grid of `InstanceCard` components
  - `CreateInstanceDialog` as FAB or top button
  - Loading skeleton, empty state, error state
- `components/instances/InstanceCard.tsx`:
  - Name, JID (if connected), status badge (connected/disconnected/qr)
  - Click → navigate to `/instances/:id`
- `components/instances/CreateInstanceDialog.tsx`:
  - Form: name (req), token (req), webhook (opt)
  - Submit creates instance via GlobalApiKey
  - On success → refresh list + navigate to new instance

### Step 11: Instance Detail Page
- `pages/InstanceDetail.tsx`:
  - Tabs: Info, Settings, Webhook, Proxy
  - Fetch instance info
  - Wrong instance ID → error state

#### Step 11a: Info Tab
- `components/instances/QRCodeDisplay.tsx`:
  - Render base64 QR as `<img>` with `data:image/png;base64,...`
  - Auto-poll every 2s when showing QR
  - Stop polling when instance connects
  - Show expiry/refresh info
- `components/instances/ConnectionActions.tsx`:
  - Conditional buttons based on state:
    - Not connected: [Connect] [Pair Phone]
    - Connected: [Disconnect] [Reconnect] [Logout]
    - Always: [Delete] (admin key)
  - Loading states for each action
  - Confirmation dialog for Delete
- `components/instances/PairPhoneForm.tsx`:
  - Phone number input (international format)
  - Submit → POST /instance/pair → show pairing code
  - Auto-copy pairing code

#### Step 11b: Settings Tab
- `components/instances/AdvancedSettingsForm.tsx`:
  - Toggles: alwaysOnline, rejectCall, readMessages, ignoreGroups, ignoreStatus
  - Text input: msgRejectCall (shown when rejectCall enabled)
  - Load current settings on mount
  - Save button → PUT /instance/:id/advanced-settings
  - Success toast notification

#### Step 11c: Webhook Tab
- `components/instances/WebhookConfig.tsx`:
  - Current webhook URL display
  - Input + Save button
  - Uses instance update (via service or direct)

#### Step 11d: Proxy Tab
- `components/instances/ProxyConfig.tsx`:
  - Current proxy display (if set)
  - Set proxy form: protocol, host, port, username, password
  - Delete proxy button with confirmation

### Step 12: Send Message Page
- `pages/SendMessage.tsx`:
  - `MessageTypeSelector` — visual button group or dropdown for message type
  - Dynamic form render based on selected type
  - Common: "Number" field (target phone), Send button
  - Use instance token for API auth
- Send message type forms (each in its own component):
  - `TextMessageForm.tsx`
  - `MediaMessageForm.tsx` — file upload
  - `LinkMessageForm.tsx`
  - `PollMessageForm.tsx` — dynamic option fields
  - `StickerMessageForm.tsx` — file upload
  - `LocationMessageForm.tsx`
  - `ContactMessageForm.tsx`
  - `ButtonMessageForm.tsx` — dynamic button fields
  - `ListMessageForm.tsx` — dynamic sections/rows
  - `CarouselMessageForm.tsx` — dynamic card fields
  - `StatusTextForm.tsx`
  - `StatusMediaForm.tsx` — file upload

### Step 13: Dark Mode
- `ThemeToggle.tsx`:
  - Toggle with sun/moon icons
  - Toggle `dark` class on `<html>`
  - Persist preference in localStorage
  - Detect system preference on first load

### Step 14: Polish
- Loading states everywhere (skeleton, spinner)
- Error handling (try/catch, error boundaries, toast notifications)
- Empty states (no instances, no contacts)
- Toast notifications for success/error operations
- Confirm dialogs for destructive actions (delete, logout)
- Responsive layout (sidebar collapses on mobile)

## Validation Commands

```bash
# Development
cd frontend
npm run dev                    # Vite dev server on :5173

# Type check
npx tsc --noEmit               # TypeScript validation

# Lint
npx eslint src/                # Code quality

# Production build
npm run build                  # Output to dist/
cp -r dist/* ../manager/dist/  # Copy to Gin server (manual or CI)
# Note: ensure CSP headers are set on Gin for /manager/ routes

# Test in production mode
# Start backend, navigate to http://localhost:PORT/manager
```

## Verification Checklist

After each step, verify manually:
- [ ] `npm run dev` starts without errors
- [ ] Vite proxy routes correctly to backend
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Component renders correctly

## Risky Files & Rollback Points

| File | Risk | Rollback |
|------|------|----------|
| `src/lib/api-client.ts` | Core fetch logic — errors cascade everywhere | Git commit before editing |
| `src/hooks/useAuth.ts` | Auth state — broken auth = no app access | Git commit before editing |
| `vite.config.ts` | Proxy misconfiguration | Git commit before editing |
| `src/App.tsx` | Router/Provider setup | Git commit before editing |

Git commit after each step in the implementation order.

## Follow-up Before `task.py start`

- [ ] PRD signed off by user
- [ ] Design approved
- [ ] Implement plan reviewed
- [ ] Node.js 18+ available (`node --version`)
- [ ] Backend running with test GlobalApiKey
- [ ] At least one test instance exists
