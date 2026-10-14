"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { cloudConfigured, getSupabase } from "@/lib/supabase/client";
const Context = createContext<{
  session: Session | null;
  loading: boolean;
  error: string;
}>({ session: null, loading: cloudConfigured, error: "" });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(cloudConfigured);
  const [error, setError] = useState("");
  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    let active = true;
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next);
        setLoading(false);
      }
    });
    client.auth
      .getSession()
      .then((result) => {
        if (active) {
          setSession(result.data.session);
          setError(result.error?.message ?? "");
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to verify sign-in. Refresh to retry.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <Context.Provider value={{ session, loading, error }}>
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  return useContext(Context);
}
