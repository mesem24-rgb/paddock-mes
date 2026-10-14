"use client";
import { useState } from "react";
import { useProjects } from "@/context/ProjectContext";
import { localDate, projectTasks } from "@/lib/planning";
export default function PlannerPage() {
  const { projects, isLoaded, updateTask } = useProjects();
  const [date, setDate] = useState(localDate);
  const [capacity, setCapacity] = useState(6);
  if (!isLoaded) return <p>Loading planner…</p>;
  const open = projectTasks(projects).filter((t) => t.status !== "Completed");
  const scheduled = open
    .filter((t) => t.scheduledDate === date)
    .sort((a, b) =>
      (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""),
    );
  const hours = scheduled.reduce((n, t) => n + (t.estimatedHours ?? 0), 0);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-semibold">Daily planner</h1>
      <p className="mt-2 text-[#71756e]">
        Reserve time for tasks. Leave room for client requests.
      </p>
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
          Available hours{" "}
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
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
                    estimatedHours: Number(e.target.value),
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
