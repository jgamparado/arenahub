import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { localDemo } from "../lib/localDemo";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { toDateKey } from "../lib/format";
import type { Reservation, ReservationStatus } from "../lib/types";

type CreateReservationPayload = {
  court_id: string;
  slot_id: string;
  date: string;
  client_name: string;
  client_phone: string;
};

export function useReservationsForDay(courtId?: string, date?: string) {
  return useQuery({
    queryKey: ["reservations", "day", courtId, date],
    enabled: Boolean(courtId && date),
    queryFn: async () => {
      if (!isSupabaseConfigured) return localDemo.reservationsForDay(courtId!, date!);

      const { data, error } = await supabase
        .from("reservations")
        .select("id, slot_id, status")
        .eq("court_id", courtId!)
        .eq("date", date!)
        .eq("status", "confirmed");
      if (error) throw error;
      return data as Pick<Reservation, "id" | "slot_id" | "status">[];
    },
  });
}

export function useTodayReservations() {
  const today = toDateKey(new Date());
  return useQuery({
    queryKey: ["reservations", "today", today],
    queryFn: async () => {
      if (!isSupabaseConfigured) return localDemo.todayReservations(today);

      const { data, error } = await supabase
        .from("reservations")
        .select("*, courts(name, sport_type), time_slots(start_time, end_time, price)")
        .eq("date", today)
        .eq("status", "confirmed")
        .order("start_time", { referencedTable: "time_slots", ascending: true });
      if (error) throw error;
      return data as Reservation[];
    },
  });
}

export function useAllReservations(filters: {
  courtId?: string;
  date?: string;
  status?: ReservationStatus | "all";
  page: number;
}) {
  return useQuery({
    queryKey: ["reservations", "all", filters],
    queryFn: async () => {
      if (!isSupabaseConfigured) return localDemo.allReservations(filters);

      const from = (filters.page - 1) * 20;
      const to = from + 19;
      let query = supabase
        .from("reservations")
        .select("*, courts(name, sport_type), time_slots(start_time, end_time, price)", { count: "exact" })
        .order("date", { ascending: false })
        .range(from, to);

      if (filters.courtId) query = query.eq("court_id", filters.courtId);
      if (filters.date) query = query.eq("date", filters.date);
      if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as Reservation[], count: count ?? 0 };
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateReservationPayload) => {
      if (!isSupabaseConfigured) return localDemo.createReservation(payload);

      const { data, error } = await supabase
        .from("reservations")
        .insert({ ...payload, status: "confirmed" })
        .select("*, courts(name, sport_type), time_slots(start_time, end_time, price)")
        .single();
      if (error) throw error;
      return data as Reservation;
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["reservations", "day", payload.court_id, payload.date] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      if (!isSupabaseConfigured) return localDemo.cancelReservation(reservationId);

      const { data, error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId)
        .select("*")
        .single();
      if (error) throw error;
      return data as Reservation;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
