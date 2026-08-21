import { createServerFn } from "@tanstack/react-start";
import { HospitalService } from "../services/HospitalService";
import type { Room, Patient, Booking } from "@/shared/types";

export const getHospitalState = createServerFn({ method: "GET" }).handler(async () => {
  return await HospitalService.getState();
});

export const addRoomServer = createServerFn({ method: "POST" })
  .validator((room: Room) => room)
  .handler(async ({ data: room }) => {
    return await HospitalService.addRoom(room);
  });

export const removeRoomServer = createServerFn({ method: "POST" })
  .validator((roomId: string) => roomId)
  .handler(async ({ data: roomId }) => {
    return await HospitalService.removeRoom(roomId);
  });

export const admitPatientServer = createServerFn({ method: "POST" })
  .validator((data: { patient: Patient; booking: Booking }) => data)
  .handler(async ({ data }) => {
    return await HospitalService.admitPatient(data.patient, data.booking);
  });

export const dischargePatientServer = createServerFn({ method: "POST" })
  .validator((data: { bookingId: string; actualDischargeDate: string }) => data)
  .handler(async ({ data }) => {
    return await HospitalService.dischargePatient(data.bookingId, data.actualDischargeDate);
  });

export const toggleMaintenanceServer = createServerFn({ method: "POST" })
  .validator((data: { roomId: string; maintenance: boolean; note?: string }) => data)
  .handler(async ({ data }) => {
    return await HospitalService.toggleMaintenance(data.roomId, data.maintenance, data.note);
  });
