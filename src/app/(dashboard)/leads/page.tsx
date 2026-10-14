"use client";
import { useState } from "react";
import Link from "next/link";
import { useClients } from "@/context/ClientContext";
import { localDate } from "@/lib/planning";
export default function FollowUpsPage() {
  const { clients, isLoaded, updateClient, completeFollowUp } = useClients();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  if (!isLoaded) return <p>Loading client follow-ups…</p>;
  const today = localDate();
  const active = clients.filter((c) => c.status !== "Archived");
  const due = active.filter((c) => c.followUpDate && c.followUpDate <= today);
  const visible = active
    .filter(
      (c) =>
        (filter === "All" ||
          (filter === "Due" && c.followUpDate && c.followUpDate <= today) ||
          (filter === "Leads" && c.status === "Lead") ||
          (filter === "Waiting" && c.waitingOn)) &&
        `${c.companyName} ${c.contactName} ${c.followUpAction ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      (a.followUpDate || "9999").localeCompare(b.followUpDate || "9999"),
    );
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Leads and follow-ups</h1>
          <p className="mt-2 text-[#71756e]">
            Track your next conversation and what you need from each client.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-xl bg-[#171918] px-4 py-3 text-white"
        >
          Add client or lead
        </Link>
      </div>
      <div className="my-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Due check-ins", due.length],
          ["Active leads", active.filter((c) => c.status === "Lead").length],
          ["Waiting on clients", active.filter((c) => c.waitingOn).length],
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <p className="text-sm text-[#71756e]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{count}</p>
          </div>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          aria-label="Search client follow-ups"
          placeholder="Search company, contact, or action"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border bg-white p-3"
        />
        <select
          aria-label="Follow-up filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border bg-white p-3"
        >
          {["All", "Due", "Leads", "Waiting"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-red-700">
          {error}
        </p>
      )}
      <div className="space-y-4">
        {visible.map((c) => (
          <article key={c.id} className="rounded-2xl border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link
                  href={`/clients/${c.id}`}
                  className="text-lg font-semibold"
                >
                  {c.companyName}
                </Link>
                <p className="text-sm text-[#71756e]">
                  {c.contactName} · {c.status}
                </p>
                {c.followUpDate && (
                  <p
                    className={`mt-2 text-sm ${c.followUpDate < today ? "text-red-700" : ""}`}
                  >
                    {c.followUpDate < today
                      ? "Overdue"
                      : c.followUpDate === today
                        ? "Due today"
                        : "Next check-in"}
                    : {c.followUpDate}
                  </p>
                )}
              </div>
              {c.followUpDate && (
                <button
                  onClick={() => completeFollowUp(c.id)}
                  className="rounded-lg border px-3 py-2"
                >
                  Mark follow-up complete
                </button>
              )}
            </div>
            <form
              key={`${c.id}-${c.updatedAt}`}
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                const followUpDate = String(d.get("date"));
                const followUpAction = String(d.get("action")).trim();
                if (Boolean(followUpDate) !== Boolean(followUpAction)) {
                  setError(
                    "Enter both a next action and check-in date, or clear both.",
                  );
                  return;
                }
                updateClient(c.id, {
                  followUpDate,
                  followUpAction,
                  waitingOn: String(d.get("waiting")).trim(),
                });
                setError("");
              }}
            >
              <label className="text-sm">
                Next action
                <input
                  name="action"
                  defaultValue={c.followUpAction ?? ""}
                  placeholder="Check on project photos"
                  className="mt-1 block w-full rounded-lg border p-3"
                />
              </label>
              <label className="text-sm">
                Check-in date
                <input
                  name="date"
                  type="date"
                  defaultValue={c.followUpDate ?? ""}
                  className="mt-1 block w-full rounded-lg border p-3"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Waiting on (optional)
                <input
                  name="waiting"
                  defaultValue={c.waitingOn ?? ""}
                  placeholder="Homepage approval, content, or access"
                  className="mt-1 block w-full rounded-lg border p-3"
                />
              </label>
              <button className="rounded-lg bg-[#171918] px-4 py-3 text-white sm:col-span-2">
                Save follow-up
              </button>
            </form>
            <p className="mt-3 text-xs text-[#71756e]">
              Completing a follow-up adds a note to the client record. Reminders
              appear in Paddock; no message is sent.
            </p>
          </article>
        ))}
      </div>
      {!visible.length && (
        <p className="py-8 text-[#71756e]">No clients match this view.</p>
      )}
    </div>
  );
}
