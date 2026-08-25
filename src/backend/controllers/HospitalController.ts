import { createServerFn } from "@tanstack/react-start";
import { HospitalService } from "../services/HospitalService";
import { MongoHospitalRepository } from "../repositories/MongoHospitalRepository";
import type { Room, Patient, Booking } from "@/shared/types";

const hospitalRepository = new MongoHospitalRepository();
const hospitalService = new HospitalService(hospitalRepository);

export const getHospitalState = createServerFn({ method: "GET" }).handler(async () => {
  return await hospitalService.getState();
});

export const addRoomServer = createServerFn({ method: "POST" })
  .validator((room: Room) => room)
  .handler(async ({ data: room }) => {
    return await hospitalService.addRoom(room);
  });

export const removeRoomServer = createServerFn({ method: "POST" })
  .validator((roomId: string) => roomId)
  .handler(async ({ data: roomId }) => {
    return await hospitalService.removeRoom(roomId);
  });

export const admitPatientServer = createServerFn({ method: "POST" })
  .validator((data: { patient: Patient; booking: Booking }) => data)
  .handler(async ({ data }) => {
    return await hospitalService.admitPatient(data.patient, data.booking);
  });

export const dischargePatientServer = createServerFn({ method: "POST" })
  .validator((data: { bookingId: string; actualDischargeDate: string }) => data)
  .handler(async ({ data }) => {
    return await hospitalService.dischargePatient(data.bookingId, data.actualDischargeDate);
  });

export const toggleMaintenanceServer = createServerFn({ method: "POST" })
  .validator((data: { roomId: string; maintenance: boolean; note?: string }) => data)
  .handler(async ({ data }) => {
    return await hospitalService.toggleMaintenance(data.roomId, data.maintenance, data.note);
  });

export const updateReservationServer = createServerFn({ method: "POST" })
  .validator(
    (data: {
      bookingId: string;
      bookingPatch: Partial<Booking>;
      patientId: string;
      patientPatch: Partial<Patient>;
    }) => data
  )
  .handler(async ({ data }) => {
    return await hospitalService.updateReservation(
      data.bookingId,
      data.bookingPatch,
      data.patientId,
      data.patientPatch
    );
  });
