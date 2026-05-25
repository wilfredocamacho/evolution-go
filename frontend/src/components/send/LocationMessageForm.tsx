import { useState } from "react"
import { sendLocation } from "@/lib/send-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"

interface LocationMessageFormProps {
  instanceId: string
}

export function LocationMessageForm({ instanceId }: LocationMessageFormProps) {
  const [number, setNumber] = useState("")
  const [name, setName] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number || !latitude || !longitude) return
    setSending(true)
    try {
      await sendLocation(instanceId, {
        number,
        name: name || undefined,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      })
      toast.success("Ubicación enviada")
      setNumber("")
      setName("")
      setLatitude("")
      setLongitude("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="loc-number">Número</Label>
        <Input
          id="loc-number"
          placeholder="5511999999999"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="loc-name">Nombre del lugar (opcional)</Label>
        <Input
          id="loc-name"
          placeholder="Ej: Parque Central"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loc-lat">Latitud</Label>
          <Input
            id="loc-lat"
            type="number"
            step="any"
            placeholder="-23.5505"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-lng">Longitud</Label>
          <Input
            id="loc-lng"
            type="number"
            step="any"
            placeholder="-46.6333"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={sending}>
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="mr-2 h-4 w-4" />
        )}
        Enviar Ubicación
      </Button>
    </form>
  )
}
