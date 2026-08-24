import type { Db } from "mongodb";
import type { Room, Patient, Booking, User } from "@/shared/types";
import { seedState } from "@/backend/seed";

export class HospitalRepository {
  // Helper to seed rooms to MongoDB if database is empty
  static async seedMongoDBIfEmpty(db: Db) {
    const roomsCount = await db.collection("rooms").countDocuments();
    if (roomsCount === 0) {
      console.log("Seeding MongoDB with initial rooms...");
      const initial = seedState();
      if (initial.rooms.length > 0) {
        await db.collection("rooms").insertMany(initial.rooms);
      }
    }
  }

  static async getRooms(db: Db) {
    return await db.collection("rooms").find({}).toArray();
  }

  static async getPatients(db: Db) {
    return await db.collection("patients").find({}).toArray();
  }

  static async getBookings(db: Db) {
    return await db.collection("bookings").find({}).toArray();
  }

  static async insertRoom(db: Db, room: Room) {
    await db.collection("rooms").insertOne(room);
  }

  static async deleteRoom(db: Db, roomId: string) {
    await db.collection("rooms").deleteOne({ id: roomId });
  }

  static async deleteBookingsByRoom(db: Db, roomId: string) {
    await db.collection("bookings").deleteMany({ roomId });
  }

  static async insertPatient(db: Db, patient: Patient) {
    await db.collection("patients").insertOne(patient);
  }

  static async insertBooking(db: Db, booking: Booking) {
    await db.collection("bookings").insertOne(booking);
  }

  static async updateBookingDischarge(db: Db, bookingId: string, _actualDischargeDate?: string) {
    await db.collection("bookings").deleteOne({ id: bookingId });
  }

  static async updateRoomMaintenance(db: Db, roomId: string, maintenance: boolean, note?: string) {
    await db.collection("rooms").updateOne(
      { id: roomId },
      {
        $set: {
          maintenance,
          ...(maintenance && note ? { maintenanceNote: note } : { maintenanceNote: "" })
        }
      }
    );
  }

  static async updateBooking(db: Db, bookingId: string, patch: Partial<Booking>) {
    await db.collection("bookings").updateOne({ id: bookingId }, { $set: patch });
  }

  static async updatePatient(db: Db, patientId: string, patch: Partial<Patient>) {
    await db.collection("patients").updateOne({ id: patientId }, { $set: patch });
  }
}
