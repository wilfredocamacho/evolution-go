import { useState, useRef } from "react"
import { sendMedia } from "@/lib/send-api"
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
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

interface MediaMessageFormProps {
  instanceId: string
}

export function MediaMessageForm({ instanceId }: MediaMessageFormProps) {
  const [number, setNumber] = useState("")
  const [type, setType] = useState<string>("image")
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [useUrl, setUseUrl] = useState(false)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number) return
    if (!useUrl && !file) return
    if (useUrl && !url) return

    setSending(true)
    try {
      await sendMedia(instanceId, {
        number,
        type: type as "image" | "video" | "audio" | "document" | "ptv",
        ...(useUrl ? { url } : { media: file! }),
        ...(caption && { caption }),
      })
      toast.success("Media enviado")
      setNumber("")
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
        <Label htmlFor="media-number">Número</Label>
        <Input
          id="media-number"
          placeholder="5511999999999"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="media-type">Tipo de media</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Imagen</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Documento</SelectItem>
            <SelectItem value="ptv">Video mensaje</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="media-caption">Subtítulo (opcional)</Label>
        <Input
          id="media-caption"
          placeholder="Texto del subtítulo"
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
          <Label htmlFor="media-url">URL del archivo</Label>
          <Input
            id="media-url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="media-file">Archivo</Label>
          <div className="flex items-center gap-2">
            <Input
              id="media-file"
              type="file"
              ref={fileRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            {file && (
              <span className="text-xs text-muted-foreground">{file.name}</span>
            )}
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={sending || !number || (!useUrl && !file) || (useUrl && !url)}
      >
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Enviar Media
      </Button>
    </form>
  )
}
