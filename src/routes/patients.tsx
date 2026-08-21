import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { AppShell } from "@/frontend/components/AppShell";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { Separator } from "@/frontend/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { useHospital } from "@/frontend/store/hospitalStore";
import { daysUntil, pretty, todayISO } from "@/shared/dates";
import type { Patient } from "@/shared/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients")({
  head: () => ({
    meta: [
      { title: "Patients — Unani Hospital Room Management" },
      {
        name: "description",
        content:
          "Search Unani Hospital patients, review admission history, check current room allocation and record discharges.",
      },
      { property: "og:title", content: "Unani Hospital Patient Records" },
      {
        property: "og:description",
        content: "Patient search, admission history and discharge processing.",
      },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const { patients, bookings, roomById, bookingsForPatient, dischargePatient } = useHospital();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [dischargeDate, setDischargeDate] = useState(todayISO());
  const t = todayISO();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.guardianName.toLowerCase().includes(q),
      )
      .map((p) => {
        const current = bookings.find(
          (b) => b.patientId === p.id && b.status !== "discharged" && b.admissionDate <= t,
        );
        const reserved = bookings.find(
          (b) => b.patientId === p.id && b.status === "reserved" && b.admissionDate > t,
        );
        return { patient: p, current, reserved };
      });
  }, [patients, bookings, query, t]);

  const history = selected ? bookingsForPatient(selected.id) : [];
  const activeBooking = history.find((b) => b.status !== "discharged");

  return (
    <AppShell
      title="Patients"
      subtitle={`${patients.length} patient records · ${rows.filter((r) => r.current).length} currently admitted`}
    >
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient, phone or guardian"
            className="pl-9"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Current room</TableHead>
                <TableHead>Stay</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No patients match “{query}”.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ patient, current, reserved }) => {
                  const booking = current ?? reserved;
                  const room = booking ? roomById(booking.roomId) : undefined;
                  const remaining = booking ? daysUntil(booking.expectedDischargeDate) : null;
                  return (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient.age} yrs · {patient.gender}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p>{patient.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient.guardianName} (guardian)
                        </p>
                      </TableCell>
                      <TableCell>
                        {room ? (
                          <div className="space-y-1">
                            <p className="font-display font-semibold">{room.number}</p>
                            <StatusBadge status={current ? "occupied" : "reserved"} />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not admitted</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {booking ? (
                          <>
                            <p>
                              {pretty(booking.admissionDate)} →{" "}
                              {pretty(booking.expectedDischargeDate)}
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                remaining !== null && remaining < 0
                                  ? "font-semibold text-destructive"
                                  : "text-muted-foreground",
                              )}
                            >
                              {remaining === null
                                ? ""
                                : remaining < 0
                                  ? `Overdue by ${Math.abs(remaining)} day(s)`
                                  : `${remaining} day(s) remaining`}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelected(patient);
                            setDischargeDate(todayISO());
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Age / Gender</dt>
                  <dd className="font-medium">
                    {selected.age} yrs · {selected.gender}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{selected.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Guardian</dt>
                  <dd className="font-medium">
                    {selected.guardianName} · {selected.guardianPhone}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Condition</dt>
                  <dd className="font-medium">{selected.ailment ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Address</dt>
                  <dd className="font-medium">{selected.address}</dd>
                </div>
              </dl>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Admission history</h3>
                <ul className="space-y-2">
                  {history.map((b) => {
                    const room = roomById(b.roomId);
                    return (
                      <li
                        key={b.id}
                        className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">Room {room?.number}</span>
                          <span className="text-xs capitalize text-muted-foreground">
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {pretty(b.admissionDate)} → {pretty(b.expectedDischargeDate)}
                          {b.actualDischargeDate
                            ? ` · discharged ${pretty(b.actualDischargeDate)}`
                            : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {activeBooking ? (
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">Discharge patient</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Input
                      type="date"
                      value={dischargeDate}
                      onChange={(e) => setDischargeDate(e.target.value)}
                      className="max-w-48"
                    />
                    <Button
                      onClick={() => {
                        dischargePatient(activeBooking.id, dischargeDate);
                        toast.success(`${selected.name} discharged. Room released.`);
                        setSelected(null);
                      }}
                    >
                      Confirm discharge
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
