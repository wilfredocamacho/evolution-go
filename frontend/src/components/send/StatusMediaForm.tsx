import { useState, useRef } from "react"
import { sendStatusMedia } from "@/lib/send-api"
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
import { Loader2, Video } from "lucide-react"
import { toast } from "sonner"

interface StatusMediaFormProps {
  instanceId: string
}

export function StatusMediaForm({ instanceId }: StatusMediaFormProps) {
  const [type, setType] = useState<string>("image")
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [useUrl, setUseUrl] = useState(false)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!useUrl && !file) return
    if (useUrl && !url) return
    setSending(true)
    try {
      await sendStatusMedia(instanceId, {
        type: type as "image" | "video",
        ...(useUrl ? { url } : { media: file! }),
        ...(caption && { caption }),
      })
      toast.success("Estado multimedia publicado")
      setCaption("")
      setFile(null)
      setUrl("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sm-type">Tipo</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Imagen</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sm-caption">Subtítulo (opcional)</Label>
        <Input
          id="sm-caption"
          placeholder="Texto del estado"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setUseUrl(!useUrl)}
        >
          {useUrl ? "Subir archivo" : "Usar URL"}
        </Button>
      </div>

      {useUrl ? (
        <div className="space-y-2">
          <Label htmlFor="sm-url">URL del archivo</Label>
          <Input
            id="sm-url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="sm-file">Archivo</Label>
          <Input
            id="sm-file"
            type="file"
            ref={fileRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={sending || (!useUrl && !file) || (useUrl && !url)}
      >
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Video className="mr-2 h-4 w-4" />
        )}
        Publicar Estado
      </Button>
    </form>
  )
}
