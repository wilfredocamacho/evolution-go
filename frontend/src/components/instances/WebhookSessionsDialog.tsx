import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { X, Loader2, Phone, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import * as webhookApi from "@/lib/webhook-api"

interface Props {
  instanceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WebhookSessionsDialog({ instanceId, open, onOpenChange }: Props) {
  const qc = useQueryClient()

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["webhook-sessions", instanceId],
    queryFn: () => webhookApi.listSessions(instanceId),
    enabled: open && !!instanceId,
    refetchInterval: open ? 5_000 : false,
  })

  const closeMutation = useMutation({
    mutationFn: (remoteJid: string) =>
      webhookApi.changeSessionStatus(instanceId, {
        remoteJid,
        status: "closed",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook-sessions", instanceId] })
      toast.success("Sesión cerrada")
    },
    onError: (err: Error) => toast.error(err.message),
  })


  const formatTime = (t: string) => {
    const d = new Date(t)
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatJid = (jid: string) => {
    const parts = jid.split("@")
    return parts[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sesiones activas
          </DialogTitle>
          <DialogDescription>
            Sesiones de chatbot abiertas por número de teléfono.
            Se cierran automáticamente tras 5 min de inactividad.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Phone className="h-12 w-12 mb-3 opacity-40" />
            <p className="font-medium">No hay sesiones activas</p>
            <p className="text-sm">
              Las sesiones aparecerán aquí cuando un número interactúe con un webhook.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s, i) => (
              <div key={s.sessionId}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {formatJid(s.remoteJid)}
                      </span>
                      <Badge
                        variant={s.status === "opened" ? "success" : "outline"}
                        className="gap-1 text-xs"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            s.status === "opened"
                              ? "bg-green-500 animate-pulse"
                              : "bg-muted-foreground"
                          }`}
                        />
                        {s.status === "opened" ? "Abierta" : "Cerrada"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{s.pushName}</span>
                      <span>·</span>
                      <span>{formatTime(s.lastActive)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-4">
                    {s.status === "opened" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeMutation.mutate(s.remoteJid)}
                        disabled={closeMutation.isPending}
                      >
                        {closeMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        Cerrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
