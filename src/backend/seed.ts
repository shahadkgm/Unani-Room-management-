import type { Booking, HospitalState, Patient, Room, RoomType } from "@/shared/types";

const wardConfig: Array<{
  floor: number;
  ward: string;
  type: RoomType;
  beds: number;
  prefix: string;
  count: number;
}> = [
  { floor: 1, ward: "Ibn Sina Ward", type: "General", beds: 2, prefix: "1", count: 8 },
  { floor: 2, ward: "Al-Razi Ward", type: "Semi-Private", beds: 2, prefix: "2", count: 6 },
  { floor: 3, ward: "Hikmat Wing", type: "Private", beds: 1, prefix: "3", count: 6 },
  { floor: 4, ward: "Tibb Suites", type: "Deluxe", beds: 1, prefix: "4", count: 4 },
  { floor: 5, ward: "Critical Care", type: "ICU", beds: 1, prefix: "5", count: 4 },
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
    } satisfies Room;
  }),
);

export const seedPatients: Patient[] = [];
export const seedBookings: Booking[] = [];

export function seedState(): HospitalState {
  return {
    rooms: seedRooms.map((r) => ({ ...r })),
    patients: [],
    bookings: [],
  };
}
