import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CircleCheck,
  CircleDot,
  LogOut,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/frontend/components/AppShell";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { Progress } from "@/frontend/components/ui/progress";
import { Button } from "@/frontend/components/ui/button";
import { useHospital, useStats } from "@/frontend/store/hospitalStore";
import { daysUntil, pretty, todayISO } from "@/shared/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Unani Hospital Room Management" },
      {
        name: "description",
        content:
          "Live occupancy dashboard for Unani Hospital: track available, occupied, reserved and maintenance rooms plus today's admissions and discharges.",
      },
      { property: "og:title", content: "Unani Hospital Room Management Dashboard" },
      {
        property: "og:description",
        content: "Track room occupancy, admissions and expected discharges in one place.",
      },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: typeof BedDouble;
  tone: "primary" | "available" | "occupied" | "reserved" | "maintenance";
}) {
  const tones = {
    primary: "bg-secondary text-primary",
    available: "bg-available-soft text-available",
    occupied: "bg-occupied-soft text-occupied",
    reserved: "bg-reserved-soft text-reserved-foreground",
    maintenance: "bg-maintenance-soft text-maintenance",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={cn("grid size-9 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Dashboard() {
  const stats = useStats();
  const { bookings, patientById, roomById, rooms, roomStatus } = useHospital();
  const t = todayISO();

  const admissionsToday = bookings.filter((b) => b.admissionDate === t);
  const dischargesToday = bookings.filter(
    (b) => b.status !== "discharged" && b.expectedDischargeDate === t,
  );
  const attention = [...stats.overdue, ...stats.dueSoon].slice(0, 6);
  const freeRooms = rooms.filter((r) => roomStatus(r.id) === "available").slice(0, 8);

  return (
    <AppShell
      title="Hospital overview"
      subtitle={`${stats.occupancyRate}% occupancy · ${stats.total} rooms across 5 wards`}
      actions={
        <Button asChild size="sm">
          <Link to="/rooms">
            Admit patient <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total rooms"
            value={stats.total}
            hint="Across all wards"
            icon={BedDouble}
            tone="primary"
          />
          <StatCard
            label="Available"
            value={stats.available}
            hint="Ready for admission"
            icon={CircleCheck}
            tone="available"
          />
          <StatCard
            label="Occupied"
            value={stats.occupied}
            hint={`${stats.occupancyRate}% of capacity`}
            icon={CircleDot}
            tone="occupied"
          />
          <StatCard
            label="Reserved"
            value={stats.reserved}
            hint="Upcoming bookings"
            icon={CalendarCheck}
            tone="reserved"
          />
          <StatCard
            label="Maintenance"
            value={stats.maintenance}
            hint="Temporarily out of service"
            icon={Wrench}
            tone="maintenance"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
            <h2 className="text-base font-semibold">Today · {pretty(t)}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-available-soft/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Admissions today
                </p>
                <p className="mt-1 font-display text-2xl font-bold">{admissionsToday.length}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {admissionsToday.length === 0 ? (
                    <li className="text-muted-foreground">No admissions recorded yet.</li>
                  ) : (
                    admissionsToday.map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {patientById(b.patientId)?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Room {roomById(b.roomId)?.number}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-border bg-reserved-soft/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Expected discharges today
                </p>
                <p className="mt-1 font-display text-2xl font-bold">{dischargesToday.length}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {dischargesToday.length === 0 ? (
                    <li className="text-muted-foreground">Nothing scheduled for today.</li>
                  ) : (
                    dischargesToday.map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {patientById(b.patientId)?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Room {roomById(b.roomId)?.number}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Occupancy</span>
                <span className="text-muted-foreground">
                  {stats.occupied}/{stats.total} rooms
                </span>
              </div>
              <Progress value={stats.occupancyRate} className="mt-2" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="size-4 text-reserved" />
              Discharge alerts
            </h2>
            <ul className="mt-4 space-y-3">
              {attention.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No upcoming or overdue discharges.
                </li>
              ) : (
                attention.map((b) => {
                  const d = daysUntil(b.expectedDischargeDate);
                  return (
                    <li
                      key={b.id}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm",
                        d < 0
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-reserved/40 bg-reserved-soft",
                      )}
                    >
                      <p className="font-semibold">{patientById(b.patientId)?.name}</p>
                      <p className="text-xs">
                        Room {roomById(b.roomId)?.number} ·{" "}
                        {d < 0
                          ? `overdue by ${Math.abs(d)} day(s)`
                          : d === 0
                            ? "due today"
                            : `due in ${d} day(s)`}
                      </p>
                    </li>
                  );
                })
              )}
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/patients">
                <LogOut className="mr-1.5 size-4" />
                Manage discharges
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Rooms ready for admission</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/rooms">
                Open room board <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {freeRooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every room is currently allocated.</p>
            ) : (
              freeRooms.map((room) => (
                <span
                  key={room.id}
                  className="flex items-center gap-2 rounded-xl border border-available/40 bg-available-soft px-3 py-2 text-sm"
                >
                  <strong className="font-display">{room.number}</strong>
                  <span className="text-xs text-muted-foreground">{room.type}</span>
                </span>
              ))
            )}
          </div>
          <div className="mt-4">
            <StatusBadge status="available" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
