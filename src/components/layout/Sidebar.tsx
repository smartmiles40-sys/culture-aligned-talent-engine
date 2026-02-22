import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, Users, FileText, Settings } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/vagas", icon: Briefcase, label: "Vagas" },
  { to: "/candidatos", icon: Users, label: "Candidatos" },
  { to: "/formulario", icon: FileText, label: "Formulário" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary font-display text-sm font-bold text-secondary-foreground">
          SV
        </div>
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold text-sidebar-foreground">Se Tu For</span>
          <span className="text-[11px] text-sidebar-foreground/60">Eu Vou • Recrutamento</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <p className="font-display text-xs font-semibold text-sidebar-foreground">Cultura é inegociável</p>
          <p className="mt-1 text-[10px] text-sidebar-foreground/50">Alta performance + alinhamento cultural</p>
        </div>
      </div>
    </aside>
  );
}
