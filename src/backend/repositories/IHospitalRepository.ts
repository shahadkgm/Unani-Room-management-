import type { Room, Patient, Booking } from "@/shared/types";

export interface IHospitalRepository {
  getRooms(): Promise<Room[]>;
  getPatients(): Promise<Patient[]>;
  getBookings(): Promise<Booking[]>;
  insertRoom(room: Room): Promise<void>;
  deleteRoom(roomId: string): Promise<void>;
  deleteBookingsByRoom(roomId: string): Promise<void>;
  insertPatient(patient: Patient): Promise<void>;
  insertBooking(booking: Booking): Promise<void>;
  updateBookingDischarge(bookingId: string, actualDischargeDate?: string): Promise<void>;
  updateRoomMaintenance(roomId: string, maintenance: boolean, note?: string): Promise<void>;
  updateBooking(bookingId: string, patch: Partial<Booking>): Promise<void>;
  updatePatient(patientId: string, patch: Partial<Patient>): Promise<void>;
}
