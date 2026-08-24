import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  Pencil,
  Phone,
  User,
  Wrench,
  Trash,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Separator } from "@/frontend/components/ui/separator";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { EditReservationDialog } from "@/frontend/components/EditReservationDialog";
import { AdmissionDialog } from "@/frontend/components/AdmissionDialog";
import { useHospital } from "@/frontend/store/hospitalStore";
import { daysUntil, pretty, todayISO } from "@/shared/dates";
import type { Booking, Room } from "@/shared/types";

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
    bookingsForRoom,
    patientById,
    dischargePatient,
    toggleMaintenance,
    currentUser,
    removeRoom,
  } = useHospital();

  const [dischargeDate, setDischargeDate] = useState(todayISO());
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [addBookingOpen, setAddBookingOpen] = useState(false);

  if (!room) return null;

  const status = roomStatus(room.id);
  const current = activeBooking(room.id);

  // All non-discharged bookings sorted ascending by admission date
  const allBookings = bookingsForRoom(room.id)
    .slice()
    .sort((a, b) => a.admissionDate.localeCompare(b.admissionDate));

  const activeAndUpcoming = allBookings.filter((b) => b.status !== "discharged");
  const history = allBookings.filter((b) => b.status === "discharged");

  const currentRemaining = current ? daysUntil(current.expectedDischargeDate) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
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

          {/* Maintenance notice */}
          {status === "maintenance" ? (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-maintenance-soft p-4 text-sm">
              <Wrench className="mt-0.5 size-4 text-maintenance" />
              <span>{room.maintenanceNote ?? "This room is temporarily out of service."}</span>
            </div>
          ) : null}

          {/* ── Active & Upcoming Bookings Timeline ── */}
          {activeAndUpcoming.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Active & Upcoming ({activeAndUpcoming.length})
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => setAddBookingOpen(true)}
                >
                  <CalendarPlus className="size-3.5" />
                  Add Booking
                </Button>
              </div>

              <ul className="space-y-3">
                {activeAndUpcoming.map((b) => {
                  const p = patientById(b.patientId);
                  const remaining = daysUntil(b.expectedDischargeDate);
                  const isActive = b.status === "active";

                  return (
                    <li
                      key={b.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-2 font-display text-sm font-semibold">
                            <User className="size-3.5 text-primary" />
                            {p?.name ?? "Unknown patient"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p?.age} yrs · {p?.gender}
                            {p?.ailment ? ` · ${p.ailment}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              isActive
                                ? "bg-occupied-soft text-occupied"
                                : "bg-reserved-soft text-reserved-foreground"
                            }`}
                          >
                            {isActive ? "Active" : "Reserved"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs h-7"
                            onClick={() => setEditBooking(b)}
                          >
                            <Pencil className="size-3" />
                            Edit
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <dl className="grid gap-2 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">Admission</dt>
                          <dd className="font-medium">{pretty(b.admissionDate)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Expected discharge</dt>
                          <dd className="font-medium">{pretty(b.expectedDischargeDate)}</dd>
                        </div>
                        {p?.phone ? (
                          <div>
                            <dt className="text-muted-foreground">Contact</dt>
                            <dd className="flex items-center gap-1 font-medium">
                              <Phone className="size-3 text-muted-foreground" />
                              {p.phone}
                            </dd>
                          </div>
                        ) : null}
                        {p?.guardianName ? (
                          <div>
                            <dt className="text-muted-foreground">Guardian</dt>
                            <dd className="font-medium">
                              {p.guardianName} · {p.guardianPhone}
                            </dd>
                          </div>
                        ) : null}
                        {p?.address ? (
                          <div className="sm:col-span-2">
                            <dt className="text-muted-foreground">Address</dt>
                            <dd className="font-medium">{p.address}</dd>
                          </div>
                        ) : null}
                        {b.notes ? (
                          <div className="sm:col-span-2">
                            <dt className="text-muted-foreground">Notes</dt>
                            <dd className="font-medium">{b.notes}</dd>
                          </div>
                        ) : null}
                      </dl>

                      {/* Discharge alert bar for active bookings */}
                      {isActive ? (
                        <div
                          className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                            remaining < 0
                              ? "border border-destructive/40 bg-destructive/10 text-destructive"
                              : remaining <= 2
                              ? "border border-reserved/50 bg-reserved-soft text-reserved-foreground"
                              : "border border-border bg-muted"
                          }`}
                        >
                          {remaining < 0 ? (
                            <AlertTriangle className="size-3.5" />
                          ) : (
                            <CalendarClock className="size-3.5" />
                          )}
                          {remaining < 0
                            ? `Discharge overdue by ${Math.abs(remaining)} day(s).`
                            : remaining === 0
                            ? "Discharge expected today."
                            : `${remaining} day(s) until expected discharge.`}
                        </div>
                      ) : null}

                      {/* Discharge panel for the currently active booking */}
                      {b.id === current?.id ? (
                        <div className="mt-3 rounded-xl border border-border p-3">
                          <Label className="text-xs">Actual discharge date</Label>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            <Input
                              type="date"
                              value={dischargeDate}
                              onChange={(e) => setDischargeDate(e.target.value)}
                              className="max-w-44 text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (!p) return;
                                dischargePatient(b.id, dischargeDate);
                                toast.success(
                                  `${p.name} discharged from room ${room.number}.`
                                );
                                onOpenChange(false);
                              }}
                            >
                              Discharge patient
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : status !== "maintenance" ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No active bookings — this room is available.
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setAddBookingOpen(true)}
              >
                <CalendarPlus className="size-3.5" />
                Book this room
              </Button>
            </div>
          ) : null}

          {/* ── Booking History ── */}
          {history.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                History ({history.length})
              </h3>
              <ul className="space-y-2">
                {history.map((b) => {
                  const p = patientById(b.patientId);
                  return (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs"
                    >
                      <span className="font-medium">{p?.name ?? "Unknown patient"}</span>
                      <span className="text-muted-foreground">
                        {pretty(b.admissionDate)} →{" "}
                        {pretty(b.actualDischargeDate ?? b.expectedDischargeDate)} · discharged
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {/* ── Admin actions ── */}
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
                  if (!room.maintenance && activeAndUpcoming.length > 0) {
                    toast.error("Room has bookings — discharge or move patients first.");
                    return;
                  }
                  toggleMaintenance(room.id, "Marked for maintenance by admin");
                  toast.success(
                    room.maintenance
                      ? `Room ${room.number} returned to service.`
                      : `Room ${room.number} marked under maintenance.`
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

      {/* Edit reservation sub-dialog */}
      <EditReservationDialog
        booking={editBooking}
        open={!!editBooking}
        onOpenChange={(o) => !o && setEditBooking(null)}
      />

      {/* Add new booking sub-dialog — reuses AdmissionDialog */}
      <AdmissionDialog
        room={room}
        open={addBookingOpen}
        onOpenChange={setAddBookingOpen}
      />
    </>
  );
}
