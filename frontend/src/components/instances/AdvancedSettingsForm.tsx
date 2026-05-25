import { useEffect, useState } from "react"
import {
  useAdvancedSettings,
  useUpdateAdvancedSettings,
} from "@/hooks/useInstanceQuery"
import type { AdvancedSettings } from "@/types/instance"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Save } from "lucide-react"

interface AdvancedSettingsFormProps {
  instanceId: string
}

export function AdvancedSettingsForm({ instanceId }: AdvancedSettingsFormProps) {
  const { data: settings, isLoading } = useAdvancedSettings(instanceId)
  const update = useUpdateAdvancedSettings()
  const [form, setForm] = useState<AdvancedSettings>({
    alwaysOnline: false,
    rejectCall: false,
    msgRejectCall: "",
    readMessages: false,
    ignoreGroups: false,
    ignoreStatus: false,
  })

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        alwaysOnline: settings.alwaysOnline,
        rejectCall: settings.rejectCall,
        msgRejectCall: settings.msgRejectCall || "",
        readMessages: settings.readMessages,
        ignoreGroups: settings.ignoreGroups,
        ignoreStatus: settings.ignoreStatus,
      })
    }
  }, [settings])

  const handleToggle = (key: keyof AdvancedSettings) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    update.mutate({ id: instanceId, settings: form })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const toggles: { key: keyof AdvancedSettings; label: string }[] = [
    { key: "alwaysOnline", label: "Siempre en línea" },
    { key: "rejectCall", label: "Rechazar llamadas" },
    { key: "readMessages", label: "Leer mensajes" },
    { key: "ignoreGroups", label: "Ignorar grupos" },
    { key: "ignoreStatus", label: "Ignorar estados" },
  ]

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {toggles.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key} className="cursor-pointer">
              {label}
            </Label>
            <Switch
              id={key}
              checked={form[key] as boolean}
              onCheckedChange={() => handleToggle(key)}
            />
          </div>
        ))}

        {form.rejectCall && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="msgRejectCall">Mensaje de rechazo</Label>
            <Input
              id="msgRejectCall"
              value={form.msgRejectCall}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, msgRejectCall: e.target.value }))
              }
              placeholder="Mensaje automático al rechazar llamada"
            />
          </div>
        )}

        <div className="pt-2">
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
