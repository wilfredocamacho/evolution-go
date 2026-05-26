import { useParams, useNavigate } from "react-router-dom"
import { useInstance, useInstanceStatus } from "@/hooks/useInstanceQuery"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { QRCodeDisplay } from "@/components/instances/QRCodeDisplay"
import { ConnectionActions } from "@/components/instances/ConnectionActions"
import { PairPhoneForm } from "@/components/instances/PairPhoneForm"
import { AdvancedSettingsForm } from "@/components/instances/AdvancedSettingsForm"
import { WebhookConfig } from "@/components/instances/WebhookConfig"
import { ProxyConfig } from "@/components/instances/ProxyConfig"
import {
  Wifi,
  WifiOff,
  AlertCircle,
  ArrowLeft,
  Send,
  Clock,
  User,
} from "lucide-react"

export function InstanceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: instance, isLoading, isError } = useInstance(id!)
  const { data: status } = useInstanceStatus(id!, !!instance?.token)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !instance) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Instancia no encontrada</h2>
        <p className="text-muted-foreground mb-6">
          La instancia que buscas no existe o fue eliminada.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al dashboard
        </Button>
      </div>
    )
  }

  const connected = status?.connected ?? instance.connected
  const loggedIn = status?.loggedIn ?? false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{instance.name}</h1>
              <Badge
                variant={loggedIn ? "success" : "outline"}
                className="gap-1"
              >
                {loggedIn ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                {loggedIn ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {instance.jid && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {instance.jid}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Creada: {new Date(instance.createdAt).toLocaleDateString("es-ES")}
              </span>
            </div>
          </div>
        </div>

        <Button onClick={() => navigate(`/instances/${id}/send`)}>
          <Send className="mr-2 h-4 w-4" />
          Enviar mensaje
        </Button>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="proxy">Proxy</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QRCodeDisplay instanceId={id!} loggedIn={status?.loggedIn ?? false} />

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Acciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConnectionActions instanceId={id!} connected={connected} />
                </CardContent>
              </Card>


            </div>
          </div>

          {/* Instance info details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ID</p>
                  <p className="font-mono text-xs">{instance.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Token</p>
                  <p className="font-mono text-xs">
                    {instance.token.slice(0, 20)}...
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p>{instance.client_name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">SO</p>
                  <p>{instance.os_name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expiración</p>
                  <p>
                    {instance.expiration
                      ? new Date(instance.expiration * 1000).toLocaleDateString(
                          "es-ES"
                        )
                      : "Sin expiración"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Razón desconexión</p>
                  <p>{instance.disconnect_reason || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <AdvancedSettingsForm instanceId={id!} />
        </TabsContent>

        {/* Webhook Tab */}
        <TabsContent value="webhook">
          <WebhookConfig instanceId={id!} />
        </TabsContent>

        {/* Proxy Tab */}
        <TabsContent value="proxy">
          <ProxyConfig instanceId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
