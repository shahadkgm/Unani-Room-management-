export type RoomStatus = "available" | "occupied" | "reserved" | "maintenance";

export type RoomType = "General" | "Semi-Private" | "Private" | "Deluxe" | "ICU";

export type Role = "admin" | "receptionist";

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  floor: number;
  ward: string;
  beds: number;
  ratePerDay: number;
  maintenance?: boolean;
  maintenanceNote?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  ailment?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  patientId: string;
  admissionDate: string; // yyyy-MM-dd
  expectedDischargeDate: string; // yyyy-MM-dd
  actualDischargeDate?: string; // yyyy-MM-dd
  status: "active" | "reserved" | "discharged";
  notes?: string;
}

export interface HospitalState {
  rooms: Room[];
  patients: Patient[];
  bookings: Booking[];
}
