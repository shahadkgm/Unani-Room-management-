import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/frontend/components/AppShell";
import { Button } from "@/frontend/components/ui/button";
import { StatusLegend } from "@/frontend/components/StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/frontend/components/ui/tooltip";
import { useHospital } from "@/frontend/store/hospitalStore";
import { iso, pretty, today, todayISO } from "@/shared/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Room Calendar — Unani Hospital Room Management" },
      {
        name: "description",
        content:
          "Timeline view of every Unani Hospital room showing past, current and future bookings so reception can spot free dates instantly.",
      },
      { property: "og:title", content: "Unani Hospital Room Calendar" },
      {
        property: "og:description",
        content: "Per-room booking timeline with past, current and upcoming stays.",
      },
    ],
  }),
  component: CalendarPage,
});

const WINDOW = 28;

function CalendarPage() {
  const { rooms, bookings, patientById } = useHospital();
  const [offset, setOffset] = useState(0);

  const days = useMemo(
    () => Array.from({ length: WINDOW }, (_, i) => addDays(today(), offset + i)),
    [offset],
  );
  const t = todayISO();

  const cellFor = (roomId: string, day: string) => {
    // 1. Prioritize active or reserved bookings covering this day (checkout day is exclusive)
    const activeOrReserved = bookings.find((b) => {
      if (b.roomId !== roomId || b.status === "discharged") return false;
      const end = b.expectedDischargeDate;
      return b.admissionDate === end ? day === b.admissionDate : (b.admissionDate <= day && day < end);
    });
    if (activeOrReserved) return activeOrReserved;

    // 2. Discharged bookings only cover days up to actualDischargeDate (or expectedDischargeDate if not set)
    const discharged = bookings.find((b) => {
      if (b.roomId !== roomId || b.status !== "discharged") return false;
      const end = b.actualDischargeDate || b.expectedDischargeDate;
      return b.admissionDate === end ? day === b.admissionDate : (b.admissionDate <= day && day < end);
    });
    return discharged || null;
  };

  return (
    <AppShell
      title="Room calendar"
      subtitle={`${pretty(iso(days[0]!))} → ${pretty(iso(days[days.length - 1]!))}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o - WINDOW)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o + WINDOW)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <StatusLegend />
          <p className="mt-2 text-xs text-muted-foreground">
            Each row is one room. Coloured blocks are bookings — empty cells are free dates.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="min-w-[900px]">
            <div className="mb-2 flex gap-1 pl-28">
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  className={cn(
                    "flex-1 text-center text-[10px] leading-tight",
                    iso(d) === t ? "font-bold text-primary" : "text-muted-foreground",
                  )}
                >
                  <span className="block">{format(d, "dd")}</span>
                  <span className="block">{format(d, "EEEEE")}</span>
                </div>
              ))}
            </div>

            {rooms.map((room) => (
              <div key={room.id} className="mb-1 flex items-center gap-1">
                <div className="w-28 shrink-0 pr-2">
                  <p className="font-display text-sm font-semibold">{room.number}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{room.type}</p>
                </div>
                {days.map((d) => {
                  const day = iso(d);
                  const booking = cellFor(room.id, day);
                  const patient = booking ? patientById(booking.patientId) : undefined;
                  const tone = room.maintenance
                    ? "bg-maintenance/50"
                    : !booking
                      ? "bg-available-soft"
                      : booking.status === "discharged"
                        ? "bg-muted-foreground/25"
                        : booking.admissionDate > t
                          ? "bg-reserved"
                          : "bg-occupied";
                  return (
                    <Tooltip key={day}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "h-8 flex-1 rounded-[3px] transition-opacity hover:opacity-80",
                            tone,
                            day === t && "ring-2 ring-primary ring-offset-1",
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs font-semibold">
                          Room {room.number} · {pretty(day)}
                        </p>
                        <p className="text-xs">
                          {room.maintenance
                            ? "Under maintenance"
                            : booking
                              ? `${patient?.name ?? "Patient"} · ${booking.status}`
                              : "Available"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
