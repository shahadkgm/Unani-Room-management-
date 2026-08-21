import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity,
  BedDouble,
  CalendarRange,
  LayoutDashboard,
  Menu,
  Users,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useHospital } from "@/lib/hospital/store";
import { cn } from "@/lib/utils";
import { pretty, todayISO } from "@/lib/hospital/dates";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rooms", label: "Rooms", icon: BedDouble },
  { to: "/calendar", label: "Room Calendar", icon: CalendarRange },
  { to: "/patients", label: "Patients", icon: Users },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <Stethoscope className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-semibold text-sidebar-foreground">
          Unani Hospital
        </span>
        <span className="block text-xs text-sidebar-foreground/60">Room Management</span>
      </span>
    </div>
  );
}

function RoleSwitch() {
  const { role, setRole } = useHospital();
  return (
    <div className="rounded-xl bg-sidebar-accent/60 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
        Signed in as
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-sidebar/60 p-1">
        {(["admin", "receptionist"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-semibold capitalize transition-colors",
              role === r
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/60">
        <ShieldCheck className="size-3.5" />
        {role === "admin" ? "Full access incl. maintenance" : "Admissions & discharges"}
      </p>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { role } = useHospital();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-sidebar p-5 lg:flex">
        <div className="space-y-8">
          <Brand />
          <NavLinks />
        </div>
        <RoleSwitch />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-5">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="space-y-8">
                  <Brand />
                  <NavLinks onNavigate={() => setOpen(false)} />
                  <RoleSwitch />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>
              {subtitle ? (
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {actions}
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex">
                <Activity className="size-4 text-primary" />
                <span className="capitalize">{role}</span>
                <span className="text-border">|</span>
                {pretty(todayISO())}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
