import { type LucideIcon, MessageSquare, Image, Link2, BarChart3, Sticker, MapPin, User, MousePointerClick, List, LayoutDashboard, FileText, Video } from "lucide-react"
import { cn } from "@/lib/utils"

export type MessageType =
  | "text"
  | "media"
  | "link"
  | "poll"
  | "sticker"
  | "location"
  | "contact"
  | "button"
  | "list"
  | "carousel"
  | "status-text"
  | "status-media"

interface MessageTypeOption {
  type: MessageType
  label: string
  icon: LucideIcon
}

const messageTypes: MessageTypeOption[] = [
  { type: "text", label: "Texto", icon: MessageSquare },
  { type: "media", label: "Media", icon: Image },
  { type: "link", label: "Enlace", icon: Link2 },
  { type: "poll", label: "Encuesta", icon: BarChart3 },
  { type: "sticker", label: "Sticker", icon: Sticker },
  { type: "location", label: "Ubicación", icon: MapPin },
  { type: "contact", label: "Contacto", icon: User },
  { type: "button", label: "Botones", icon: MousePointerClick },
  { type: "list", label: "Lista", icon: List },
  { type: "carousel", label: "Carrusel", icon: LayoutDashboard },
  { type: "status-text", label: "Estado texto", icon: FileText },
  { type: "status-media", label: "Estado media", icon: Video },
]

interface MessageTypeSelectorProps {
  selected: MessageType
  onSelect: (type: MessageType) => void
}

export function MessageTypeSelector({ selected, onSelect }: MessageTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {messageTypes.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            selected === type
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
