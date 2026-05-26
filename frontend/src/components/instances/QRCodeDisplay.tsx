import { useState } from "react"
import { useInstanceQr, useConnectInstance } from "@/hooks/useInstanceQuery"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { QrCode, Smartphone, RefreshCw, AlertCircle } from "lucide-react"
import { PairPhoneForm } from "@/components/instances/PairPhoneForm"

interface QRCodeDisplayProps {
  instanceId: string
  loggedIn: boolean
}

export function QRCodeDisplay({ instanceId, loggedIn }: QRCodeDisplayProps) {
  const [mode, setMode] = useState<"idle" | "qr" | "pairing">("idle")
  const { data: qrData, isLoading, isError } = useInstanceQr(instanceId, mode === "qr")
  const connect = useConnectInstance()

  if (loggedIn) {
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

  if (mode === "pairing") {
    return <PairPhoneForm instanceId={instanceId} />
  }

  if (mode === "idle") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="rounded-full bg-muted p-4">
            <QrCode className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Conecta tu WhatsApp para empezar a usar la instancia
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
            <Button
              className="flex-1"
              onClick={() => {
                connect.mutate({ id: instanceId })
                setMode("qr")
              }}
              disabled={connect.isPending}
            >
              {connect.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Escanear QR
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setMode("pairing")}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Código
            </Button>
          </div>
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
            onClick={() => {
              connect.mutate({ id: instanceId })
              setMode("qr")
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
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
            variant="outline"
            size="sm"
            onClick={() => {
              connect.mutate({ id: instanceId })
              setMode("qr")
            }}
            disabled={connect.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generar QR
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-6">
        <img
          src={qrData.qrcode}
          alt="QR Code"
          className="h-52 w-52 rounded-lg border"
        />
        <p className="text-xs text-muted-foreground">
          Escanea con WhatsApp para conectar
        </p>
      </CardContent>
    </Card>
  )
}
