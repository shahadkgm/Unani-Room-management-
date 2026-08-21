import type { Booking, HospitalState, Patient, Room, RoomType } from "@/shared/types";
import { shift } from "@/shared/dates";

const wardConfig: Array<{
  floor: number;
  ward: string;
  type: RoomType;
  beds: number;
  rate: number;
  prefix: string;
  count: number;
}> = [
  { floor: 1, ward: "Ibn Sina Ward", type: "General", beds: 4, rate: 900, prefix: "1", count: 8 },
  {
    floor: 2,
    ward: "Al-Razi Ward",
    type: "Semi-Private",
    beds: 2,
    rate: 1800,
    prefix: "2",
    count: 6,
  },
  { floor: 3, ward: "Hikmat Wing", type: "Private", beds: 1, rate: 3200, prefix: "3", count: 6 },
  { floor: 4, ward: "Tibb Suites", type: "Deluxe", beds: 1, rate: 5400, prefix: "4", count: 4 },
  { floor: 5, ward: "Critical Care", type: "ICU", beds: 1, rate: 7800, prefix: "5", count: 4 },
];

export const seedRooms: Room[] = wardConfig.flatMap((cfg) =>
  Array.from({ length: cfg.count }, (_, i) => {
    const number = `${cfg.prefix}${String(i + 1).padStart(2, "0")}`;
    return {
      id: `room-${number}`,
      number,
      type: cfg.type,
      floor: cfg.floor,
      ward: cfg.ward,
      beds: cfg.beds,
      ratePerDay: cfg.rate,
    } satisfies Room;
  }),
);

const maintenanceRooms: Record<string, string> = {
  "room-104": "Air-conditioning overhaul",
  "room-305": "Deep sanitisation after ICU transfer",
};

for (const room of seedRooms) {
  const note = maintenanceRooms[room.id];
  if (note) {
    room.maintenance = true;
    room.maintenanceNote = note;
  }
}

export const seedPatients: Patient[] = [
  {
    id: "pat-1",
    name: "Ayesha Siddiqui",
    age: 34,
    gender: "Female",
    phone: "+91 98110 24501",
    address: "22 Nizam Colony, Hyderabad",
    guardianName: "Imran Siddiqui",
    guardianPhone: "+91 98110 24502",
    ailment: "Post-Ilaj bil Ghiza recovery",
  },
  {
    id: "pat-2",
    name: "Mohammed Faizan",
    age: 58,
    gender: "Male",
    phone: "+91 90032 77810",
    address: "Plot 8, Charminar Road, Hyderabad",
    guardianName: "Sana Faizan",
    guardianPhone: "+91 90032 77811",
    ailment: "Chronic Nazla-Zukam management",
  },
  {
    id: "pat-3",
    name: "Rukhsana Begum",
    age: 71,
    gender: "Female",
    phone: "+91 87654 11009",
    address: "Lane 4, Malakpet, Hyderabad",
    guardianName: "Zoya Begum",
    guardianPhone: "+91 87654 11010",
    ailment: "Waja-ul-Mafasil (joint pain) therapy",
  },
  {
    id: "pat-4",
    name: "Imtiaz Ahmed",
    age: 45,
    gender: "Male",
    phone: "+91 99887 65432",
    address: "Flat 12B, Banjara Hills, Hyderabad",
    guardianName: "Nadia Ahmed",
    guardianPhone: "+91 99887 65433",
    ailment: "Hijama and detox programme",
  },
  {
    id: "pat-5",
    name: "Sameera Khatoon",
    age: 27,
    gender: "Female",
    phone: "+91 91234 55678",
    address: "House 45, Tolichowki, Hyderabad",
    guardianName: "Abdul Khatoon",
    guardianPhone: "+91 91234 55679",
    ailment: "Antenatal Unani care",
  },
  {
    id: "pat-6",
    name: "Yusuf Ali",
    age: 63,
    gender: "Male",
    phone: "+91 93456 22110",
    address: "6 Mehdipatnam Main Road, Hyderabad",
    guardianName: "Hina Ali",
    guardianPhone: "+91 93456 22111",
    ailment: "Zeequn-Nafas observation",
  },
  {
    id: "pat-7",
    name: "Fatima Noor",
    age: 39,
    gender: "Female",
    phone: "+91 90909 44556",
    address: "18 Santosh Nagar, Hyderabad",
    guardianName: "Kareem Noor",
    guardianPhone: "+91 90909 44557",
    ailment: "Regimenal therapy follow-up",
  },
];

export const seedBookings: Booking[] = [
  {
    id: "bk-1",
    roomId: "room-101",
    patientId: "pat-1",
    admissionDate: shift(-24),
    expectedDischargeDate: shift(4),
    status: "active",
    notes: "Daily Unani diet chart, morning rounds at 8:30.",
  },
  {
    id: "bk-2",
    roomId: "room-203",
    patientId: "pat-2",
    admissionDate: shift(-31),
    expectedDischargeDate: shift(-2),
    status: "active",
    notes: "Discharge summary pending physician sign-off.",
  },
  {
    id: "bk-3",
    roomId: "room-302",
    patientId: "pat-3",
    admissionDate: shift(-9),
    expectedDischargeDate: shift(19),
    status: "active",
  },
  {
    id: "bk-4",
    roomId: "room-401",
    patientId: "pat-4",
    admissionDate: shift(0),
    expectedDischargeDate: shift(28),
    status: "active",
    notes: "Admitted this morning by reception desk 2.",
  },
  {
    id: "bk-5",
    roomId: "room-501",
    patientId: "pat-6",
    admissionDate: shift(-3),
    expectedDischargeDate: shift(1),
    status: "active",
    notes: "ICU monitoring, oxygen support.",
  },
  {
    id: "bk-6",
    roomId: "room-205",
    patientId: "pat-5",
    admissionDate: shift(6),
    expectedDischargeDate: shift(34),
    status: "reserved",
    notes: "Advance reservation confirmed over phone.",
  },
  {
    id: "bk-7",
    roomId: "room-303",
    patientId: "pat-7",
    admissionDate: shift(3),
    expectedDischargeDate: shift(30),
    status: "reserved",
  },
  {
    id: "bk-8",
    roomId: "room-102",
    patientId: "pat-3",
    admissionDate: shift(-88),
    expectedDischargeDate: shift(-60),
    actualDischargeDate: shift(-59),
    status: "discharged",
    notes: "Previous admission — completed course of therapy.",
  },
  {
    id: "bk-9",
    roomId: "room-302",
    patientId: "pat-1",
    admissionDate: shift(-140),
    expectedDischargeDate: shift(-112),
    actualDischargeDate: shift(-114),
    status: "discharged",
  },
  {
    id: "bk-10",
    roomId: "room-201",
    patientId: "pat-7",
    admissionDate: shift(-52),
    expectedDischargeDate: shift(-24),
    actualDischargeDate: shift(-24),
    status: "discharged",
  },
];

export function seedState(): HospitalState {
  return {
    rooms: seedRooms.map((r) => ({ ...r })),
    patients: seedPatients.map((p) => ({ ...p })),
    bookings: seedBookings.map((b) => ({ ...b })),
  };
}
