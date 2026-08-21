import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { useHospital } from "@/frontend/store/hospitalStore";
import { pretty, shift, todayISO } from "@/shared/dates";
import type { Patient, Room } from "@/shared/types";

const emptyForm = {
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
};

export function AdmissionDialog({
  room,
  open,
  onOpenChange,
}: {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { admitPatient, isRoomFree, currentUser, removeRoom } = useHospital();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open)
      setForm({ ...emptyForm, admissionDate: todayISO(), expectedDischargeDate: shift(28) });
  }, [open]);

  if (!room) return null;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const conflict =
    form.admissionDate && form.expectedDischargeDate
      ? !isRoomFree(room.id, form.admissionDate, form.expectedDischargeDate)
      : false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const age = Number(form.age);
    if (!form.name.trim() || !age || age < 0) {
      toast.error("Enter a valid patient name and age.");
      return;
    }
    const result = await admitPatient({
      name: form.name,
      age,
      gender: form.gender,
      phone: form.phone,
      address: form.address,
      guardianName: form.guardianName,
      guardianPhone: form.guardianPhone,
      ailment: form.ailment,
      roomId: room.id,
      admissionDate: form.admissionDate,
      expectedDischargeDate: form.expectedDischargeDate,
      notes: form.notes,
    });
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
          <DialogTitle>
            Admit patient — Room {room.number}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {room.type} · {room.ward} · ₹{room.ratePerDay.toLocaleString("en-IN")}/day
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Patient name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
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
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 …"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ailment">Condition / treatment</Label>
            <Input
              id="ailment"
              value={form.ailment}
              onChange={(e) => set("ailment", e.target.value)}
              placeholder="e.g. Waja-ul-Mafasil therapy"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardian">Guardian name</Label>
            <Input
              id="guardian"
              value={form.guardianName}
              onChange={(e) => set("guardianName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Guardian phone</Label>
            <Input
              id="guardianPhone"
              value={form.guardianPhone}
              onChange={(e) => set("guardianPhone", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admission">Admission date</Label>
            <Input
              id="admission"
              type="date"
              value={form.admissionDate}
              onChange={(e) => set("admissionDate", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discharge">Expected discharge date</Label>
            <Input
              id="discharge"
              type="date"
              value={form.expectedDischargeDate}
              onChange={(e) => set("expectedDischargeDate", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Standard stay is about one month (defaults to {pretty(shift(28))}).
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Diet plan, attending hakim, special instructions…"
            />
          </div>

          {conflict ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
              Room {room.number} is already booked during these dates. Pick different dates or
              another room.
            </p>
          ) : null}

          <div className="flex justify-between items-center gap-2 sm:col-span-2 mt-2">
            {currentUser?.role === "admin" ? (
              <Button 
                type="button" 
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
                Delete Room
              </Button>
            ) : <div></div>}
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={conflict}>
                Confirm admission
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
