"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getSupabase, cloudConfigured } from "@/lib/supabase/client";
// Each collection is versioned. Concurrent edits on another device fail visibly
// rather than silently replacing that device's newer records.
export function useStoredCollection<T>(name: string, initial: T[]) {
  const { session } = useAuth();
  const [records, setRecords] = useState<T[]>(cloudConfigured ? [] : initial);
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const current = useRef(records);
  const revision = useRef(0);
  const queue = useRef(Promise.resolve());
  const failed = useRef(false);
  const active = useRef(true);
  const key = `paddock-${name}`;
  useEffect(() => {
    active.current = true;
    let cancelled = false;
    async function load() {
      try {
        const client = getSupabase();
        let loaded: T[] = initial;
        if (client) {
          if (!session) return;
          const result = await client
            .from("workspace_collections")
            .select("records,revision")
            .eq("user_id", session.user.id)
            .eq("name", name)
            .maybeSingle();
          if (result.error) throw result.error;
          loaded = (result.data?.records ?? []) as T[];
          revision.current = result.data?.revision ?? 0;
        } else {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed: unknown = JSON.parse(saved);
            if (!Array.isArray(parsed))
              throw new Error("Stored records are invalid.");
            loaded = parsed as T[];
          }
        }
        if (!cancelled) {
          current.current = loaded;
          setRecords(loaded);
          setLoaded(true);
        }
      } catch (cause) {
        if (!cancelled) {
          failed.current = true;
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load workspace records.",
          );
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
      active.current = false;
    };
    // initial is the fixed seed provided by each collection's module.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key, session?.user.id]);
  const update = useCallback(
    (action: SetStateAction<T[]>) => {
      if (!isLoaded || failed.current) return;
      const next =
        typeof action === "function"
          ? (action as (previous: T[]) => T[])(current.current)
          : action;
      current.current = next;
      setRecords(next);
      setPending((n) => n + 1);
      queue.current = queue.current
        .then(async () => {
          if (failed.current || !active.current) return;
          try {
            const client = getSupabase();
            if (client) {
              if (!session) throw new Error("Sign in before saving.");
              const result = await client.rpc("save_workspace_collection", {
                expected_user_id: session.user.id,
                collection_name: name,
                new_records: next,
                expected_revision: revision.current,
              });
              if (result.error) throw new Error(result.error.message);
              revision.current = Number(result.data);
            } else localStorage.setItem(key, JSON.stringify(next));
          } catch (cause) {
            failed.current = true;
            if (active.current)
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Unable to save. Keep this page open.",
              );
          }
        })
        .finally(() => {
          if (active.current) setPending((n) => n - 1);
        });
    },
    [isLoaded, key, name, session],
  );
  useEffect(() => {
    if (!pending && !error) return;
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [pending, error]);
  const importLocal = useCallback(() => {
    if (
      !cloudConfigured ||
      !isLoaded ||
      failed.current ||
      current.current.length
    )
      return;
    try {
      const saved = localStorage.getItem(key);
      if (!saved)
        throw new Error("No browser records found for this collection.");
      const parsed: unknown = JSON.parse(saved);
      if (
        !Array.isArray(parsed) ||
        !parsed.every((item) => item && typeof item.id === "string")
      )
        throw new Error("Browser records are invalid.");
      update(parsed as T[]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to import browser records.",
      );
    }
  }, [isLoaded, key, update]);
  const exportRecords = useCallback(() => {
    const blob = new Blob([JSON.stringify(current.current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paddock-${name}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [name]);
  return {
    records,
    setRecords: update,
    isLoaded,
    error,
    pending,
    exportRecords,
    importLocal,
  };
}
