import { useState } from "react"
import { sendStatusText } from "@/lib/send-api"
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
import { Loader2, FileText } from "lucide-react"
import { toast } from "sonner"

interface StatusTextFormProps {
  instanceId: string
}

export function StatusTextForm({ instanceId }: StatusTextFormProps) {
  const [text, setText] = useState("")
  const [bgColor, setBgColor] = useState("")
  const [font, setFont] = useState<string>("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text) return
    setSending(true)
    try {
      await sendStatusText(instanceId, {
        text,
        bgColor: bgColor || undefined,
        font: font ? parseInt(font) : undefined,
      })
      toast.success("Estado enviado")
      setText("")
      setBgColor("")
      setFont("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  const fontOptions = [
    { value: "1", label: "Serif" },
    { value: "2", label: "Sans Serif" },
    { value: "3", label: "Monospace" },
    { value: "4", label: "Cursiva" },
    { value: "5", label: "Negrita" },
    { value: "6", label: "Delgada" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="st-text">Texto del estado</Label>
        <textarea
          id="st-text"
          className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Escribe tu estado..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="st-bg">Color de fondo (opcional)</Label>
          <div className="flex gap-2">
            <Input
              id="st-bg"
              type="color"
              value={bgColor || "#000000"}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-12 h-9 p-1"
            />
            <Input
              placeholder="#HEX"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="st-font">Fuente (opcional)</Label>
          <Select value={font} onValueChange={setFont}>
            <SelectTrigger id="st-font">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={sending || !text}>
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Publicar Estado
      </Button>
    </form>
  )
}
