import {
  LayoutDashboard,
  Smartphone,
  Send,
  LogOut,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "./ThemeToggle"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const instanceId = location.pathname.match(/\/instances\/([^/]+)/)?.[1]

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/"
    return location.pathname.startsWith(path)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    onNavigate?.()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r bg-sidebar-background">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
          EG
        </div>
        <span className="font-semibold text-sidebar-primary">Evolution GO</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavItem
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Dashboard"
          active={isActive("/") && location.pathname === "/"}
          onClick={() => handleNavigate("/")}
        />

        {/* Current instance indicator */}
        {isActive("/instances") && instanceId && (
          <>
            <NavItem
              icon={<Smartphone className="h-4 w-4" />}
              label="Detalle"
              active={!location.pathname.includes("/send")}
              onClick={() => handleNavigate(`/instances/${instanceId}`)}
            />
            <NavItem
              icon={<Send className="h-4 w-4" />}
              label="Enviar mensaje"
              active={location.pathname.includes("/send")}
              onClick={() => handleNavigate(`/instances/${instanceId}/send`)}
            />
          </>
        )}
      </nav>

      <Separator />

      {/* Bottom */}
      <div className="flex items-center justify-between px-3 py-3">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Salir
        </Button>
      </div>
    </aside>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
