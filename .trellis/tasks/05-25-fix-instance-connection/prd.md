# Refinar conexión de instancia: QR, botones desconectar/cerrar

## Goal

Arreglar el flujo de conexión de instancias: mostrar QR correctamente, simplificar botones de acción, y reparar el botón "Desconectar" para que cierre sesión de WhatsApp correctamente.

## Confirmed Facts (from code inspection)

### QR Code
- Backend genera QR y lo almacena en DB (`instance.Qrcode`) con formato `data:image/png;base64,<b64>|<qrCode>`
- **Bug #1:** Frontend renderiza `<img src="data:image/png;base64,${qrData.qrcode}" />` pero `qrData.qrcode` YA contiene `data:image/png;base64,` → imagen rota por doble prefijo
- **Bug #2:** QRCodeDisplay usa `!connected` para habilitar polling QR. El Status endpoint retorna `connected: true` cuando el websocket de WhatsApp conecta (antes de escanear QR), lo que desactiva el polling del QR antes de mostrarlo
- La lógica correcta debería ser: mostrar QR cuando `!loggedIn` (no cuando `!connected`)

### Botones de acción (ConnectionActions.tsx)
- Cuando instancia conectada hay 4 botones visibles: Desconectar, Reconectar, Cerrar Sesión, Eliminar
- **"Desconectar"** llama a `POST /instance/disconnect` → Backend `Disconnect()` solo envía kill signal y limpia Events, NO hace `client.Logout()` ni setea `instance.Connected = false`
- **"Cerrar Sesión"** llama a `DELETE /instance/logout` → Backend `Logout()` SÍ hace `client.Logout()`, setea `instance.Connected = false`, elimina cliente
- La acción de **Reconectar** y **Eliminar** funcionan correctamente

### Eventos QR en backend
- Log "Unhandled event *events.QR" es normal: QR se maneja por `qrChan` separado, no por el event handler principal. No afecta funcionalidad.

## Requirements

1. **QR debe mostrarse correctamente:**
   - Arreglar doble prefijo `data:image/png;base64,` en la etiqueta `<img>`
   - QR debe seguir visible mientras el usuario no haya escaneado el código (usar `loggedIn`, no `connected`)
   - Si expiran los 5 QR sin escanear, mostrar estado adecuado y botón "Conectar" para reiniciar

2. **Simplificar botones cuando conectado:**
   - Eliminar botón "Cerrar Sesión" (redundante)
   - Unificar acción: "Desconectar" debe cerrar sesión de WhatsApp completamente (logout)
   - Mantener "Reconectar" con funcionalidad actual
   - Mantener "Eliminar" con funcionalidad actual

3. **Disconnect funcional en backend:**
   - `Disconnect()` debe hacer logout real de WhatsApp (`client.Logout()`)
   - Debe setear `instance.Connected = false`
   - Debe limpiar cliente de `clientPointer`

## Acceptance Criteria

- [ ] Al crear instancia, se ve el botón "Conectar". Al presionarlo, aparece QR scaneable.
- [ ] QR se refresca cada 2s mientras no se haya escaneado.
- [ ] Si expiran los 5 QR sin escaneo, se muestra mensaje y opción de reconectar.
- [ ] Una vez escaneado el QR (conectado), se muestra "Conectado" y QR desaparece.
- [ ] Al presionar "Desconectar", se cierra sesión de WhatsApp realmente (desaparece del teléfono).
- [ ] Solo hay 3 botones cuando conectado: Desconectar, Reconectar, Eliminar.
- [ ] TypeScript 0 errores (`tsc --noEmit`).
- [ ] Go build sin errores en `pkg/instance/...` y `pkg/whatsmeow/...`.

## Out of Scope

- No cambiar la lógica de emparejamiento por código (PairPhone) — ya funciona.
- No cambiar Reconectar, Eliminar ni su funcionalidad.
- No rediseñar todo el flujo de conexión del backend — solo arreglar Disconnect y QR display.
- No tocar el webhook listener ni session manager.
