import { useState } from "react"
import { sendPoll } from "@/lib/send-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, BarChart3 } from "lucide-react"
import { toast } from "sonner"

interface PollMessageFormProps {
  instanceId: string
}

export function PollMessageForm({ instanceId }: PollMessageFormProps) {
  const [number, setNumber] = useState("")
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [sending, setSending] = useState(false)

  const addOption = () => setOptions((o) => [...o, ""])
  const removeOption = (i: number) => {
    if (options.length <= 2) return
    setOptions((o) => o.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validOptions = options.filter(Boolean)
    if (!number || !question || validOptions.length < 2) return
    setSending(true)
    try {
      await sendPoll(instanceId, { number, question, options: validOptions })
      toast.success("Encuesta enviada")
      setNumber("")
      setQuestion("")
      setOptions(["", ""])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="poll-number">Número</Label>
        <Input
          id="poll-number"
          placeholder="5511999999999"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="poll-question">Pregunta</Label>
        <Input
          id="poll-question"
          placeholder="¿Qué prefieres?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
      </div>
      <div className="space-y-3">
        <Label>Opciones</Label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder={`Opción ${i + 1}`}
              value={opt}
              onChange={(e) =>
                setOptions((o) => o.map((v, idx) => (idx === i ? e.target.value : v)))
              }
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(i)}
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
          onClick={addOption}
          className="mt-1"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar opción
        </Button>
      </div>
      <Button
        type="submit"
        disabled={sending || options.filter(Boolean).length < 2}
      >
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <BarChart3 className="mr-2 h-4 w-4" />
        )}
        Enviar Encuesta
      </Button>
    </form>
  )
}
