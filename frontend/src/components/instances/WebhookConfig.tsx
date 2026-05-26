import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Globe, ExternalLink, Loader2, Clock } from "lucide-react"
import { WebhookForm } from "./WebhookForm"
import { WebhookSessionsDialog } from "./WebhookSessionsDialog"
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook } from "@/lib/webhook-api"
import type { Webhook, CreateWebhookPayload } from "@/types/webhook"

interface Props {
  instanceId: string
}

export function WebhookConfig({ instanceId }: Props) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [sessionsOpen, setSessionsOpen] = useState(false)

  const fetchWebhooks = async () => {
    setLoading(true)
    try {
      const data = await getWebhooks(instanceId)
      setWebhooks(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar webhooks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [instanceId])

  const handleToggle = async (wh: Webhook) => {
    try {
      const updated = await updateWebhook(wh.id, { enabled: !wh.enabled })
      setWebhooks((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
      toast.success(updated.enabled ? "Webhook habilitado" : "Webhook deshabilitado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await deleteWebhook(id)
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
      toast.success("Webhook eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    } finally {
      setDeleting(null)
    }
  }

  const handleSave = async (payload: CreateWebhookPayload) => {
    try {
      if (editingWebhook) {
        const updated = await updateWebhook(editingWebhook.id, payload)
        setWebhooks((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
        toast.success("Webhook actualizado")
      } else {
        const created = await createWebhook(instanceId, payload)
        setWebhooks((prev) => [...prev, created])
        toast.success("Webhook creado")
      }
      setFormOpen(false)
      setEditingWebhook(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    }
  }

  const openCreate = () => {
    setEditingWebhook(null)
    setFormOpen(true)
  }

  const openEdit = (wh: Webhook) => {
    setEditingWebhook(wh)
    setFormOpen(true)
  }

  const triggerLabel = (wh: Webhook): string => {
    if (wh.triggerType === "all") return "Todas las mensajes"
    const op = wh.triggerOperator || ""
    const val = wh.triggerValue || ""
    if (wh.triggerType === "advanced") return `Avanzado: ${op} "${val}"`
    return `${op}: "${val}"`
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""} configurado{webhooks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSessionsOpen(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Sesiones
          </Button>
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Webhook
          </Button>
        </div>
      </div>

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Globe className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay webhooks configurados. Crea uno para empezar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <Card key={wh.id} className={wh.enabled ? "" : "opacity-60"}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {wh.description || "Sin descripción"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {wh.triggerType}
                      </Badge>
                      {wh.isTrusted && (
                        <Badge variant="secondary" className="text-xs">Confiable</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Globe className="h-3 w-3 shrink-0" />
                      <a
                        href={wh.webhookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline truncate"
                      >
                        {wh.webhookUrl}
                      </a>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Trigger: {triggerLabel(wh)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Timeout: {wh.expire}s</span>
                      {wh.keywordFinish && <span>Salir: "{wh.keywordFinish}"</span>}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={wh.enabled}
                      onCheckedChange={() => handleToggle(wh)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(wh)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={deleting === wh.id}
                      onClick={() => handleDelete(wh.id)}
                    >
                      {deleting === wh.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sessions dialog */}
      <WebhookSessionsDialog
        instanceId={instanceId}
        open={sessionsOpen}
        onOpenChange={setSessionsOpen}
      />

      {/* Create/Edit dialog */}
      <WebhookForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingWebhook(null)
        }}
        webhook={editingWebhook}
        onSave={handleSave}
      />
    </div>
  )
}