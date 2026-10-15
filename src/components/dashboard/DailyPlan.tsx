"use client";
import { useState } from "react";
import Link from "next/link";
import { useProjects } from "@/context/ProjectContext";
import { useClients } from "@/context/ClientContext";
import { useInvoices } from "@/context/InvoiceContext";
import { dailyPlan } from "@/lib/dailyPlan";
import { localDate } from "@/lib/planning";
import QuickTask from "@/components/dashboard/QuickTask";

export default function DailyPlan({ day, capacity }: { day: string; capacity?: number }) {
  const { projects, isLoaded, updateTask } = useProjects();
  const { clients, isLoaded: clientsLoaded, completeFollowUp } = useClients();
  const { invoices, isLoaded: invoicesLoaded } = useInvoices();
  const [availableHours, setAvailableHours] = useState(6);
  if (!isLoaded || !clientsLoaded || !invoicesLoaded) return <p>Loading day plan…</p>;
  const plan = dailyPlan(projects, clients, invoices, day);
  const limit = capacity ?? availableHours;
  return <section className="mt-6 rounded-2xl border border-[#dedfd9] bg-white p-5" aria-labelledby="day-plan-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="day-plan-title" className="text-xl font-semibold">{day === localDate() ? "Today’s plan" : `Day plan · ${day}`}</h2>
      <Link href="/time" className="text-sm font-medium underline">Plan work time</Link>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-[#f5f5f0] p-4">
      <p className={plan.hours > limit ? "font-semibold text-red-700" : "font-semibold"}>{plan.hours} / {limit} work hours planned{plan.hours > limit ? " · Over capacity" : ` · ${Math.round((limit - plan.hours) * 100) / 100}h unreserved`}</p>
      {capacity === undefined && <label className="text-sm">Available work hours <input aria-label="Today's available work hours" type="number" min="0" max="24" step="0.5" value={availableHours} onChange={event => setAvailableHours(Math.min(24, Math.max(0, Number(event.target.value) || 0)))} className="ml-2 w-20 rounded-lg border bg-white p-2" /></label>}
      <p className="w-full text-xs text-[#71756e]">{plan.actions.length} other actions need review. Leave room for calls, follow-ups, and billing.{plan.unestimated > 0 ? ` ${plan.unestimated} scheduled tasks still need time estimates.` : ""} Capacity is for this view.</p>
    </div>
    <QuickTask key={day} day={day} plannedHours={plan.hours} capacity={limit} />
    <div className="mt-5 grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="font-semibold">Scheduled work · {plan.scheduled.length}</h3>
        <ul className="mt-3 space-y-3">
          {plan.scheduled.map(task => <li key={`${task.projectId}:${task.id}`} className="rounded-xl border p-4">
            <p className="text-xs font-semibold text-[#71756e]">{task.scheduledTime || "Time not set"} · {task.estimatedHours ? `${task.estimatedHours}h` : "Estimate needed"}</p>
            <Link href={`/projects/${task.projectId}`} className="mt-1 block font-medium underline">{task.title}</Link>
            <p className="mt-1 text-sm text-[#71756e]">{task.projectName}</p>
            {task.status === "Blocked" && <p className="mt-1 text-sm text-amber-800">Blocked</p>}
            {task.dueDate < day && <p className="mt-1 text-sm text-red-700">Task overdue · {task.dueDate}</p>}
            {plan.conflicts.has(`${task.projectId}:${task.id}`) && <p className="mt-1 text-sm text-red-700">Overlapping work blocks — adjust in planner</p>}
            <button className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={() => updateTask(task.projectId, task.id, { status: "Completed" })}>Mark task complete</button>
          </li>)}
        </ul>
        {!plan.scheduled.length && <p className="mt-3 text-sm text-[#71756e]">No work reserved. Choose tasks in the planner.</p>}
      </div>
      <div>
        <h3 className="font-semibold">Follow-ups, billing &amp; deadlines · {plan.actions.length}</h3>
        <ul className="mt-3 space-y-3">
          {plan.actions.map(item => <li key={item.id} className="rounded-xl border p-4">
            <p className="text-xs font-semibold text-[#71756e]">{item.kind} · {item.date}</p>
            <Link href={item.href} className="mt-1 block font-medium underline">{item.title}</Link>
            <p className="mt-1 text-sm text-[#71756e]">{item.detail}</p>
            {item.id.startsWith("client:") && <button className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={() => completeFollowUp(item.id.slice(7))}>Mark follow-up done</button>}
            {item.id.startsWith("invoice:") && <Link href="/invoices" className="mt-3 inline-block text-sm underline">Review invoice</Link>}
          </li>)}
        </ul>
        {!plan.actions.length && <p className="mt-3 text-sm text-[#71756e]">No follow-ups, invoice actions, or deadlines due.</p>}
      </div>
    </div>
  </section>;
}
