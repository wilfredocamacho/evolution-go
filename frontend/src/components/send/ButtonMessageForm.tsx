import { useState } from "react"
import { sendButton } from "@/lib/send-api"
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
import { Loader2, Plus, Trash2, MousePointerClick } from "lucide-react"
import { toast } from "sonner"
import type { Button as ButtonType } from "@/types/send"

interface ButtonMessageFormProps {
  instanceId: string
}

export function ButtonMessageForm({ instanceId }: ButtonMessageFormProps) {
  const [number, setNumber] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [footer, setFooter] = useState("")
  const [buttons, setButtons] = useState<ButtonType[]>([
    { type: "reply", displayText: "" },
  ])
  const [sending, setSending] = useState(false)

  const addButton = () =>
    setButtons((b) => [...b, { type: "reply", displayText: "" }])
  const removeButton = (i: number) => {
    if (buttons.length <= 1) return
    setButtons((b) => b.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validButtons = buttons.filter((b) => b.displayText)
    if (!number || !title || !description || !footer || validButtons.length === 0)
      return
    setSending(true)
    try {
      await sendButton(instanceId, {
        number,
        title,
        description,
        footer,
        buttons: validButtons,
      })
      toast.success("Botones enviados")
      setNumber("")
      setTitle("")
      setDescription("")
      setFooter("")
      setButtons([{ type: "reply", displayText: "" }])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="btn-number">Número</Label>
        <Input
          id="btn-number"
          placeholder="5511999999999"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="btn-title">Título</Label>
        <Input
          id="btn-title"
          placeholder="Título del mensaje"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="btn-desc">Descripción</Label>
        <Input
          id="btn-desc"
          placeholder="Descripción del mensaje"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="btn-footer">Footer</Label>
        <Input
          id="btn-footer"
          placeholder="Texto del footer"
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Botones</Label>
        {buttons.map((btn, i) => (
          <div key={i} className="flex items-start gap-2 rounded-md border p-3">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Texto del botón"
                value={btn.displayText}
                onChange={(e) =>
                  setButtons((b) =>
                    b.map((v, idx) =>
                      idx === i ? { ...v, displayText: e.target.value } : v
                    )
                  )
                }
              />
              <Select
                value={btn.type}
                onValueChange={(val) =>
                  setButtons((b) =>
                    b.map((v, idx) =>
                      idx === i
                        ? { ...v, type: val as ButtonType["type"] }
                        : v
                    )
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reply">Reply</SelectItem>
                  <SelectItem value="copy">Copy</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {buttons.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeButton(i)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addButton}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar botón
        </Button>
      </div>

      <Button
        type="submit"
        disabled={sending || buttons.filter((b) => b.displayText).length === 0}
      >
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MousePointerClick className="mr-2 h-4 w-4" />
        )}
        Enviar Botones
      </Button>
    </form>
  )
}
