import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, Phone, User, Wrench, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Separator } from "@/frontend/components/ui/separator";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { useHospital } from "@/frontend/store/hospitalStore";
import { daysUntil, pretty, todayISO } from "@/shared/dates";
import type { Room } from "@/shared/types";

export function RoomDetailsDialog({
  room,
  open,
  onOpenChange,
}: {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    roomStatus,
    activeBooking,
    upcomingBooking,
    bookingsForRoom,
    patientById,
    dischargePatient,
    toggleMaintenance,
    currentUser,
    removeRoom,
  } = useHospital();
  const [dischargeDate, setDischargeDate] = useState(todayISO());

  if (!room) return null;

  const status = roomStatus(room.id);
  const current = activeBooking(room.id);
  const next = upcomingBooking(room.id);
  const booking = current ?? next;
  const patient = booking ? patientById(booking.patientId) : undefined;
  const history = bookingsForRoom(room.id).filter((b) => b.id !== booking?.id);
  const remaining = booking ? daysUntil(booking.expectedDischargeDate) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            Room {room.number}
            <StatusBadge status={status} />
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {room.type} · {room.ward} · Floor {room.floor} · {room.beds} bed(s) · ₹
          {room.ratePerDay.toLocaleString("en-IN")}/day
        </p>

        {status === "maintenance" ? (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-maintenance-soft p-4 text-sm">
            <Wrench className="mt-0.5 size-4 text-maintenance" />
            <span>{room.maintenanceNote ?? "This room is temporarily out of service."}</span>
          </div>
        ) : null}

        {booking && patient ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-display text-base font-semibold">
                    <User className="size-4 text-primary" />
                    {patient.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {patient.age} yrs · {patient.gender}
                    {patient.ailment ? ` · ${patient.ailment}` : ""}
                  </p>
                </div>
                <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                  {current ? "Current patient" : "Upcoming reservation"}
                </span>
              </div>

              <Separator className="my-4" />

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Admission</dt>
                  <dd className="font-medium">{pretty(booking.admissionDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Expected discharge</dt>
                  <dd className="font-medium">{pretty(booking.expectedDischargeDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Patient contact</dt>
                  <dd className="flex items-center gap-1.5 font-medium">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {patient.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Guardian</dt>
                  <dd className="font-medium">
                    {patient.guardianName} · {patient.guardianPhone}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Address</dt>
                  <dd className="font-medium">{patient.address}</dd>
                </div>
                {booking.notes ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Notes</dt>
                    <dd className="font-medium">{booking.notes}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {current ? (
              <div
                className={
                  remaining < 0
                    ? "flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                    : remaining <= 2
                      ? "flex items-center gap-2 rounded-xl border border-reserved/50 bg-reserved-soft px-4 py-3 text-sm font-medium text-reserved-foreground"
                      : "flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium"
                }
              >
                {remaining < 0 ? (
                  <AlertTriangle className="size-4" />
                ) : (
                  <CalendarClock className="size-4" />
                )}
                {remaining < 0
                  ? `Discharge overdue by ${Math.abs(remaining)} day(s).`
                  : remaining === 0
                    ? "Discharge expected today."
                    : `${remaining} day(s) remaining until expected discharge.`}
              </div>
            ) : null}

            {current ? (
              <div className="rounded-xl border border-border p-4">
                <Label htmlFor="actual-discharge" className="text-sm">
                  Actual discharge date
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Input
                    id="actual-discharge"
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                    className="max-w-48"
                  />
                  <Button
                    onClick={() => {
                      dischargePatient(current.id, dischargeDate);
                      toast.success(`${patient.name} discharged from room ${room.number}.`);
                      onOpenChange(false);
                    }}
                  >
                    Discharge patient
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : status !== "maintenance" ? (
          <p className="text-sm text-muted-foreground">No active booking for this room.</p>
        ) : null}

        {history.length ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Booking history</h3>
            <ul className="space-y-2">
              {history.slice(0, 6).map((b) => {
                const p = patientById(b.patientId);
                return (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{p?.name ?? "Unknown patient"}</span>
                    <span className="text-xs text-muted-foreground">
                      {pretty(b.admissionDate)} →{" "}
                      {pretty(b.actualDischargeDate ?? b.expectedDischargeDate)}
                      {b.status === "discharged" ? " · discharged" : ` · ${b.status}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {currentUser?.role === "admin" ? (
          <div className="flex justify-between mt-4 gap-2">
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm(`Are you sure you want to permanently delete Room ${room.number}?`)) {
                  const res = await removeRoom(room.id);
                  if (res.ok) {
                    toast.success(res.message);
                    onOpenChange(false);
                  } else {
                    toast.error(res.message);
                  }
                }
              }}
            >
              <Trash className="mr-2 size-4" />
              Delete Room
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (!room.maintenance && (current || next)) {
                  toast.error("Room has bookings — discharge or move the patient first.");
                  return;
                }
                toggleMaintenance(room.id, "Marked for maintenance by admin");
                toast.success(
                  room.maintenance
                    ? `Room ${room.number} returned to service.`
                    : `Room ${room.number} marked under maintenance.`,
                );
                onOpenChange(false);
              }}
            >
              <Wrench className="mr-2 size-4" />
              {room.maintenance ? "Return to service" : "Mark under maintenance"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
