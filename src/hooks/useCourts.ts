import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { localDemo } from "../lib/localDemo";
import { assertSupabaseConfigured, isLocalDemoEnabled, supabase } from "../lib/supabase";
import type { Court, SportType } from "../lib/types";

export function useCourts(activeOnly = false) {
  return useQuery({
    queryKey: ["courts", activeOnly],
    queryFn: async () => {
      if (isLocalDemoEnabled) return localDemo.listCourts(activeOnly);
      assertSupabaseConfigured();

      let query = supabase.from("courts").select("*").order("created_at", { ascending: true });
      if (activeOnly) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data as Court[];
    },
  });
}

export function useCreateCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; sport_type: SportType }) => {
      if (isLocalDemoEnabled) return localDemo.createCourt(payload);
      assertSupabaseConfigured();

      const { data, error } = await supabase.from("courts").insert(payload).select("*").single();
      if (error) throw error;
      return data as Court;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courts"] }),
  });
}

export function useUpdateCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Pick<Court, "id"> & Partial<Pick<Court, "name" | "sport_type" | "active">>) => {
      if (isLocalDemoEnabled) return localDemo.updateCourt(payload);
      assertSupabaseConfigured();

      const { id, ...updates } = payload;
      const { data, error } = await supabase.from("courts").update(updates).eq("id", id).select("*").single();
      if (error) throw error;
      return data as Court;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courts"] }),
  });
}
