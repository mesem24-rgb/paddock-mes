"use client";
import Link from "next/link";
import { useState } from "react";
import { useProjects } from "@/context/ProjectContext";
import {
  localDate,
  projectTasks,
  weekDates,
  shiftDate,
  conflictingTasks,
} from "@/lib/planning";
export default function PlannerPage() {
  const { projects, isLoaded, updateTask } = useProjects();
  const [date, setDate] = useState(localDate);
  const [view, setView] = useState<"Week" | "Day">("Week");
  const [capacity, setCapacity] = useState(6);
  if (!isLoaded) return <p>Loading planner…</p>;
  const open = projectTasks(projects).filter((t) => t.status !== "Completed");
  const days = weekDates(date);
  const conflicts = conflictingTasks(open);
  const scheduled = open
    .filter((t) => t.scheduledDate === date)
    .sort((a, b) =>
      (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""),
    );
  const hours = scheduled.reduce((n, t) => n + (t.estimatedHours ?? 0), 0);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-semibold">Weekly planner</h1>
      <p className="mt-2 text-[#71756e]">
        Reserve time for tasks. Leave room for client requests.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(["Week", "Day"] as const).map((v) => (
          <button
            key={v}
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`rounded-lg border px-4 py-2 ${view === v ? "bg-[#171918] text-white" : "bg-white"}`}
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => setDate(localDate())}
          className="rounded-lg border bg-white px-4 py-2"
        >
          Today
        </button>
        <button
          aria-label="Previous week"
          onClick={() => setDate(shiftDate(date, -7))}
          className="rounded-lg border bg-white px-4 py-2"
        >
          ← Previous week
        </button>
        <button
          aria-label="Next week"
          onClick={() => setDate(shiftDate(date, 7))}
          className="rounded-lg border bg-white px-4 py-2"
        >
          Next week →
        </button>
      </div>
      <div className="my-6 flex flex-wrap items-center gap-4">
        <label>
          Day{" "}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border bg-white p-3"
          />
        </label>
        <label>
          Available hours per day{" "}
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={capacity}
            onChange={(e) =>
              setCapacity(
                Math.min(24, Math.max(0, Number(e.target.value) || 0)),
              )
            }
            className="w-24 rounded-lg border bg-white p-3"
          />
        </label>
        <p
          className={
            hours > capacity ? "font-semibold text-red-700" : "font-semibold"
          }
        >
          {hours} / {capacity} hours planned
          {hours > capacity ? " — over capacity" : ""}
        </p>
      </div>
      {view === "Week" && (
        <section
          className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Weekly schedule"
        >
          {days.map((day) => {
            const tasks = open
              .filter((t) => t.scheduledDate === day)
              .sort((a, b) =>
                (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""),
              );
            const total = tasks.reduce(
              (n, t) => n + (t.estimatedHours ?? 0),
              0,
            );
            return (
              <article
                key={day}
                className={`rounded-xl border bg-white p-4 ${day === date ? "ring-2 ring-[#171918]" : ""}`}
              >
                <button
                  onClick={() => {
                    setDate(day);
                    setView("Day");
                  }}
                  className="font-semibold"
                >
                  {new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </button>
                <p
                  className={`mt-1 text-sm ${total > capacity ? "text-red-700" : "text-[#71756e]"}`}
                >
                  {total} / {capacity}h
                  {total > capacity ? " · Over capacity" : ""}
                </p>
                <div className="mt-3 space-y-3">
                  {tasks.map((t) => (
                    <div
                      key={`${t.projectId}-${t.id}`}
                      className="border-t pt-3"
                    >
                      <Link
                        href={`/projects/${t.projectId}`}
                        className="text-sm font-medium"
                      >
                        {t.title}
                      </Link>
                      <p className="text-xs text-[#71756e]">
                        {t.scheduledTime || "Any time"} ·{" "}
                        {t.estimatedHours ?? 0}h · {t.projectName}
                      </p>
                      {t.status === "Blocked" && (
                        <p className="text-xs text-amber-800">Blocked</p>
                      )}
                      {conflicts.has(`${t.projectId}:${t.id}`) && (
                        <p className="text-xs text-red-700">
                          Overlapping work blocks
                        </p>
                      )}
                    </div>
                  ))}
                  {!tasks.length && (
                    <p className="text-sm text-[#71756e]">Open time</p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
      {view === "Day" && (
        <section className="mb-6 rounded-2xl border bg-white p-5">
          <h2 className="mb-3 text-xl font-semibold">Scheduled for {date}</h2>
          {scheduled.map((t) => (
            <p key={`${t.projectId}-${t.id}`} className="border-t py-3">
              {t.scheduledTime || "Time not set"} · {t.title} ·{" "}
              {t.estimatedHours ?? 0}h
            </p>
          ))}
          {!scheduled.length && <p>No work scheduled yet.</p>}
        </section>
      )}
      <h2 className="mb-4 text-xl font-semibold">Schedule open tasks</h2>
      <div className="space-y-3">
        {open.map((t) => (
          <article
            key={`${t.projectId}-${t.id}`}
            className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4"
          >
            <div className="mr-auto">
              <h3 className="font-medium">{t.title}</h3>
              <p className="text-sm text-[#71756e]">
                {t.projectName}
                {t.status === "Blocked" ? " · Blocked" : ""}
              </p>
              {conflicts.has(`${t.projectId}:${t.id}`) && (
                <p className="text-sm text-red-700">
                  Overlapping work blocks — adjust the start time.
                </p>
              )}
              {t.scheduledDate && t.scheduledDate > t.dueDate && (
                <p className="text-sm text-amber-800">
                  Scheduled after its due date.
                </p>
              )}
            </div>
            <label className="text-sm">
              Day
              <input
                aria-label={`Scheduled day for ${t.title}`}
                type="date"
                value={t.scheduledDate ?? ""}
                onChange={(e) =>
                  updateTask(t.projectId, t.id, {
                    scheduledDate: e.target.value,
                  })
                }
                className="block rounded-lg border p-2"
              />
            </label>
            <label className="text-sm">
              Start
              <input
                aria-label={`Start time for ${t.title}`}
                type="time"
                value={t.scheduledTime ?? ""}
                onChange={(e) =>
                  updateTask(t.projectId, t.id, {
                    scheduledTime: e.target.value,
                  })
                }
                className="block rounded-lg border p-2"
              />
            </label>
            <label className="text-sm">
              Hours
              <input
                aria-label={`Estimated hours for ${t.title}`}
                type="number"
                min="0"
                max="24"
                step="0.25"
                value={t.estimatedHours ?? 0}
                onChange={(e) =>
                  updateTask(t.projectId, t.id, {
                    estimatedHours: Math.min(
                      24,
                      Math.max(0, Number(e.target.value) || 0),
                    ),
                  })
                }
                className="block w-24 rounded-lg border p-2"
              />
            </label>
          </article>
        ))}
      </div>
      {!open.length && <p>Add a task to begin planning your day.</p>}
    </div>
  );
}
