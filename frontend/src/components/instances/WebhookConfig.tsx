import { useState } from "react"
import { useInstance } from "@/hooks/useInstanceQuery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { connectInstance } from "@/lib/instance-api"
import { toast } from "sonner"
import { Loader2, Save, Globe } from "lucide-react"

interface WebhookConfigProps {
  instanceId: string
}

export function WebhookConfig({ instanceId }: WebhookConfigProps) {
  const { data: instance, isLoading } = useInstance(instanceId)
  const [url, setUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="mt-2 h-8 w-24" />
        </CardContent>
      </Card>
    )
  }

  if (!loaded && instance) {
    setUrl(instance.webhook || "")
    setLoaded(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Uses instance update via connect endpoint with webhookUrl
      await connectInstance(instanceId, { webhookUrl: url })
      toast.success("Webhook actualizado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar webhook")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {instance?.webhook ? (
              <a
                href={instance.webhook}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {instance.webhook}
              </a>
            ) : (
              "No configurado"
            )}
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook">URL del Webhook</Label>
          <Input
            id="webhook"
            placeholder="https://ejemplo.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar Webhook
        </Button>
      </CardContent>
    </Card>
  )
}
