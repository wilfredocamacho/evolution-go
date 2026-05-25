import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  useConnectInstance,
  useDisconnectInstance,
  useReconnectInstance,
  useLogoutInstance,
  useDeleteInstance,
} from "@/hooks/useInstanceQuery"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Wifi, WifiOff, LogOut, Trash2, RotateCcw, Loader2 } from "lucide-react"
import { useState } from "react"

interface ConnectionActionsProps {
  instanceId: string
  connected: boolean
}

export function ConnectionActions({ instanceId, connected }: ConnectionActionsProps) {
  const { apiKey } = useAuth()
  const navigate = useNavigate()
  const connect = useConnectInstance()
  const disconnect = useDisconnectInstance()
  const reconnect = useReconnectInstance()
  const logout = useLogoutInstance()
  const deleteInst = useDeleteInstance()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const isPending =
    connect.isPending || disconnect.isPending || reconnect.isPending || logout.isPending || deleteInst.isPending

  return (
    <div className="flex flex-wrap gap-2">
      {!connected ? (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={() => connect.mutate({ id: instanceId })}
            disabled={isPending}
          >
            {connect.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="mr-2 h-4 w-4" />
            )}
            Conectar
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnect.mutate(instanceId)}
            disabled={isPending}
          >
            {disconnect.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <WifiOff className="mr-2 h-4 w-4" />
            )}
            Desconectar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reconnect.mutate(instanceId)}
            disabled={isPending}
          >
            {reconnect.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Reconectar
          </Button>
          <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" disabled={isPending}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cerrar sesión</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro? Se cerrará la sesión de WhatsApp en esta instancia.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLogoutOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    logout.mutate(instanceId)
                    setLogoutOpen(false)
                  }}
                  disabled={logout.isPending}
                >
                  {logout.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cerrar sesión
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {apiKey && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar instancia</DialogTitle>
              <DialogDescription>
                Esta acción es irreversible. Se eliminarán todos los datos de la instancia.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteInst.mutate(instanceId)
                  setDeleteOpen(false)
                  navigate("/")
                }}
                disabled={deleteInst.isPending}
              >
                {deleteInst.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
