import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Booking, HospitalState, Patient, Role, Room } from "./types";
import { seedState } from "./seed";
import { daysUntil, rangesOverlap, todayISO } from "./dates";

const STORAGE_KEY = "unani-hms-state-v1";

export interface AdmissionInput {
  name: string;
  age: number;
  gender: Patient["gender"];
  phone: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  ailment?: string;
  roomId: string;
  admissionDate: string;
  expectedDischargeDate: string;
  notes?: string;
}

export type RoomComputedStatus = "available" | "occupied" | "reserved" | "maintenance";

interface HospitalContextValue extends HospitalState {
  role: Role;
  setRole: (role: Role) => void;
  hydrated: boolean;
  roomStatus: (roomId: string) => RoomComputedStatus;
  activeBooking: (roomId: string) => Booking | undefined;
  upcomingBooking: (roomId: string) => Booking | undefined;
  bookingsForRoom: (roomId: string) => Booking[];
  bookingsForPatient: (patientId: string) => Booking[];
  patientById: (id: string) => Patient | undefined;
  roomById: (id: string) => Room | undefined;
  isRoomFree: (roomId: string, start: string, end: string, ignoreBookingId?: string) => boolean;
  admitPatient: (input: AdmissionInput) => { ok: boolean; message: string };
  dischargePatient: (bookingId: string, actualDischargeDate: string) => void;
  toggleMaintenance: (roomId: string, note?: string) => void;
  resetData: () => void;
}

const HospitalContext = createContext<HospitalContextValue | null>(null);

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HospitalState>(() => seedState());
  const [role, setRole] = useState<Role>("receptionist");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HospitalState;
        if (parsed.rooms?.length) setState(parsed);
      }
      const storedRole = localStorage.getItem(`${STORAGE_KEY}-role`);
      if (storedRole === "admin" || storedRole === "receptionist") setRole(storedRole);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(`${STORAGE_KEY}-role`, role);
    } catch {
      /* storage full or unavailable */
    }
  }, [state, role, hydrated]);

  const value = useMemo<HospitalContextValue>(() => {
    const roomById = (id: string) => state.rooms.find((r) => r.id === id);
    const patientById = (id: string) => state.patients.find((p) => p.id === id);

    const bookingsForRoom = (roomId: string) =>
      state.bookings
        .filter((b) => b.roomId === roomId)
        .slice()
        .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));

    const bookingsForPatient = (patientId: string) =>
      state.bookings
        .filter((b) => b.patientId === patientId)
        .slice()
        .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));

    const activeBooking = (roomId: string) => {
      const t = todayISO();
      return state.bookings.find(
        (b) =>
          b.roomId === roomId &&
          b.status === "active" &&
          !b.actualDischargeDate &&
          b.admissionDate <= t,
      );
    };

    const upcomingBooking = (roomId: string) => {
      const t = todayISO();
      return bookingsForRoom(roomId)
        .filter((b) => b.status !== "discharged" && b.admissionDate > t)
        .sort((a, b) => a.admissionDate.localeCompare(b.admissionDate))[0];
    };

    const roomStatus = (roomId: string): RoomComputedStatus => {
      const room = roomById(roomId);
      if (room?.maintenance) return "maintenance";
      if (activeBooking(roomId)) return "occupied";
      if (upcomingBooking(roomId)) return "reserved";
      return "available";
    };

    const isRoomFree = (roomId: string, start: string, end: string, ignoreBookingId?: string) =>
      !state.bookings.some(
        (b) =>
          b.roomId === roomId &&
          b.id !== ignoreBookingId &&
          b.status !== "discharged" &&
          rangesOverlap(start, end, b.admissionDate, b.expectedDischargeDate),
      );

    const admitPatient: HospitalContextValue["admitPatient"] = (input) => {
      const room = roomById(input.roomId);
      if (!room) return { ok: false, message: "Room not found." };
      if (room.maintenance) return { ok: false, message: "Room is under maintenance." };
      if (input.expectedDischargeDate < input.admissionDate)
        return { ok: false, message: "Expected discharge must be after the admission date." };
      if (!isRoomFree(input.roomId, input.admissionDate, input.expectedDischargeDate))
        return {
          ok: false,
          message: `Room ${room.number} already has a booking overlapping those dates.`,
        };

      const patient: Patient = {
        id: nextId("pat"),
        name: input.name.trim(),
        age: input.age,
        gender: input.gender,
        phone: input.phone.trim(),
        address: input.address.trim(),
        guardianName: input.guardianName.trim(),
        guardianPhone: input.guardianPhone.trim(),
        ...(input.ailment?.trim() ? { ailment: input.ailment.trim() } : {}),
      };

      const booking: Booking = {
        id: nextId("bk"),
        roomId: input.roomId,
        patientId: patient.id,
        admissionDate: input.admissionDate,
        expectedDischargeDate: input.expectedDischargeDate,
        status: input.admissionDate > todayISO() ? "reserved" : "active",
        ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
      };

      setState((prev) => ({
        ...prev,
        patients: [...prev.patients, patient],
        bookings: [...prev.bookings, booking],
      }));

      return {
        ok: true,
        message:
          booking.status === "reserved"
            ? `Room ${room.number} reserved for ${patient.name}.`
            : `${patient.name} admitted to room ${room.number}.`,
      };
    };

    const dischargePatient: HospitalContextValue["dischargePatient"] = (bookingId, date) => {
      setState((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: "discharged", actualDischargeDate: date } : b,
        ),
      }));
    };

    const toggleMaintenance: HospitalContextValue["toggleMaintenance"] = (roomId, note) => {
      setState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                maintenance: !r.maintenance,
                ...(!r.maintenance && note ? { maintenanceNote: note } : {}),
              }
            : r,
        ),
      }));
    };

    return {
      ...state,
      role,
      setRole,
      hydrated,
      roomStatus,
      activeBooking,
      upcomingBooking,
      bookingsForRoom,
      bookingsForPatient,
      patientById,
      roomById,
      isRoomFree,
      admitPatient,
      dischargePatient,
      toggleMaintenance,
      resetData: () => setState(seedState()),
    };
  }, [state, role, hydrated]);

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used inside HospitalProvider");
  return ctx;
}

export function useStats() {
  const { rooms, bookings, roomStatus } = useHospital();
  return useMemo(() => {
    const counts = { available: 0, occupied: 0, reserved: 0, maintenance: 0 };
    for (const room of rooms) counts[roomStatus(room.id)] += 1;
    const t = todayISO();
    const admissionsToday = bookings.filter((b) => b.admissionDate === t).length;
    const dischargesToday = bookings.filter(
      (b) => b.status !== "discharged" && b.expectedDischargeDate === t,
    ).length;
    const overdue = bookings.filter(
      (b) => b.status === "active" && daysUntil(b.expectedDischargeDate) < 0,
    );
    const dueSoon = bookings.filter((b) => {
      if (b.status !== "active") return false;
      const d = daysUntil(b.expectedDischargeDate);
      return d >= 0 && d <= 2;
    });
    return {
      total: rooms.length,
      ...counts,
      admissionsToday,
      dischargesToday,
      overdue,
      dueSoon,
      occupancyRate: rooms.length ? Math.round((counts.occupied / rooms.length) * 100) : 0,
    };
  }, [rooms, bookings, roomStatus]);
}

export const statusLabel: Record<RoomComputedStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  maintenance: "Maintenance",
};
