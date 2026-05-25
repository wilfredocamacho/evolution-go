import { useState } from "react"
import { sendList } from "@/lib/send-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, List } from "lucide-react"
import { toast } from "sonner"
import type { Section } from "@/types/send"

interface ListMessageFormProps {
  instanceId: string
}

export function ListMessageForm({ instanceId }: ListMessageFormProps) {
  const [number, setNumber] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [footerText, setFooterText] = useState("")
  const [buttonText, setButtonText] = useState("")
  const [sections, setSections] = useState<Section[]>([
    { title: "", rows: [{ title: "" }] },
  ])
  const [sending, setSending] = useState(false)

  const addSection = () =>
    setSections((s) => [...s, { title: "", rows: [{ title: "" }] }])
  const removeSection = (i: number) => {
    if (sections.length <= 1) return
    setSections((s) => s.filter((_, idx) => idx !== i))
  }

  const addRow = (si: number) =>
    setSections((s) =>
      s.map((sec, idx) =>
        idx === si ? { ...sec, rows: [...sec.rows, { title: "" }] } : sec
      )
    )
  const removeRow = (si: number, ri: number) =>
    setSections((s) =>
      s.map((sec, idx) =>
        idx === si
          ? { ...sec, rows: sec.rows.filter((_, ridx) => ridx !== ri) }
          : sec
      )
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number || !title || !description || !footerText) return
    setSending(true)
    try {
      await sendList(instanceId, {
        number,
        title,
        description,
        footerText,
        buttonText: buttonText || undefined,
        sections,
      })
      toast.success("Lista enviada")
      setNumber("")
      setTitle("")
      setDescription("")
      setFooterText("")
      setButtonText("")
      setSections([{ title: "", rows: [{ title: "" }] }])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="list-number">Número</Label>
        <Input
          id="list-number"
          placeholder="5511999999999"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="list-title">Título</Label>
        <Input
          id="list-title"
          placeholder="Título de la lista"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="list-desc">Descripción</Label>
        <Input
          id="list-desc"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="list-footer">Footer</Label>
        <Input
          id="list-footer"
          placeholder="Texto del footer"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="list-btn">Texto del botón (opcional)</Label>
        <Input
          id="list-btn"
          placeholder="Ver opciones"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Secciones</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar sección
          </Button>
        </div>
        {sections.map((section, si) => (
          <div key={si} className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Título de sección (opcional)"
                value={section.title || ""}
                onChange={(e) =>
                  setSections((s) =>
                    s.map((sec, idx) =>
                      idx === si ? { ...sec, title: e.target.value } : sec
                    )
                  )
                }
                className="max-w-xs"
              />
              {sections.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSection(si)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="space-y-2 pl-4 border-l-2">
              <Label className="text-xs">Filas</Label>
              {section.rows.map((row, ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <Input
                    placeholder={`Fila ${ri + 1}`}
                    value={row.title}
                    onChange={(e) =>
                      setSections((s) =>
                        s.map((sec, sidx) =>
                          sidx === si
                            ? {
                                ...sec,
                                rows: sec.rows.map((r, ridx) =>
                                  ridx === ri
                                    ? { ...r, title: e.target.value }
                                    : r
                                ),
                              }
                            : sec
                        )
                      )
                    }
                    className="flex-1"
                  />
                  {section.rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(si, ri)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addRow(si)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar fila
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={sending}>
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <List className="mr-2 h-4 w-4" />
        )}
        Enviar Lista
      </Button>
    </form>
  )
}
