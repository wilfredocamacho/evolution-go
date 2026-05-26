import { useState, type FormEvent } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useAuth, validateApiKey } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, Loader2 } from "lucide-react"

export function Login() {
  const [key, setKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { setApiKey, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmed = key.trim()
    if (!trimmed) {
      setError("Ingresa una clave de API")
      return
    }

    setLoading(true)
    try {
      const valid = await validateApiKey(trimmed)
      if (!valid) {
        setError("Clave de API inválida")
        return
      }
      setApiKey(trimmed)
      navigate("/", { replace: true })
    } catch {
      setError("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Evolution GO</CardTitle>
          <CardDescription>Panel de Administración</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Clave de API Global</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Ingresa tu GlobalApiKey"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
