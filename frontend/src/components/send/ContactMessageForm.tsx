import { useState } from "react"
import { sendContact } from "@/lib/send-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User } from "lucide-react"
import { toast } from "sonner"

interface ContactMessageFormProps {
  instanceId: string
}

export function ContactMessageForm({ instanceId }: ContactMessageFormProps) {
  const [number, setNumber] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [organization, setOrganization] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number || !fullName || !phone) return
    setSending(true)
    try {
      await sendContact(instanceId, {
        number,
        vcard: {
          fullName,
          phone,
          organization: organization || undefined,
        },
      })
      toast.success("Contacto enviado")
      setNumber("")
      setFullName("")
      setPhone("")
      setOrganization("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contact-number">Número destino</Label>
        <Input
          id="contact-number"
          placeholder="5511999999999"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Nombre completo</Label>
          <Input
            id="contact-name"
            placeholder="Juan Pérez"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Teléfono del contacto</Label>
          <Input
            id="contact-phone"
            placeholder="5511988888888"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-org">Organización (opcional)</Label>
        <Input
          id="contact-org"
          placeholder="Empresa S.A."
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={sending}>
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <User className="mr-2 h-4 w-4" />
        )}
        Enviar Contacto
      </Button>
    </form>
  )
}
