import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Webhook, CreateWebhookPayload } from "@/types/webhook"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  webhook?: Webhook | null
  onSave: (payload: CreateWebhookPayload) => Promise<void>
}

const triggerTypeOptions = [
  { value: "all", label: "Todas (All)" },
  { value: "keyword", label: "Palabra clave (Keyword)" },
  { value: "advanced", label: "Avanzado (Advanced)" },
]

const keywordOperators = [
  { value: "equals", label: "Igual a" },
  { value: "contains", label: "Contiene" },
  { value: "startsWith", label: "Empieza con" },
  { value: "endsWith", label: "Termina con" },
  { value: "regex", label: "Expresión regular" },
]

const advancedOperators = [
  { value: "contains", label: "Contiene" },
  { value: "notcontains", label: "No contiene" },
  { value: "startsWith", label: "Empieza con" },
  { value: "endsWith", label: "Termina con" },
  { value: "exact", label: "Exacto" },
]

export function WebhookForm({ open, onOpenChange, webhook, onSave }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CreateWebhookPayload>({
    webhookUrl: "",
    description: "",
    triggerType: "keyword",
    triggerOperator: "equals",
    triggerValue: "",
    keywordFinish: "",
    expire: 300,
    enabled: true,
    listeningFromMe: false,
    stopBotFromMe: false,
    isTrusted: false,
    basicAuthUser: "",
    basicAuthPass: "",
    ignoreJids: [],
  })
  const [ignoreJidsText, setIgnoreJidsText] = useState("")

  useEffect(() => {
    if (webhook) {
      setForm({
        webhookUrl: webhook.webhookUrl,
        description: webhook.description || "",
        triggerType: webhook.triggerType,
        triggerOperator: webhook.triggerOperator || "",
        triggerValue: webhook.triggerValue || "",
        keywordFinish: webhook.keywordFinish || "",
        expire: webhook.expire,
        enabled: webhook.enabled,
        listeningFromMe: webhook.listeningFromMe,
        stopBotFromMe: webhook.stopBotFromMe,
        isTrusted: webhook.isTrusted,
        basicAuthUser: webhook.basicAuthUser || "",
        basicAuthPass: webhook.basicAuthPass || "",
        ignoreJids: webhook.ignoreJids || [],
      })
      setIgnoreJidsText((webhook.ignoreJids || []).join("\n"))
    } else {
      setForm({
        webhookUrl: "",
        description: "",
        triggerType: "keyword",
        triggerOperator: "equals",
        triggerValue: "",
        keywordFinish: "",
        expire: 300,
        enabled: true,
        listeningFromMe: false,
        stopBotFromMe: false,
        isTrusted: false,
        basicAuthUser: "",
        basicAuthPass: "",
        ignoreJids: [],
      })
      setIgnoreJidsText("")
    }
  }, [webhook, open])

  const handleChange = <K extends keyof CreateWebhookPayload>(
    key: K,
    value: CreateWebhookPayload[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.webhookUrl.trim()) return
    setSaving(true)
    try {
      const jids = ignoreJidsText
        .split("\n")
        .map((j) => j.trim())
        .filter(Boolean)
      await onSave({ ...form, ignoreJids: jids.length > 0 ? jids : undefined })
    } finally {
      setSaving(false)
    }
  }

  const operators = form.triggerType === "advanced" ? advancedOperators : keywordOperators
  const showOperator = form.triggerType === "keyword" || form.triggerType === "advanced"
  const showTriggerValue = form.triggerType === "keyword" || form.triggerType === "advanced"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{webhook ? "Editar Webhook" : "Crear Webhook"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL del Webhook *</Label>
            <Input
              id="webhookUrl"
              placeholder="https://n8n.midominio.com/webhook/abc123"
              value={form.webhookUrl}
              onChange={(e) => handleChange("webhookUrl", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc">Descripción</Label>
            <Input
              id="desc"
              placeholder="Chatbot de soporte"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          {/* Trigger Type */}
          <div className="space-y-2">
            <Label htmlFor="triggerType">Tipo de Trigger</Label>
            <Select
              value={form.triggerType}
              onValueChange={(v) => {
                handleChange("triggerType", v)
                if (v === "all") {
                  handleChange("triggerOperator", "")
                  handleChange("triggerValue", "")
                } else if (v === "keyword") {
                  handleChange("triggerOperator", "equals")
                } else {
                  handleChange("triggerOperator", "contains")
                }
              }}
            >
              <SelectTrigger id="triggerType">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {triggerTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator + Value row */}
          {showOperator && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="op">Operador</Label>
                <Select
                  value={form.triggerOperator}
                  onValueChange={(v) => handleChange("triggerOperator", v)}
                >
                  <SelectTrigger id="op">
                    <SelectValue placeholder="Seleccionar operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showTriggerValue && (
                <div className="space-y-2">
                  <Label htmlFor="triggerValue">Valor del Trigger</Label>
                  <Input
                    id="triggerValue"
                    placeholder={form.triggerOperator === "regex" ? "ayuda|soporte" : "ayuda"}
                    value={form.triggerValue}
                    onChange={(e) => handleChange("triggerValue", e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Keyword Finish + Expire */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kf">Palabra para cerrar sesión</Label>
              <Input
                id="kf"
                placeholder="salir"
                value={form.keywordFinish}
                onChange={(e) => handleChange("keywordFinish", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expire">Timeout (segundos)</Label>
              <Input
                id="expire"
                type="number"
                placeholder="300"
                value={form.expire}
                onChange={(e) => handleChange("expire", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Switches row */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={form.enabled}
                onCheckedChange={(v) => handleChange("enabled", v)}
              />
              <Label htmlFor="enabled" className="cursor-pointer">Habilitado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="lfm"
                checked={form.listeningFromMe}
                onCheckedChange={(v) => handleChange("listeningFromMe", v)}
              />
              <Label htmlFor="lfm" className="cursor-pointer">Escuchar propios</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="sbm"
                checked={form.stopBotFromMe}
                onCheckedChange={(v) => handleChange("stopBotFromMe", v)}
              />
              <Label htmlFor="sbm" className="cursor-pointer">Pausar al enviar</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="trusted"
                checked={form.isTrusted}
                onCheckedChange={(v) => handleChange("isTrusted", v)}
              />
              <Label htmlFor="trusted" className="cursor-pointer">Webhook confiable</Label>
            </div>
          </div>

          {/* Basic Auth */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bau">Basic Auth Usuario</Label>
              <Input
                id="bau"
                placeholder="user"
                value={form.basicAuthUser}
                onChange={(e) => handleChange("basicAuthUser", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bap">Basic Auth Contraseña</Label>
              <Input
                id="bap"
                type="password"
                placeholder="pass123"
                value={form.basicAuthPass}
                onChange={(e) => handleChange("basicAuthPass", e.target.value)}
              />
            </div>
          </div>

          {/* Ignore JIDs */}
          <div className="space-y-2">
            <Label htmlFor="jids">Ignorar JIDs (uno por línea)</Label>
            <textarea
              id="jids"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="5511999999999@s.whatsapp.net&#10;@g.us"
              value={ignoreJidsText}
              onChange={(e) => setIgnoreJidsText(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !form.webhookUrl.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {webhook ? "Guardar cambios" : "Crear Webhook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}