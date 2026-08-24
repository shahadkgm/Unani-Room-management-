import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Pencil, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Separator } from "@/frontend/components/ui/separator";
import { useHospital } from "@/frontend/store/hospitalStore";
import { pretty } from "@/shared/dates";
import type { Booking, Patient } from "@/shared/types";

interface EditReservationDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditReservationDialog({ booking, open, onOpenChange }: EditReservationDialogProps) {
  const { patientById, roomById, isRoomFree, updateReservation } = useHospital();

  const patient = booking ? patientById(booking.patientId) : null;
  const room = booking ? roomById(booking.roomId) : null;

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Female" as Patient["gender"],
    phone: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
    ailment: "",
    admissionDate: "",
    expectedDischargeDate: "",
    notes: "",
  });

  // Populate form when dialog opens
  useEffect(() => {
    if (open && booking && patient) {
      setForm({
        name: patient.name,
        age: String(patient.age),
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        guardianName: patient.guardianName,
        guardianPhone: patient.guardianPhone,
        ailment: patient.ailment ?? "",
        admissionDate: booking.admissionDate,
        expectedDischargeDate: booking.expectedDischargeDate,
        notes: booking.notes ?? "",
      });
    }
  }, [open, booking, patient]);

  if (!booking || !patient || !room) return null;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const conflict =
    form.admissionDate && form.expectedDischargeDate
      ? !isRoomFree(booking.roomId, form.admissionDate, form.expectedDischargeDate, booking.id)
      : false;

  const dateOrderError =
    form.admissionDate && form.expectedDischargeDate
      ? form.expectedDischargeDate <= form.admissionDate
      : false;

  const canSubmit = !conflict && !dateOrderError && form.admissionDate && form.expectedDischargeDate;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const age = Number(form.age);
    if (!form.name.trim() || !age || age < 0) {
      toast.error("Enter a valid patient name and age.");
      return;
    }

    const patientPatch: Partial<Patient> = {
      name: form.name.trim(),
      age,
      gender: form.gender,
      phone: form.phone.trim(),
      address: form.address.trim(),
      guardianName: form.guardianName.trim(),
      guardianPhone: form.guardianPhone.trim(),
    };
    if (form.ailment.trim()) {
      patientPatch.ailment = form.ailment.trim();
    }

    const result = await updateReservation(
      booking.id,
      form.admissionDate,
      form.expectedDischargeDate,
      patientPatch,
      form.notes.trim() || undefined
    );

    if (result.ok) {
      toast.success(result.message);
      onOpenChange(false);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4 text-primary" />
            Edit Reservation — Room {room.number}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {room.type} · {room.ward} · ₹{room.ratePerDay.toLocaleString("en-IN")}/day
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Current dates summary */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5 shrink-0" />
          <span>
            Current: {pretty(booking.admissionDate)} → {pretty(booking.expectedDischargeDate)}
          </span>
          <span className="capitalize text-foreground/60">· {booking.status}</span>
        </div>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {/* Patient details section */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 pb-2">
              <User className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Patient Details
              </span>
            </div>
            <Separator />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-name">Patient name</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-age">Age</Label>
            <Input
              id="edit-age"
              type="number"
              min={0}
              max={120}
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => set("gender", v as Patient["gender"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone number</Label>
            <Input
              id="edit-phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 …"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-ailment">Condition / treatment</Label>
            <Input
              id="edit-ailment"
              value={form.ailment}
              onChange={(e) => set("ailment", e.target.value)}
              placeholder="e.g. Waja-ul-Mafasil therapy"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-address">Address</Label>
            <Textarea
              id="edit-address"
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-guardian">Guardian name</Label>
            <Input
              id="edit-guardian"
              value={form.guardianName}
              onChange={(e) => set("guardianName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-guardian-phone">Guardian phone</Label>
            <Input
              id="edit-guardian-phone"
              value={form.guardianPhone}
              onChange={(e) => set("guardianPhone", e.target.value)}
              required
            />
          </div>

          {/* Dates section */}
          <div className="sm:col-span-2 mt-2">
            <div className="flex items-center gap-2 pb-2">
              <CalendarClock className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Booking Dates
              </span>
            </div>
            <Separator />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-admission">Admission date</Label>
            <Input
              id="edit-admission"
              type="date"
              value={form.admissionDate}
              onChange={(e) => set("admissionDate", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-discharge">Expected discharge date</Label>
            <Input
              id="edit-discharge"
              type="date"
              value={form.expectedDischargeDate}
              onChange={(e) => set("expectedDischargeDate", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Diet plan, attending hakim, special instructions…"
            />
          </div>

          {/* Validation errors */}
          {dateOrderError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
              Discharge date must be after admission date.
            </p>
          ) : conflict ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
              Room {room.number} already has another booking during these dates. Choose different dates.
            </p>
          ) : null}

          <div className="flex justify-end gap-2 sm:col-span-2 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
