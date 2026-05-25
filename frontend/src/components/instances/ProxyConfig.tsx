import { useState } from "react"
import { useInstance } from "@/hooks/useInstanceQuery"
import {
  useSetProxy,
  useDeleteProxy,
} from "@/hooks/useInstanceQuery"
import type { SetProxyStruct } from "@/types/instance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Save, Trash2, Globe } from "lucide-react"

interface ProxyConfigProps {
  instanceId: string
}

export function ProxyConfig({ instanceId }: ProxyConfigProps) {
  const { data: instance, isLoading } = useInstance(instanceId)
  const setProxy = useSetProxy()
  const deleteProxy = useDeleteProxy()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const currentProxy = instance?.proxy
    ? parseProxyString(instance.proxy)
    : null

  const [form, setForm] = useState<SetProxyStruct>({
    protocol: "http",
    host: "",
    port: "",
    username: "",
    password: "",
  })

  // Parse proxy string like "http://user:pass@host:port"
  function parseProxyString(proxy: string): {
    protocol: string
    host: string
    port: string
    username?: string
    password?: string
  } | null {
    try {
      const url = new URL(proxy)
      return {
        protocol: url.protocol.replace(":", ""),
        host: url.hostname,
        port: url.port || (url.protocol === "https:" ? "443" : "80"),
        username: url.username || undefined,
        password: url.password || undefined,
      }
    } catch {
      return null
    }
  }

  const handleSave = () => {
    const proxyData: SetProxyStruct = {
      protocol: form.protocol || "http",
      host: form.host,
      port: form.port,
      username: form.username || undefined,
      password: form.password || undefined,
    }
    setProxy.mutate({ id: instanceId, proxy: proxyData })
  }

  const handleDelete = () => {
    deleteProxy.mutate(instanceId)
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="mt-2 h-8 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {/* Current proxy info */}
        <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {currentProxy ? (
              <span className="font-mono">
                {currentProxy.protocol}://{currentProxy.host}:{currentProxy.port}
                {currentProxy.username && " (con autenticación)"}
              </span>
            ) : (
              "Sin proxy"
            )}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proxy-protocol">Protocolo</Label>
              <Select
                value={form.protocol || "http"}
                onValueChange={(v) => setForm((f) => ({ ...f, protocol: v }))}
              >
                <SelectTrigger id="proxy-protocol">
                  <SelectValue placeholder="Protocolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                  <SelectItem value="socks5">SOCKS5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proxy-host">Host</Label>
              <Input
                id="proxy-host"
                placeholder="proxy.ejemplo.com"
                value={form.host}
                onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proxy-port">Puerto</Label>
              <Input
                id="proxy-port"
                placeholder="8080"
                value={form.port}
                onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proxy-username">Usuario (opcional)</Label>
              <Input
                id="proxy-username"
                placeholder="usuario"
                value={form.username || ""}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proxy-password">Contraseña (opcional)</Label>
            <Input
              id="proxy-password"
              type="password"
              placeholder="••••••"
              value={form.password || ""}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={setProxy.isPending || !form.host || !form.port}
          >
            {setProxy.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Configurar Proxy
          </Button>

          {currentProxy && (
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={deleteProxy.isPending}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Proxy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Eliminar proxy</DialogTitle>
                  <DialogDescription>
                    ¿Eliminar la configuración de proxy de esta instancia?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Eliminar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
