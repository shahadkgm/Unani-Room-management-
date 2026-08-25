import type { Room, Patient, Booking } from "@/shared/types";
import { connectToDatabase } from "@/backend/db";
import type { IHospitalRepository } from "./IHospitalRepository";

export class MongoHospitalRepository implements IHospitalRepository {
  private async getDb() {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) throw new Error("Database offline");
    return db;
  }

  private sanitize<T>(arr: any[]): T[] {
    return arr.map(({ _id, ...rest }) => rest as T);
  }



  async getRooms(): Promise<Room[]> {
    const db = await this.getDb();
    const rooms = await db.collection("rooms").find({}).toArray();
    return this.sanitize<Room>(rooms);
  }

  async getPatients(): Promise<Patient[]> {
    const db = await this.getDb();
    const patients = await db.collection("patients").find({}).toArray();
    return this.sanitize<Patient>(patients);
  }

  async getBookings(): Promise<Booking[]> {
    const db = await this.getDb();
    const bookings = await db.collection("bookings").find({}).toArray();
    return this.sanitize<Booking>(bookings);
  }

  async insertRoom(room: Room): Promise<void> {
    const db = await this.getDb();
    await db.collection("rooms").insertOne(room as any);
  }

  async deleteRoom(roomId: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("rooms").deleteOne({ id: roomId });
  }

  async deleteBookingsByRoom(roomId: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("bookings").deleteMany({ roomId });
  }

  async insertPatient(patient: Patient): Promise<void> {
    const db = await this.getDb();
    await db.collection("patients").insertOne(patient as any);
  }

  async insertBooking(booking: Booking): Promise<void> {
    const db = await this.getDb();
    await db.collection("bookings").insertOne(booking as any);
  }

  async updateBookingDischarge(bookingId: string, _actualDischargeDate?: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("bookings").deleteOne({ id: bookingId });
  }

  async updateRoomMaintenance(roomId: string, maintenance: boolean, note?: string): Promise<void> {
    const db = await this.getDb();
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

  async updateBooking(bookingId: string, patch: Partial<Booking>): Promise<void> {
    const db = await this.getDb();
    await db.collection("bookings").updateOne({ id: bookingId }, { $set: patch });
  }

  async updatePatient(patientId: string, patch: Partial<Patient>): Promise<void> {
    const db = await this.getDb();
    await db.collection("patients").updateOne({ id: patientId }, { $set: patch });
  }
}
