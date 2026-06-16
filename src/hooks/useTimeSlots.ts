import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { localDemo } from "../lib/localDemo";
import { assertSupabaseConfigured, isLocalDemoEnabled, supabase } from "../lib/supabase";
import type { TimeSlot } from "../lib/types";

export function useTimeSlots(courtId?: string, weekday?: number) {
  return useQuery({
    queryKey: ["time_slots", courtId, weekday],
    enabled: Boolean(courtId),
    queryFn: async () => {
      if (isLocalDemoEnabled) return localDemo.listTimeSlots(courtId!, weekday);
      assertSupabaseConfigured();

      let query = supabase
        .from("time_slots")
        .select("*")
        .eq("court_id", courtId!)
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true });
      if (typeof weekday === "number") query = query.eq("weekday", weekday);
      const { data, error } = await query;
      if (error) throw error;
      return data as TimeSlot[];
    },
  });
}

export function useCreateTimeSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<TimeSlot, "id">) => {
      if (isLocalDemoEnabled) return localDemo.createTimeSlot(payload);
      assertSupabaseConfigured();

      const { data, error } = await supabase.from("time_slots").insert(payload).select("*").single();
      if (error) throw error;
      return data as TimeSlot;
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["time_slots", payload.court_id] });
    },
  });
}

export function useDeleteTimeSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; court_id: string }) => {
      if (isLocalDemoEnabled) return localDemo.deleteTimeSlot(payload.id);
      assertSupabaseConfigured();

      const { error } = await supabase.from("time_slots").delete().eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["time_slots", payload.court_id] });
    },
  });
}
