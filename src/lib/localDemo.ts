import type { Court, Reservation, ReservationStatus, SportType, TimeSlot } from "./types";

const DATA_KEY = "arenahub.demo.data";
const SESSION_KEY = "arenahub.demo.session";

type DemoData = {
  courts: Court[];
  timeSlots: TimeSlot[];
  reservations: Reservation[];
};

export const demoAdminEmail = "joaoamparado0605@gmail.com";
export const demoAdminPassword = "Sunset123";

const defaultSlotTimes = [
  ["07:00", "08:00"],
  ["08:00", "09:00"],
  ["09:00", "10:00"],
  ["10:00", "11:00"],
  ["14:00", "15:00"],
  ["15:00", "16:00"],
  ["16:00", "17:00"],
  ["17:00", "18:00"],
  ["18:00", "19:00"],
  ["19:00", "20:00"],
  ["20:00", "21:00"],
];

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function withSeconds(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}

function seedData(): DemoData {
  const courts: Court[] = [
    { id: id(), name: "Quadra 1", sport_type: "beach_tennis", active: true, created_at: now() },
    { id: id(), name: "Quadra 2", sport_type: "futevolei", active: true, created_at: now() },
    { id: id(), name: "Quadra 3", sport_type: "volei_praia", active: true, created_at: now() },
  ];

  const timeSlots: TimeSlot[] = courts.flatMap((court) =>
    Array.from({ length: 7 }, (_day, weekday) =>
      defaultSlotTimes.map(([start_time, end_time]) => ({
        id: id(),
        court_id: court.id,
        weekday,
        start_time: withSeconds(start_time),
        end_time: withSeconds(end_time),
        price: 50,
      })),
    ).flat(),
  );

  return { courts, timeSlots, reservations: [] };
}

function readData(): DemoData {
  const saved = localStorage.getItem(DATA_KEY);
  if (saved) return JSON.parse(saved) as DemoData;
  const seeded = seedData();
  writeData(seeded);
  return seeded;
}

function writeData(data: DemoData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function delay<T>(value: T) {
  return new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(value), 120);
  });
}

export function getDemoSession() {
  return localStorage.getItem(SESSION_KEY)
    ? ({ user: { email: demoAdminEmail }, access_token: "demo" } as never)
    : null;
}

export function onDemoAuthChange(callback: () => void) {
  window.addEventListener("arenahub-demo-auth", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("arenahub-demo-auth", callback);
    window.removeEventListener("storage", callback);
  };
}

export async function demoSignIn(email: string, password: string) {
  const acceptedEmails = [demoAdminEmail, "sunsetsports@admin.com", "admin@arenuhub.com", "admin@arenahub.com"];
  if (!acceptedEmails.includes(email.trim().toLowerCase()) || password !== demoAdminPassword) {
    throw new Error("E-mail ou senha inválidos.");
  }
  localStorage.setItem(SESSION_KEY, "true");
  window.dispatchEvent(new Event("arenahub-demo-auth"));
}

export async function demoSignOut() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("arenahub-demo-auth"));
}

export const localDemo = {
  async listCourts(activeOnly = false) {
    const data = readData();
    return delay(data.courts.filter((court) => (activeOnly ? court.active : true)));
  },

  async createCourt(payload: { name: string; sport_type: SportType }) {
    const data = readData();
    const court: Court = { id: id(), active: true, created_at: now(), ...payload };
    data.courts.push(court);
    writeData(data);
    return delay(court);
  },

  async updateCourt(payload: Pick<Court, "id"> & Partial<Pick<Court, "name" | "sport_type" | "active">>) {
    const data = readData();
    const index = data.courts.findIndex((court) => court.id === payload.id);
    if (index < 0) throw new Error("Quadra não encontrada.");
    data.courts[index] = { ...data.courts[index], ...payload };
    writeData(data);
    return delay(data.courts[index]);
  },

  async listTimeSlots(courtId: string, weekday?: number) {
    const data = readData();
    const slots = data.timeSlots
      .filter((slot) => slot.court_id === courtId && (typeof weekday === "number" ? slot.weekday === weekday : true))
      .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
    return delay(slots);
  },

  async createTimeSlot(payload: Omit<TimeSlot, "id">) {
    const data = readData();
    const slot: TimeSlot = {
      ...payload,
      id: id(),
      start_time: withSeconds(payload.start_time),
      end_time: withSeconds(payload.end_time),
    };
    data.timeSlots.push(slot);
    writeData(data);
    return delay(slot);
  },

  async deleteTimeSlot(slotId: string) {
    const data = readData();
    data.timeSlots = data.timeSlots.filter((slot) => slot.id !== slotId);
    writeData(data);
    return delay(undefined);
  },

  async reservationsForDay(courtId: string, date: string) {
    const data = readData();
    return delay(
      data.reservations
        .filter((reservation) => reservation.court_id === courtId && reservation.date === date && reservation.status === "confirmed")
        .map(({ id, slot_id, status }) => ({ id, slot_id, status })),
    );
  },

  async todayReservations(date: string) {
    const data = readData();
    return delay(enrichReservations(data, data.reservations.filter((reservation) => reservation.date === date && reservation.status === "confirmed")));
  },

  async allReservations(filters: { courtId?: string; date?: string; status?: ReservationStatus | "all"; page: number }) {
    const data = readData();
    const filtered = data.reservations
      .filter((reservation) => (filters.courtId ? reservation.court_id === filters.courtId : true))
      .filter((reservation) => (filters.date ? reservation.date === filters.date : true))
      .filter((reservation) => (filters.status && filters.status !== "all" ? reservation.status === filters.status : true))
      .sort((a, b) => b.date.localeCompare(a.date));
    const from = (filters.page - 1) * 20;
    return delay({ data: enrichReservations(data, filtered.slice(from, from + 20)), count: filtered.length });
  },

  async createReservation(payload: {
    court_id: string;
    slot_id: string;
    date: string;
    client_name: string;
    client_phone: string;
  }) {
    const data = readData();
    const duplicate = data.reservations.some(
      (reservation) =>
        reservation.court_id === payload.court_id &&
        reservation.slot_id === payload.slot_id &&
        reservation.date === payload.date &&
        reservation.status === "confirmed",
    );
    if (duplicate) throw new Error("Esse horário acabou de ser reservado.");

    const reservation: Reservation = {
      ...payload,
      id: id(),
      status: "confirmed",
      created_at: now(),
    };
    data.reservations.push(reservation);
    writeData(data);
    return delay(enrichReservations(data, [reservation])[0]);
  },

  async cancelReservation(reservationId: string) {
    const data = readData();
    const index = data.reservations.findIndex((reservation) => reservation.id === reservationId);
    if (index < 0) throw new Error("Reserva não encontrada.");
    data.reservations[index] = { ...data.reservations[index], status: "cancelled" };
    writeData(data);
    return delay(data.reservations[index]);
  },
};

function enrichReservations(data: DemoData, reservations: Reservation[]) {
  return reservations.map((reservation) => ({
    ...reservation,
    courts: data.courts.find((court) => court.id === reservation.court_id) ?? null,
    time_slots: data.timeSlots.find((slot) => slot.id === reservation.slot_id) ?? null,
  }));
}
