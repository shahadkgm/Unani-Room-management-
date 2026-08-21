import { connectToDatabase } from "@/backend/db";
import { HospitalRepository } from "../repositories/HospitalRepository";
import type { Room, Patient, Booking } from "@/shared/types";

export class HospitalService {
  static async getState() {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) return { ok: false, error: "Database offline", state: null };

    try {
      await HospitalRepository.seedMongoDBIfEmpty(db);
      const rooms = await HospitalRepository.getRooms(db);
      const patients = await HospitalRepository.getPatients(db);
      const bookings = await HospitalRepository.getBookings(db);

      const sanitize = (arr: any[]) => arr.map(({ _id, ...rest }) => rest);

      return {
        ok: true,
        state: {
          rooms: sanitize(rooms) as Room[],
          patients: sanitize(patients) as Patient[],
          bookings: sanitize(bookings) as Booking[],
        },
      };
    } catch (err) {
      console.error("Failed to fetch state from MongoDB:", err);
      return { ok: false, error: (err as Error).message, state: null };
    }
  }

  static async addRoom(room: Room) {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) return { ok: false, error: "Database offline" };
    try {
      await HospitalRepository.insertRoom(db, room);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  static async removeRoom(roomId: string) {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) return { ok: false, error: "Database offline" };
    try {
      await HospitalRepository.deleteRoom(db, roomId);
      await HospitalRepository.deleteBookingsByRoom(db, roomId);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  static async admitPatient(patient: Patient, booking: Booking) {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) return { ok: false, error: "Database offline" };
    try {
      await HospitalRepository.insertPatient(db, patient);
      await HospitalRepository.insertBooking(db, booking);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  static async dischargePatient(bookingId: string, actualDischargeDate: string) {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) return { ok: false, error: "Database offline" };
    try {
      await HospitalRepository.updateBookingDischarge(db, bookingId, actualDischargeDate);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  static async toggleMaintenance(roomId: string, maintenance: boolean, note?: string) {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) return { ok: false, error: "Database offline" };
    try {
      await HospitalRepository.updateRoomMaintenance(db, roomId, maintenance, note);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}
