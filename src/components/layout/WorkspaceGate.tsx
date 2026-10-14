"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { cloudConfigured, getSupabase } from "@/lib/supabase/client";
function Gate({ children }: { children: ReactNode }) {
  const { session, loading, error } = useAuth();
  if (loading) return <p className="p-8">Checking sign-in…</p>;
  if (cloudConfigured && !session)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f0] p-6">
        <section className="rounded-2xl border bg-white p-8">
          <h1 className="text-2xl font-semibold">Sign in to Paddock</h1>
          {error && <p role="alert">{error}</p>}
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-[#171918] px-5 py-3 text-white"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  return (
    <div key={session?.user.id ?? "local"}>
      {cloudConfigured && (
        <div className="flex justify-end gap-4 border-b bg-white px-6 py-2 text-sm">
          <span>{session?.user.email}</span>
          <button
            onClick={async () => {
              const result = await getSupabase()!.auth.signOut();
              if (result.error) alert("Could not sign out. Please retry.");
            }}
          >
            Sign out
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
export default function WorkspaceGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
