import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateInstance } from "@/hooks/useInstanceQuery"

export function CreateInstanceDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [token, setToken] = useState("")
  const [webhook, setWebhook] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const createMutation = useCreateInstance()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "El nombre es requerido"
    if (!token.trim()) newErrors.token = "El token es requerido"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const instance = await createMutation.mutateAsync({
        name: name.trim(),
        token: token.trim(),
        webhook: webhook.trim() || undefined,
      })
      setOpen(false)
      resetForm()
      if (instance?.id) {
        navigate(`/instances/${instance.id}`)
      }
    } catch {
      // Error toast handled by mutation
    }
  }

  const resetForm = () => {
    setName("")
    setToken("")
    setWebhook("")
    setErrors({})
  }

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Instancia
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Instancia</DialogTitle>
          <DialogDescription>
            Crea una nueva instancia de WhatsApp con un nombre y token único.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Mi instancia"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="token">Token (opcional)</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground underline"
                onClick={() => setToken(crypto.randomUUID())}
              >
                Regenerar
              </button>
            </div>
            <Input
              id="token"
              placeholder="Se genera automáticamente"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook">Webhook (opcional)</Label>
            <Input
              id="webhook"
              type="url"
              placeholder="https://ejemplo.com/webhook"
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
