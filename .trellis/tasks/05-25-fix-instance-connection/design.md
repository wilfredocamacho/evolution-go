# Design: Refinar conexión de instancia

## Architecture

### 1. QR Code Display

**Bug fix — double prefix:**
```
// QRCodeDisplay.tsx — Cambiar:
src={`data:image/png;base64,${qrData.qrcode}`}
// → A:
src={qrData.qrcode}
```
`qrData.qrcode` ya incluye `data:image/png;base64,` desde el backend (whatsmeow.go:645).

**Bug fix — polling desactivado prematuramente:**
- QRCodeDisplay recibe `loggedIn` en vez de `connected`
- Polling QR habilitado cuando `!loggedIn`
- Muestra "Conectado" solo cuando `loggedIn === true`

InstanceDetail pasa `status?.loggedIn` a QRCodeDisplay.

### 2. Disconnect funcional

Backend `Disconnect()` se reemplaza con la misma lógica de `Logout()` (sin `myClientPointer` — ese campo no existe):

```
Disconnect():
    1. ensureClientConnected(instanceId)
    2. If loggedIn && connected:
        2a. client.Logout()
        2b. instance.Connected = false
        2c. instanceRepository.Update(instance)
        2d. killChannel[instanceId] <- true  (select con timeout 5s)
        2e. delete(clientPointer, instanceId)
        2f. delete(killChannel, instanceId)
    3. Else if connected (fallback):
        3a. client.Disconnect()
        3b. killChannel[instanceId] <- true  (select con timeout 5s)
        3c. delete(clientPointer, instanceId)
        3d. delete(killChannel, instanceId)
        3e. instance.Connected = false
        3f. instanceRepository.Update(instance)
    4. Return instance
```

Diferencias clave con el diseño original:
- `myClientPointer` no existe en el struct — eliminado del plan
- kill channel send usa `select` con `time.After(5s)` para evitar deadlock
- kill channel también se elimina con `delete()` (Logout lo hace, faltaba en el plan)
- Incluye fallback para connected-but-not-logged-in

### 3. Frontend: simplificar botones

ConnectionActions.tsx:
- Remover Dialog + botón "Cerrar Sesión" (usa `useLogoutInstance`)
- Botón "Desconectar" se mantiene, llama al endpoint disconnect (que ahora hace logout real)
- Reconectar y Eliminar se mantienen sin cambios

### 4. Flujo completo

```
[Crear instancia]
  ↓
[Ver "Conectar" en ConnectionActions] — QRCodeDisplay muestra "Conectar"
  ↓ usuario click "Conectar"
[POST /instance/connect → StartClient → QR generado en DB]
  ↓ polling status cada 3s → loggedIn:false
[QRCodeDisplay recibe loggedIn=false → polling GET /instance/qr cada 2s]
  ↓
[QR se muestra correctamente (sin doble prefijo)]
  ↓ usuario escanea QR
[loggedIn pasa a true → QRCodeDisplay muestra "Conectado", polling QR stop]
  ↓
[Usuario click "Desconectar"]
[POST /instance/disconnect → client.Logout() + Connected=false]
  ↓
[loggedIn=false → QRCodeDisplay ready para reconectar]
```

## Files Affected

| File | Change |
|------|--------|
| `pkg/instance/service/instance_service.go` | `Disconnect()`: reemplazar con lógica de Logout (sin myClientPointer, select timeout + delete killChannel) |
| `frontend/src/components/instances/QRCodeDisplay.tsx` | Fix src prefix; prop `loggedIn` en vez de `connected`; polling con `!loggedIn` |
| `frontend/src/pages/InstanceDetail.tsx` | Pasar `status?.loggedIn` a QRCodeDisplay |
| `frontend/src/components/instances/ConnectionActions.tsx` | Remover botón + dialog "Cerrar Sesión" |

## Not Changed

- `pkg/instance/handler/instance_handler.go` — handlers siguen igual
- `pkg/routes/routes.go` — rutas siguen igual
- `DELETE /instance/logout` — se mantiene obsoleto
- Reconectar, Eliminar — sin cambios
- Flujo PairPhone — sin cambios
- Webhook — sin cambios
