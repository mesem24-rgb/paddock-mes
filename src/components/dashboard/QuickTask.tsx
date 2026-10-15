"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useProjects } from "@/context/ProjectContext";
import { conflictingTasks, projectTasks } from "@/lib/planning";

const control = "mt-1 block w-full rounded-lg border bg-white p-3";

export default function QuickTask({ day, plannedHours, capacity }: { day: string; plannedHours: number; capacity: number }) {
  const { projects, addTask } = useProjects();
  const activeProjects = projects.filter(project => project.status !== "Completed");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(day);
  const [time, setTime] = useState("");
  const [hours, setHours] = useState("1");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);
  const estimate = Number(hours);
  const hasDraft = Boolean(projectId && title.trim());
  const conflicts = hasDraft && time && estimate > 0 ? conflictingTasks([
    ...projectTasks(projects),
    { id: "quick-task-preview", projectId, projectName: "", title, status: "To Do", priority: "Medium", dueDate, assignee: "Michael", scheduledDate: day, scheduledTime: time, estimatedHours: estimate },
  ]).has(`${projectId}:quick-task-preview`) : false;

  return <details className="mt-5 rounded-xl border border-[#d6d8cf] bg-[#fafaf7] p-4">
    <summary className="cursor-pointer font-medium">+ Add a task to this day</summary>
    {!activeProjects.length ? <p className="mt-3 text-sm">Create an active project first. <Link href="/projects/new" className="underline">New project</Link></p> : <form
      aria-label="Quick task"
      className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={event => {
        event.preventDefault();
        const parsed = new Date(`${dueDate}T12:00:00Z`);
        if (!activeProjects.some(project => project.id === projectId) || !title.trim()) {
          setError("Choose an active project and enter a task title."); return;
        }
        if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dueDate || !hours.trim() || !Number.isFinite(estimate) || estimate < 0 || estimate > 24 || (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
          setError("Enter a valid due date, start time, and an estimate between 0 and 24 hours."); return;
        }
        addTask(projectId, { title: title.trim(), status: "To Do", priority: "Medium", dueDate, assignee: "Michael", scheduledDate: day, scheduledTime: time || undefined, estimatedHours: estimate });
        setTitle(""); setTime(""); setHours("1"); setError("");
        setNotice(`Task added to ${day}. Wait for workspace saving to finish.`);
        titleInput.current?.focus();
      }}
    >
      <label className="text-sm">Project
        <select aria-label="Quick task project" value={projectId} onChange={event => { setProjectId(event.target.value); setNotice(""); }} required className={control}>
          <option value="">Choose project</option>
          {activeProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
      </label>
      <label className="text-sm sm:col-span-2">Task
        <input aria-label="Quick task title" ref={titleInput} value={title} onChange={event => { setTitle(event.target.value); setNotice(""); }} required maxLength={200} placeholder="What needs to get done?" className={control} />
      </label>
      <label className="text-sm">Due date
        <input aria-label="Quick task due date" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} required className={control} />
      </label>
      <label className="text-sm">Start time (optional)
        <input aria-label="Quick task start time" type="time" value={time} onChange={event => setTime(event.target.value)} className={control} />
      </label>
      <label className="text-sm">Estimated hours
        <input aria-label="Quick task hours" type="number" min="0" max="24" step="0.25" value={hours} onChange={event => setHours(event.target.value)} required className={control} />
      </label>
      <div className="text-sm sm:col-span-2 lg:col-span-3">
        <p className="text-[#71756e]">Schedules this task for {day}. Leave start time blank for flexible work; use 0 hours if you still need an estimate.</p>
        {conflicts && <p className="mt-2 text-amber-800">This time overlaps another task. Choose a different time or adjust it in the planner.</p>}
        {hasDraft && Number.isFinite(estimate) && plannedHours + estimate > capacity && <p className="mt-2 text-amber-800">Adding this task puts the day over your available work hours.</p>}
        {hasDraft && dueDate && dueDate < day && <p className="mt-2 text-amber-800">This task will be scheduled after its due date.</p>}
        {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-2">{notice}</p>}
        <button type="submit" className="mt-3 rounded-lg border border-[#171918] bg-[#171918] px-4 py-3 font-medium text-white hover:bg-[#343733]">Add and schedule task</button>
      </div>
    </form>}
  </details>;
}
