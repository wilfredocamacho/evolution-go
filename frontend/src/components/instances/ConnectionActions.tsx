import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  useDisconnectInstance,
  useReconnectInstance,
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
import { WifiOff, Trash2, RotateCcw, Loader2 } from "lucide-react"
import { useState } from "react"

interface ConnectionActionsProps {
  instanceId: string
  connected: boolean
}

export function ConnectionActions({ instanceId, connected }: ConnectionActionsProps) {
  const { apiKey } = useAuth()
  const navigate = useNavigate()
  const disconnect = useDisconnectInstance()
  const reconnect = useReconnectInstance()
  const deleteInst = useDeleteInstance()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isPending =
    disconnect.isPending || reconnect.isPending || deleteInst.isPending

  return (
    <div className="flex flex-wrap gap-2">
      {connected ? (
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
        </>
      ) : null}

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
                  deleteInst.mutate(instanceId, {
                    onSuccess: () => {
                      setDeleteOpen(false)
                      navigate("/")
                    },
                  })
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
