import { useState } from "react"
import { sendSticker } from "@/lib/send-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Sticker } from "lucide-react"
import { toast } from "sonner"

interface StickerMessageFormProps {
  instanceId: string
}

export function StickerMessageForm({ instanceId }: StickerMessageFormProps) {
  const [number, setNumber] = useState("")
  const [stickerUrl, setStickerUrl] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number || !stickerUrl) return
    setSending(true)
    try {
      await sendSticker(instanceId, { number, sticker: stickerUrl })
      toast.success("Sticker enviado")
      setNumber("")
      setStickerUrl("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sticker-number">Número</Label>
        <Input
          id="sticker-number"
          placeholder="5511999999999"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sticker-url">URL del sticker (imagen)</Label>
        <Input
          id="sticker-url"
          placeholder="https://ejemplo.com/sticker.webp"
          value={stickerUrl}
          onChange={(e) => setStickerUrl(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          URL pública de la imagen para convertir a sticker
        </p>
      </div>
      <Button type="submit" disabled={sending}>
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sticker className="mr-2 h-4 w-4" />
        )}
        Enviar Sticker
      </Button>
    </form>
  )
}
