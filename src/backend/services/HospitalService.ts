import type { Room, Patient, Booking } from "@/shared/types";
import { pruneState } from "@/frontend/store/hospitalStore";
import type { IHospitalRepository } from "../repositories/IHospitalRepository";

export class HospitalService {
  constructor(private repo: IHospitalRepository) {}

  async getState() {
    try {
      const rooms = await this.repo.getRooms();
      const patients = await this.repo.getPatients();
      const bookings = await this.repo.getBookings();

      const rawState = {
        rooms,
        patients,
        bookings,
      };

      return {
        ok: true,
        state: pruneState(rawState, 10),
      };
    } catch (err) {
      console.error("Failed to fetch state from Database:", err);
      return { ok: false, error: (err as Error).message, state: null };
    }
  }

  async addRoom(room: Room) {
    try {
      await this.repo.insertRoom(room);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async removeRoom(roomId: string) {
    try {
      await this.repo.deleteRoom(roomId);
      await this.repo.deleteBookingsByRoom(roomId);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async admitPatient(patient: Patient, booking: Booking) {
    try {
      await this.repo.insertPatient(patient);
      await this.repo.insertBooking(booking);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async dischargePatient(bookingId: string, actualDischargeDate: string) {
    try {
      await this.repo.updateBookingDischarge(bookingId, actualDischargeDate);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async toggleMaintenance(roomId: string, maintenance: boolean, note?: string) {
    try {
      await this.repo.updateRoomMaintenance(roomId, maintenance, note);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  async updateReservation(
    bookingId: string,
    bookingPatch: Partial<Booking>,
    patientId: string,
    patientPatch: Partial<Patient>
  ) {
    try {
      await this.repo.updateBooking(bookingId, bookingPatch);
      await this.repo.updatePatient(patientId, patientPatch);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}
