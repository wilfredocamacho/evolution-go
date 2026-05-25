import { useState } from "react"
import { sendLink } from "@/lib/send-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Link2 } from "lucide-react"
import { toast } from "sonner"

interface LinkMessageFormProps {
  instanceId: string
}

export function LinkMessageForm({ instanceId }: LinkMessageFormProps) {
  const [number, setNumber] = useState("")
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number || !url || !text) return
    setSending(true)
    try {
      await sendLink(instanceId, {
        number,
        text,
        url,
        ...(title && { title }),
        ...(description && { description }),
      })
      toast.success("Enlace enviado")
      setNumber("")
      setText("")
      setUrl("")
      setTitle("")
      setDescription("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="link-number">Número</Label>
        <Input
          id="link-number"
          placeholder="5511999999999"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-text">Texto</Label>
        <Input
          id="link-text"
          placeholder="Texto del mensaje"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-url">URL</Label>
        <Input
          id="link-url"
          placeholder="https://ejemplo.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-title">Título (opcional)</Label>
        <Input
          id="link-title"
          placeholder="Título del enlace"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-desc">Descripción (opcional)</Label>
        <Input
          id="link-desc"
          placeholder="Descripción del enlace"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={sending}>
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Link2 className="mr-2 h-4 w-4" />
        )}
        Enviar Enlace
      </Button>
    </form>
  )
}
