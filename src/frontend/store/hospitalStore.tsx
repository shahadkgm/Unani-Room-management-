import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Booking, HospitalState, Patient, Role, Room, User } from "@/shared/types";
import { seedState } from "@/backend/seed";
import { daysUntil, rangesOverlap, todayISO } from "@/shared/dates";
import {
  getHospitalState,
  admitPatientServer,
  dischargePatientServer,
  toggleMaintenanceServer,
  addRoomServer,
  removeRoomServer,
  getUsersServer,
  registerUserServer,
  authenticateUserServer,
  updateReservationServer,
} from "@/frontend/api";

const STORAGE_KEY = "unani-hms-state-v1";
const USERS_STORAGE_KEY = "unani-hms-users-v1";
const CURRENT_USER_KEY = "unani-hms-current-user-v1";

export function pruneState(state: HospitalState, maxPatients = 10): HospitalState {
  const validBookings = (state.bookings || []).filter((b) => b.status !== "discharged");
  const activePatientIds = new Set(validBookings.map((b) => b.patientId));

  const activePatients: Patient[] = [];
  const unadmittedPatients: Patient[] = [];

  for (const p of state.patients || []) {
    if (activePatientIds.has(p.id)) {
      activePatients.push(p);
    } else {
      unadmittedPatients.push(p);
    }
  }

  const allowedUnadmitted = Math.max(0, maxPatients - activePatients.length);
  const keptUnadmitted = unadmittedPatients.slice(-allowedUnadmitted);

  return {
    ...state,
    patients: [...activePatients, ...keptUnadmitted],
    bookings: validBookings,
  };
}

export interface AdmissionInput {
  name: string;
  age: number;
  gender: Patient["gender"];
  address: string;
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
  currentUser: User | null;
  users: User[];
  hydrated: boolean;
  dbConnected: boolean;
  login: (usernameOrEmail: string, password?: string) => Promise<{ ok: boolean; message: string }>;
  registerUser: (username: string, email: string, role: Role, password?: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  roomStatus: (roomId: string) => RoomComputedStatus;
  activeBooking: (roomId: string) => Booking | undefined;
  upcomingBooking: (roomId: string) => Booking | undefined;
  bookingsForRoom: (roomId: string) => Booking[];
  bookingsForPatient: (patientId: string) => Booking[];
  patientById: (id: string) => Patient | undefined;
  roomById: (id: string) => Room | undefined;
  isRoomFree: (roomId: string, start: string, end: string, ignoreBookingId?: string) => boolean;
  admitPatient: (input: AdmissionInput) => Promise<{ ok: boolean; message: string }>;
  dischargePatient: (bookingId: string, actualDischargeDate: string) => Promise<void>;
  updateReservation: (
    bookingId: string,
    newAdmissionDate: string,
    newDischargeDate: string,
    patientPatch: Partial<Patient>,
    notes?: string
  ) => Promise<{ ok: boolean; message: string }>;
  toggleMaintenance: (roomId: string, note?: string) => Promise<void>;
  addRoom: (roomInput: Omit<Room, "id">) => Promise<{ ok: boolean; message: string }>;
  removeRoom: (roomId: string) => Promise<{ ok: boolean; message: string }>;
  resetData: () => void;
}

const HospitalContext = createContext<HospitalContextValue | null>(null);

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// Seed default users for local storage fallback
const seedUsers: User[] = [
  { id: "usr-admin", username: "admin", email: "admin@unani.com", role: "admin", password: "admin" },
  { id: "usr-recep", username: "receptionist", email: "receptionist@unani.com", role: "receptionist", password: "receptionist" }
];

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HospitalState>(() => seedState());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [role, setRoleState] = useState<Role>("receptionist");
  const [hydrated, setHydrated] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  // Hydrate state from database or localStorage fallback
  useEffect(() => {
    async function loadInitialData() {
      // 1. Load active session
      try {
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setCurrentUser(parsedUser);
          setRoleState(parsedUser.role);
        }
      } catch (e) {
        console.error("Failed to parse current user session", e);
      }

      // 2. Load data from MongoDB
      try {
        const response = await getHospitalState();
        if (response.ok && response.state) {
          setState(pruneState(response.state, 10));
          setDbConnected(true);
          
          const usersResponse = await getUsersServer();
          if (usersResponse.ok && usersResponse.users) {
            setUsers(usersResponse.users);
          }
          setHydrated(true);
          return;
        }
      } catch (err) {
        console.warn("Server call failed, falling back to local storage:", err);
      }

      // 3. Fallback to LocalStorage
      try {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (rawState) {
          const parsedState = JSON.parse(rawState) as HospitalState;
          if (parsedState.rooms?.length) {
            setState(pruneState(parsedState, 10));
          }
        }

        const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (rawUsers) {
          const parsedUsers = JSON.parse(rawUsers) as User[];
          if (parsedUsers.length) setUsers(parsedUsers);
        }
      } catch (err) {
        console.error("Corrupted local storage state:", err);
      }
      setHydrated(true);
    }
    loadInitialData();
  }, []);

  // Save changes to localStorage as a safety/fallback mechanism
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch {
      /* storage full or unavailable */
    }
  }, [state, users, currentUser, hydrated]);

  // Auth Operations
  const login = async (usernameOrEmail: string, password?: string) => {
    // 1. Try server auth
    try {
      const response = await authenticateUserServer({ data: { usernameOrEmail, ...(password ? { password } : {}) } });
      if (response.ok && response.user) {
        setCurrentUser(response.user);
        setRoleState(response.user.role);
        setDbConnected(true);
        return { ok: true, message: `Welcome back, ${response.user.username}!` };
      } else if (response.error && response.error !== "Database offline") {
        return { ok: false, message: response.error };
      }
    } catch (err) {
      console.warn("Server login call failed, trying local verification:", err);
    }

    // 2. Fallback local auth
    const matched = users.find(
      (u) =>
        (u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
          u.email.toLowerCase() === usernameOrEmail.toLowerCase()) &&
        u.password === password
    );

    if (matched) {
      const { password: _, ...safeUser } = matched;
      setCurrentUser(safeUser as User);
      setRoleState(safeUser.role);
      return { ok: true, message: `Welcome back, ${safeUser.username}! (Offline Mode)` };
    }

    return { ok: false, message: "Invalid username/email or password." };
  };

  const registerUser = async (username: string, email: string, role: Role, password?: string) => {
    const newUser: User = {
      id: nextId("usr"),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role,
      ...(password ? { password } : {}),
    };

    // 1. Try server registration
    try {
      const response = await registerUserServer({ data: newUser });
      if (response.ok) {
        const { password: _, ...safeUser } = newUser;
        setUsers((prev) => [...prev, safeUser as User]);
        setDbConnected(true);
        return { ok: true, message: "Registration successful!" };
      } else if (response.error && response.error !== "Database offline") {
        return { ok: false, message: response.error };
      }
    } catch (err) {
      console.warn("Server registration failed, trying local fallback:", err);
    }

    // 2. Local fallback registration
    const existing = users.some(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() ||
        u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (existing) {
      return { ok: false, message: "Username or Email already registered locally." };
    }

    setUsers((prev) => [...prev, newUser]);
    return { ok: true, message: "Registration successful! (Offline Mode)" };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  // Add Room
  const addRoom = async (roomInput: Omit<Room, "id">) => {
    const newRoom: Room = {
      ...roomInput,
      id: nextId("rm"),
    };

    // Check duplicate room number
    if (state.rooms.some((r) => r.number === newRoom.number)) {
      return { ok: false, message: `Room ${newRoom.number} already exists.` };
    }

    // 1. Try Server
    try {
      const res = await addRoomServer({ data: newRoom });
      if (res.ok) {
        setDbConnected(true);
      }
    } catch (err) {
      console.warn("Server addRoom failed, running local fallback:", err);
    }

    // 2. Update local state
    setState((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
    }));

    return { ok: true, message: `Room ${newRoom.number} added successfully.` };
  };

  // Remove Room
  const removeRoom = async (roomId: string) => {
    const room = state.rooms.find((r) => r.id === roomId);
    if (!room) return { ok: false, message: "Room not found." };

    // Room deletion will cascade to bookings on the server.

    // 1. Try Server
    try {
      const res = await removeRoomServer({ data: roomId });
      if (res.ok) {
        setDbConnected(true);
      }
    } catch (err) {
      console.warn("Server removeRoom failed, running local fallback:", err);
    }

    // 2. Update local state
    setState((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== roomId),
      bookings: prev.bookings.filter((b) => b.roomId !== roomId),
    }));

    return { ok: true, message: `Room ${room.number} removed successfully.` };
  };

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
          (b.status !== "discharged"
            ? rangesOverlap(start, end, b.admissionDate, b.expectedDischargeDate)
            : rangesOverlap(
                start,
                end,
                b.admissionDate,
                b.actualDischargeDate || b.expectedDischargeDate,
              )),
      );

    const admitPatient = async (input: AdmissionInput) => {
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
        address: input.address.trim(),
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

      // 1. Try Server
      try {
        const res = await admitPatientServer({ data: { patient, booking } });
        if (res.ok) setDbConnected(true);
      } catch (err) {
        console.warn("Server admit failed, running local fallback:", err);
      }

      // 2. Update local state
      setState((prev) =>
        pruneState(
          {
            ...prev,
            patients: [...prev.patients, patient],
            bookings: [...prev.bookings, booking],
          },
          10,
        ),
      );

      return {
        ok: true,
        message:
          booking.status === "reserved"
            ? `Room ${room.number} reserved for ${patient.name}.`
            : `${patient.name} admitted to room ${room.number}.`,
      };
    };

    const dischargePatient = async (bookingId: string, date: string) => {
      // 1. Try Server
      try {
        const res = await dischargePatientServer({ data: { bookingId, actualDischargeDate: date } });
        if (res.ok) setDbConnected(true);
      } catch (err) {
        console.warn("Server discharge failed, running local fallback:", err);
      }

      // 2. Update local state - remove discharged booking and prune patients
      setState((prev) =>
        pruneState(
          {
            ...prev,
            bookings: prev.bookings.filter((b) => b.id !== bookingId),
          },
          10,
        ),
      );
    };

    const updateReservation = async (
      bookingId: string,
      newAdmissionDate: string,
      newDischargeDate: string,
      patientPatch: Partial<Patient>,
      notes?: string
    ): Promise<{ ok: boolean; message: string }> => {
      const booking = state.bookings.find((b) => b.id === bookingId);
      if (!booking) return { ok: false, message: "Booking not found." };

      if (newDischargeDate <= newAdmissionDate)
        return { ok: false, message: "Discharge date must be after admission date." };

      if (!isRoomFree(booking.roomId, newAdmissionDate, newDischargeDate, bookingId))
        return { ok: false, message: "These dates overlap with another booking for this room." };

      const room = roomById(booking.roomId);
      const newStatus: Booking["status"] =
        booking.status === "discharged"
          ? "discharged"
          : newAdmissionDate > todayISO()
          ? "reserved"
          : "active";

      const bookingPatch: Partial<Booking> = {
        admissionDate: newAdmissionDate,
        expectedDischargeDate: newDischargeDate,
        status: newStatus,
        ...(notes !== undefined ? { notes } : {}),
      };

      // 1. Try Server
      try {
        const res = await updateReservationServer({
          data: { bookingId, bookingPatch, patientId: booking.patientId, patientPatch },
        });
        if (res.ok) setDbConnected(true);
      } catch (err) {
        console.warn("Server updateReservation failed, running local fallback:", err);
      }

      // 2. Update local state
      setState((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === bookingId ? { ...b, ...bookingPatch } : b
        ),
        patients: prev.patients.map((p) =>
          p.id === booking.patientId ? { ...p, ...patientPatch } : p
        ),
      }));

      return {
        ok: true,
        message: `Reservation updated${room ? ` for Room ${room.number}` : ""}.`,
      };
    };

    const toggleMaintenance = async (roomId: string, note?: string) => {
      const room = roomById(roomId);
      if (!room) return;
      const nextMaintenance = !room.maintenance;

      // 1. Try Server
      try {
        const res = await toggleMaintenanceServer({ data: {
          roomId,
          maintenance: nextMaintenance,
          note: note || "Marked by operator",
        } });
        if (res.ok) setDbConnected(true);
      } catch (err) {
        console.warn("Server toggleMaintenance failed, running local fallback:", err);
      }

      // 2. Update local state
      setState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                maintenance: nextMaintenance,
                ...(nextMaintenance && note ? { maintenanceNote: note } : { maintenanceNote: "" }),
              }
            : r,
        ),
      }));
    };

    return {
      ...state,
      role,
      setRole,
      currentUser,
      users,
      hydrated,
      dbConnected,
      login,
      registerUser,
      logout,
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
      updateReservation,
      toggleMaintenance,
      addRoom,
      removeRoom,
      resetData: () => {
        // Seeding database not handled directly locally for safety, resets local state
        setState(seedState());
      },
    };
  }, [state, role, currentUser, users, hydrated, dbConnected]);

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
