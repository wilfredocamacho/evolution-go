import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { MessageTypeSelector, type MessageType } from "@/components/send/MessageTypeSelector"
import { TextMessageForm } from "@/components/send/TextMessageForm"
import { MediaMessageForm } from "@/components/send/MediaMessageForm"
import { LinkMessageForm } from "@/components/send/LinkMessageForm"
import { PollMessageForm } from "@/components/send/PollMessageForm"
import { StickerMessageForm } from "@/components/send/StickerMessageForm"
import { LocationMessageForm } from "@/components/send/LocationMessageForm"
import { ContactMessageForm } from "@/components/send/ContactMessageForm"
import { ButtonMessageForm } from "@/components/send/ButtonMessageForm"
import { ListMessageForm } from "@/components/send/ListMessageForm"
import { CarouselMessageForm } from "@/components/send/CarouselMessageForm"
import { StatusTextForm } from "@/components/send/StatusTextForm"
import { StatusMediaForm } from "@/components/send/StatusMediaForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Smartphone, Loader2 } from "lucide-react"
import { useInstance } from "@/hooks/useInstanceQuery"

const formComponents: Record<MessageType, React.ComponentType<{ instanceId: string }>> = {
  text: TextMessageForm,
  media: MediaMessageForm,
  link: LinkMessageForm,
  poll: PollMessageForm,
  sticker: StickerMessageForm,
  location: LocationMessageForm,
  contact: ContactMessageForm,
  button: ButtonMessageForm,
  list: ListMessageForm,
  carousel: CarouselMessageForm,
  "status-text": StatusTextForm,
  "status-media": StatusMediaForm,
}

const typeLabels: Record<MessageType, string> = {
  text: "Texto",
  media: "Media",
  link: "Enlace",
  poll: "Encuesta",
  sticker: "Sticker",
  location: "Ubicación",
  contact: "Contacto",
  button: "Botones",
  list: "Lista",
  carousel: "Carrusel",
  "status-text": "Estado texto",
  "status-media": "Estado media",
}

export function SendMessage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [type, setType] = useState<MessageType>("text")

  const { data: instance, isLoading } = useInstance(id!)

  const FormComponent = formComponents[type]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/instances/${id}`)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Enviar mensaje</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Cargando instancia...
              </span>
            ) : instance ? (
              `Instancia: ${instance.name}`
            ) : (
              "Selecciona el tipo de mensaje y completa el formulario"
            )}
          </p>
        </div>
      </div>

      {/* Message type selector */}
      <MessageTypeSelector selected={type} onSelect={setType} />

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" />
            {typeLabels[type]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <FormComponent instanceId={id!} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
