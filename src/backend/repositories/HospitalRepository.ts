import type { Db } from "mongodb";
import type { Room, Patient, Booking, User } from "@/shared/types";
import { seedState } from "@/backend/seed";

export class HospitalRepository {
  // Helper to seed data to MongoDB if database is empty
  static async seedMongoDBIfEmpty(db: Db) {
    const roomsCount = await db.collection("rooms").countDocuments();
    if (roomsCount === 0) {
      console.log("Seeding MongoDB with initial state...");
      const initial = seedState();
      if (initial.rooms.length > 0) {
        await db.collection("rooms").insertMany(initial.rooms);
      }
      if (initial.patients.length > 0) {
        await db.collection("patients").insertMany(initial.patients);
      }
      if (initial.bookings.length > 0) {
        await db.collection("bookings").insertMany(initial.bookings);
      }
      
      // // Seed default users
      // const defaultUsers: User[] = [
      //   { id: "usr-admin", username: "admin", email: "admin@unani.com", role: "admin", password: "admin" },
      //   { id: "usr-recep", username: "receptionist", email: "receptionist@unani.com", role: "receptionist", password: "unani123" }
      // ];
      // await db.collection("users").insertMany(defaultUsers);
      // console.log("MongoDB seeding complete.");
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

  static async updateBookingDischarge(db: Db, bookingId: string, actualDischargeDate: string) {
    await db.collection("bookings").updateOne(
      { id: bookingId },
      { $set: { status: "discharged", actualDischargeDate } }
    );
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
