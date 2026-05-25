import { useState } from "react"
import { sendText } from "@/lib/send-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import type { SendText } from "@/types/send"

interface TextMessageFormProps {
  instanceId: string
}

export function TextMessageForm({ instanceId }: TextMessageFormProps) {
  const [form, setForm] = useState<SendText>({ number: "", text: "" })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.number || !form.text) return
    setSending(true)
    try {
      await sendText(instanceId, form)
      toast.success("Mensaje enviado")
      setForm({ number: "", text: "" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text-number">Número</Label>
        <Input
          id="text-number"
          placeholder="5511999999999"
          value={form.number}
          onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="text-text">Mensaje</Label>
        <textarea
          id="text-text"
          className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Escribe tu mensaje..."
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          required
        />
      </div>
      <Button type="submit" disabled={sending}>
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Enviar
      </Button>
    </form>
  )
}
