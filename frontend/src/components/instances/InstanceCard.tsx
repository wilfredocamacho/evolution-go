import { useNavigate } from "react-router-dom"
import { Wifi, WifiOff, QrCode, ChevronRight } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Instance } from "@/types/instance"

interface Props {
  instance: Instance
}

export function InstanceCard({ instance }: Props) {
  const navigate = useNavigate()

  const status = instance.connected ? "success" : instance.qrcode ? "warning" : "destructive"
  const statusLabel = instance.connected ? "Conectado" : instance.qrcode ? "Esperando QR" : "Desconectado"

  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      onClick={() => navigate(`/instances/${instance.id}`)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              instance.connected
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {instance.connected ? (
              <Wifi className="h-5 w-5" />
            ) : instance.qrcode ? (
              <QrCode className="h-5 w-5" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
          </div>
          <div>
            <CardTitle className="text-base font-medium">
              {instance.name || "Sin nombre"}
            </CardTitle>
            {instance.jid && (
              <p className="text-xs text-muted-foreground">{instance.jid}</p>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant={status}>{statusLabel}</Badge>
          <span className="truncate pl-2 text-xs text-muted-foreground">
            {instance.id.slice(0, 8)}...
          </span>
        </div>
        {instance.token && (
          <p className="mt-1 truncate text-[10px] text-muted-foreground/60" title={instance.token}>
            Token: {instance.token.slice(0, 12)}...
          </p>
        )}
      </CardContent>
    </Card>
  )
}

