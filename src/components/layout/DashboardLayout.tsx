import { type ReactNode, useState } from "react";
import { CalendarDays, DoorOpen, ListChecks, Menu, Volleyball, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppLogo } from "../AppLogo";
import { Button } from "../ui/button";
import { demoSignOut } from "../../lib/localDemo";
import { isLocalDemoEnabled, supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";

const dashboardLinks = [
  { to: "/dashboard", label: "Reservas", icon: ListChecks },
  { to: "/dashboard/courts", label: "Gerenciar quadras", icon: Volleyball },
];

export function DashboardLayout({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function signOut() {
    if (isLocalDemoEnabled) {
      await demoSignOut();
    } else {
      await supabase.auth.signOut();
    }
    toast.success("Sessão encerrada.");
    navigate("/login");
  }

  const navigation = (
    <div className="flex h-full flex-col">
      <div className="p-5">
        <AppLogo />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {dashboardLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100",
                isActive && "bg-green-50 text-green-700",
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <Button className="w-full justify-start" variant="ghost" onClick={signOut}>
          <DoorOpen className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:block">{navigation}</aside>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
          <aside className="h-full w-80 max-w-[88vw] bg-white shadow-2xl">
            <div className="flex justify-end p-3">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            {navigation}
          </aside>
        </div>
      )}

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
                  <CalendarDays className="h-4 w-4" />
                  ArenaHub gestor
                </p>
                <h1 className="text-xl font-extrabold text-slate-950 sm:text-2xl">{title}</h1>
              </div>
            </div>
            {actions}
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
