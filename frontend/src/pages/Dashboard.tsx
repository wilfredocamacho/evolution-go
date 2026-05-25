import { RefreshCw, Smartphone, Loader2 } from "lucide-react"
import { useInstances } from "@/hooks/useInstanceQuery"
import { InstanceCard } from "@/components/instances/InstanceCard"
import { CreateInstanceDialog } from "@/components/instances/CreateInstanceDialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export function Dashboard() {
  const { data: instances, isLoading, isError, refetch, isRefetching } = useInstances()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instancias</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus conexiones de WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
          <CreateInstanceDialog />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="mt-4 h-5 w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive">
            <Smartphone className="h-6 w-6" />
          </div>
          <h3 className="font-medium">Error al cargar instancias</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No se pudieron cargar las instancias. Verifica tu clave de API.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => refetch()}
          >
            <Loader2 className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && instances?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Smartphone className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium">No hay instancias</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primera instancia para comenzar.
          </p>
          <div className="mt-4">
            <CreateInstanceDialog />
          </div>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && instances && instances.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <InstanceCard key={instance.id} instance={instance} />
          ))}
        </div>
      )}
    </div>
  )
}
