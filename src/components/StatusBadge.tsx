import { cn } from "@/lib/utils";
import { statusLabel, type RoomComputedStatus } from "@/lib/hospital/store";

const styles: Record<RoomComputedStatus, string> = {
  available: "bg-available-soft text-available border-available/30",
  occupied: "bg-occupied-soft text-occupied border-occupied/30",
  reserved: "bg-reserved-soft text-reserved-foreground border-reserved/40",
  maintenance: "bg-maintenance-soft text-maintenance border-maintenance/30",
};

const dots: Record<RoomComputedStatus, string> = {
  available: "bg-available",
  occupied: "bg-occupied",
  reserved: "bg-reserved",
  maintenance: "bg-maintenance",
};

export function StatusBadge({
  status,
  className,
}: {
  status: RoomComputedStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[status])} />
      {statusLabel[status]}
    </span>
  );
}

export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {(Object.keys(statusLabel) as RoomComputedStatus[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-sm", dots[s])} />
          {statusLabel[s]}
        </span>
      ))}
    </div>
  );
}
