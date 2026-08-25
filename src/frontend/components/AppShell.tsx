import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import {
  Activity,
  BedDouble,
  CalendarRange,
  LayoutDashboard,
  Menu,
  Users,
  ShieldCheck,
  Stethoscope,
  LogOut,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/frontend/components/ui/sheet";
import { Button } from "@/frontend/components/ui/button";
import { useHospital } from "@/frontend/store/hospitalStore";
import { cn } from "@/lib/utils";
import { pretty, todayISO } from "@/shared/dates";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const pathname = location.pathname;
  const { currentUser } = useHospital();

  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/rooms", label: "Rooms", icon: BedDouble },
    { to: "/calendar", label: "Room Calendar", icon: CalendarRange },
    { to: "/patients", label: "Patients", icon: Users },
  ];

  if (currentUser?.role === "admin") {
    links.push({ to: "/admin/users", label: "Admin Portal", icon: ShieldCheck });
  }

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ to, label, icon: Icon }) => {
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

function UserProfile() {
  const { currentUser, logout } = useHospital();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="rounded-xl bg-sidebar-accent/60 p-4 border border-sidebar-border/30">
      <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
        Signed In As
      </p>
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-sm">
          {currentUser.username[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {currentUser.username}
          </p>
          <span className="inline-block rounded-full bg-sidebar-primary/20 px-2 py-0.5 text-[10px] font-bold capitalize text-sidebar-primary mt-0.5">
            {currentUser.role}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="mt-3.5 w-full justify-start gap-2 h-9 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <LogOut className="size-4" />
        Sign Out
      </Button>
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
  const { currentUser, hydrated } = useHospital();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !currentUser) {
      navigate({ to: "/login" });
    }
  }, [currentUser, hydrated, navigate]);

  if (!currentUser) {
    return null; // Prevents layout flash before redirect
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-sidebar p-5 lg:flex">
        <div className="space-y-8">
          <Brand />
          <NavLinks />
        </div>
        <UserProfile />
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
                  <UserProfile />
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
                <span className="capitalize">{currentUser.role}</span>
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
