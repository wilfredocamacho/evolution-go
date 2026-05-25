import { useInstanceQr, useConnectInstance } from "@/hooks/useInstanceQuery"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { QrCode, RefreshCw, AlertCircle } from "lucide-react"

interface QRCodeDisplayProps {
  instanceId: string
  connected: boolean
}

export function QRCodeDisplay({ instanceId, connected }: QRCodeDisplayProps) {
  const { data: qrData, isLoading, isError } = useInstanceQr(instanceId, !connected)
  const connect = useConnectInstance()

  if (connected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <div className="rounded-full bg-green-500/10 p-4">
            <QrCode className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground">Instancia conectada</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <Skeleton className="h-48 w-48 rounded-lg" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">Error al cargar QR</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => connect.mutate({ id: instanceId })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Conectar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!qrData?.qrcode) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="rounded-full bg-muted p-4">
            <QrCode className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Esperando QR...</p>
          <Button
            variant="default"
            size="sm"
            onClick={() => connect.mutate({ id: instanceId })}
            disabled={connect.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Conectar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-6">
        <img
          src={`data:image/png;base64,${qrData.qrcode}`}
          alt="QR Code"
          className="h-52 w-52 rounded-lg border"
        />
        <p className="text-xs text-muted-foreground">
          Escanea con WhatsApp. Se actualiza cada 2s.
        </p>
        {qrData.code && (
          <p className="font-mono text-xs text-muted-foreground">
            Código: {qrData.code}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
