export type SportType = "beach_tennis" | "futevolei" | "volei_praia";
export type ReservationStatus = "confirmed" | "cancelled";

export type Court = {
  id: string;
  name: string;
  sport_type: SportType;
  active: boolean;
  created_at: string;
};

export type TimeSlot = {
  id: string;
  court_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  price: number;
};

export type Reservation = {
  id: string;
  court_id: string;
  slot_id: string;
  date: string;
  client_name: string;
  client_phone: string;
  status: ReservationStatus;
  created_at: string;
  courts?: Pick<Court, "name" | "sport_type"> | null;
  time_slots?: Pick<TimeSlot, "start_time" | "end_time" | "price"> | null;
};

export const sportLabels: Record<SportType, string> = {
  beach_tennis: "Beach tennis",
  futevolei: "Futevôlei",
  volei_praia: "Vôlei de praia",
};

export const weekdays = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
