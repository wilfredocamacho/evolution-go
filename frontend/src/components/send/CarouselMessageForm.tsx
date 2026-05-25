import { useState } from "react"
import { sendCarousel } from "@/lib/send-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, LayoutDashboard } from "lucide-react"
import { toast } from "sonner"
import type { CarouselCard } from "@/types/send"

interface CarouselMessageFormProps {
  instanceId: string
}

export function CarouselMessageForm({ instanceId }: CarouselMessageFormProps) {
  const [number, setNumber] = useState("")
  const [body, setBody] = useState("")
  const [footer, setFooter] = useState("")
  const [cards, setCards] = useState<CarouselCard[]>([
    {
      header: { title: "" },
      body: { text: "" },
    },
  ])
  const [sending, setSending] = useState(false)

  const addCard = () =>
    setCards((c) => [...c, { header: { title: "" }, body: { text: "" } }])
  const removeCard = (i: number) => {
    if (cards.length <= 1) return
    setCards((c) => c.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number) return
    setSending(true)
    try {
      await sendCarousel(instanceId, {
        number,
        body: body || undefined,
        footer: footer || undefined,
        cards,
      })
      toast.success("Carrusel enviado")
      setNumber("")
      setBody("")
      setFooter("")
      setCards([{ header: { title: "" }, body: { text: "" } }])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="car-number">Número</Label>
        <Input
          id="car-number"
          placeholder="5511999999999"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="car-body">Cuerpo (opcional)</Label>
        <Input
          id="car-body"
          placeholder="Texto del cuerpo"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="car-footer">Footer (opcional)</Label>
        <Input
          id="car-footer"
          placeholder="Texto del footer"
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Cards</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCard}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar card
          </Button>
        </div>
        {cards.map((card, i) => (
          <div key={i} className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Card {i + 1}</span>
              {cards.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCard(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Título</Label>
              <Input
                placeholder="Título del card"
                value={card.header.title || ""}
                onChange={(e) =>
                  setCards((c) =>
                    c.map((v, idx) =>
                      idx === i
                        ? {
                            ...v,
                            header: { ...v.header, title: e.target.value },
                          }
                        : v
                    )
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Texto</Label>
              <Input
                placeholder="Texto del card"
                value={card.body.text || ""}
                onChange={(e) =>
                  setCards((c) =>
                    c.map((v, idx) =>
                      idx === i
                        ? { ...v, body: { text: e.target.value } }
                        : v
                    )
                  )
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Imagen URL (opcional)</Label>
                <Input
                  placeholder="https://..."
                  value={card.header.imageUrl || ""}
                  onChange={(e) =>
                    setCards((c) =>
                      c.map((v, idx) =>
                        idx === i
                          ? {
                              ...v,
                              header: { ...v.header, imageUrl: e.target.value },
                            }
                          : v
                      )
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Footer (opcional)</Label>
                <Input
                  placeholder="Footer del card"
                  value={card.footer || ""}
                  onChange={(e) =>
                    setCards((c) =>
                      c.map((v, idx) =>
                        idx === i ? { ...v, footer: e.target.value } : v
                      )
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={sending}>
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LayoutDashboard className="mr-2 h-4 w-4" />
        )}
        Enviar Carrusel
      </Button>
    </form>
  )
}
