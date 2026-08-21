import { BedDouble, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHospital, type RoomComputedStatus } from "@/lib/hospital/store";
import { daysUntil } from "@/lib/hospital/dates";
import type { Room } from "@/lib/hospital/types";

const tileStyles: Record<RoomComputedStatus, string> = {
  available: "border-available/40 bg-available-soft hover:border-available hover:shadow-lift",
  occupied: "border-occupied/40 bg-occupied-soft hover:border-occupied hover:shadow-lift",
  reserved: "border-reserved/50 bg-reserved-soft hover:border-reserved hover:shadow-lift",
  maintenance: "border-border bg-maintenance-soft opacity-80",
};

const numberStyles: Record<RoomComputedStatus, string> = {
  available: "text-available",
  occupied: "text-occupied",
  reserved: "text-reserved-foreground",
  maintenance: "text-maintenance",
};

export function RoomTile({ room, onSelect }: { room: Room; onSelect: (room: Room) => void }) {
  const { roomStatus, activeBooking, upcomingBooking, patientById } = useHospital();
  const status = roomStatus(room.id);
  const booking = status === "occupied" ? activeBooking(room.id) : upcomingBooking(room.id);
  const patient = booking ? patientById(booking.patientId) : undefined;
  const remaining = booking?.expectedDischargeDate ? daysUntil(booking.expectedDischargeDate) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(room)}
      className={cn(
        "group relative flex h-32 w-full flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        tileStyles[status],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("font-display text-2xl font-bold", numberStyles[status])}>
          {room.number}
        </span>
        {status === "maintenance" ? (
          <Wrench className="size-4 text-maintenance" />
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <BedDouble className="size-3.5" />
            {room.beds}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="truncate text-xs font-semibold text-foreground/80">{room.type}</p>
        {status === "available" ? (
          <p className="text-[11px] text-muted-foreground">Tap to admit a patient</p>
        ) : status === "maintenance" ? (
          <p className="truncate text-[11px] text-muted-foreground">
            {room.maintenanceNote ?? "Under maintenance"}
          </p>
        ) : (
          <p className="truncate text-[11px] text-muted-foreground">
            {patient?.name}
            {status === "occupied" && remaining !== null
              ? remaining < 0
                ? ` · ${Math.abs(remaining)}d overdue`
                : ` · ${remaining}d left`
              : " · reserved"}
          </p>
        )}
      </div>
    </button>
  );
}
