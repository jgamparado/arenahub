import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getDemoSession, onDemoAuthChange } from "../lib/localDemo";
import { isLocalDemoEnabled, supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLocalDemoEnabled) {
      setSession(getDemoSession());
      setLoading(false);
      return onDemoAuthChange(() => setSession(getDemoSession()));
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
