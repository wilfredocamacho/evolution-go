# Implement: Refinar conexión de instancia

## Phase 1 — Backend: Disconnect hace logout

Archivo: `pkg/instance/service/instance_service.go`

Reemplazar el cuerpo de `Disconnect()` con la lógica de `Logout()`:
1. `client.Logout(context.Background())`
2. `instance.Connected = false`
3. `instanceRepository.Update(instance)`
4. Enviar kill signal con `select` + `time.After(5s)` (evita deadlock)
5. `delete(i.clientPointer, instance.Id)`
6. `delete(i.killChannel, instance.Id)` (Logout lo hace, el plan original lo omitía)
7. Incluir fallback: si connected pero no loggedIn, `client.Disconnect()` + cleanup
8. **NO** tocar `myClientPointer` — ese campo no existe en el struct

Validation:
```bash
go build ./pkg/instance/...
```

## Phase 2 — Frontend: QR double prefix fix

Archivo: `frontend/src/components/instances/QRCodeDisplay.tsx`

Cambiar:
```tsx
<img src={`data:image/png;base64,${qrData.qrcode}`} ... />
```
→
```tsx
<img src={qrData.qrcode} ... />
```

Validation:
```bash
cd frontend && npx tsc --noEmit
```

## Phase 3 — Frontend: QR polling con loggedIn

Archivo: `frontend/src/components/instances/QRCodeDisplay.tsx`

- Interface prop cambia: `connected: boolean` → `loggedIn: boolean`
- `if (loggedIn)` en vez de `if (connected)`
- `useInstanceQr(instanceId, !loggedIn)` en vez de `useInstanceQr(instanceId, !connected)`

Archivo: `frontend/src/pages/InstanceDetail.tsx`

- Pasar `status?.loggedIn` en vez de `connected`:
```tsx
<QRCodeDisplay instanceId={id!} loggedIn={status?.loggedIn ?? false} />
```

Validation:
```bash
cd frontend && npx tsc --noEmit
```

## Phase 4 — Frontend: Remover botón Cerrar Sesión

Archivo: `frontend/src/components/instances/ConnectionActions.tsx`

- Eliminar `useLogoutInstance` import
- Eliminar estado `logoutOpen`
- Eliminar Dialog + DialogTrigger para "Cerrar Sesión"
- Mantener botones: Desconectar, Reconectar, Eliminar

Validation:
```bash
cd frontend && npx tsc --noEmit
```

## Phase 5 — Verificación final

```bash
cd frontend && npx tsc --noEmit && npx vite build
cd .. && go build ./pkg/instance/...
```

## Rollback

- Backend: revertir `Disconnect()` a su implementación original
- Frontend: revertir cambios en QRCodeDisplay, InstanceDetail, ConnectionActions
- O revertir commit completo
