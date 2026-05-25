import { useState } from "react"
import { usePairInstance } from "@/hooks/useInstanceQuery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Check, Link, Loader2 } from "lucide-react"

interface PairPhoneFormProps {
  instanceId: string
}

export function PairPhoneForm({ instanceId }: PairPhoneFormProps) {
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const pair = usePairInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    try {
      const result = await pair.mutateAsync({ id: instanceId, phone: phone.trim() })
      setCode(result)
    } catch {
      // toast handled by hook
    }
  }

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de teléfono</Label>
            <Input
              id="phone"
              placeholder="5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={pair.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Formato internacional, sin + ni espacios
            </p>
          </div>

          <Button type="submit" disabled={pair.isPending || !phone.trim()}>
            {pair.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link className="mr-2 h-4 w-4" />
            )}
            Vincular
          </Button>
        </form>

        {code && (
          <div className="mt-4 rounded-md border bg-muted/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Código de vinculación</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="select-all rounded bg-background px-3 py-2 font-mono text-lg tracking-wider">
              {code}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
