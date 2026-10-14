"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabase, cloudConfigured } from "@/lib/supabase/client";
export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f0] px-4">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8">
        <p className="text-sm uppercase tracking-widest">Paddock</p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        {!cloudConfigured ? (
          <>
            <p className="my-5">
              Cloud storage is not connected yet. You can continue using this
              browser.
            </p>
            <Link href="/dashboard">Open workspace →</Link>
          </>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const d = new FormData(e.currentTarget);
              try {
                const result = await getSupabase()!.auth.signInWithPassword({
                  email: String(d.get("email")),
                  password: String(d.get("password")),
                });
                if (result.error) setError(result.error.message);
                else window.location.assign("/dashboard");
              } catch {
                setError(
                  "Unable to sign in. Check your connection and try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="block">
              Email
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                className="mt-1 block w-full rounded-lg border p-3"
              />
            </label>
            <label className="block">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full rounded-lg border p-3"
              />
            </label>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="w-full rounded-xl bg-[#171918] p-3 text-white disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-sm text-[#71756e]">
              Use the account created for your Paddock workspace.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
