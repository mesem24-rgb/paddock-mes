"use client";
import { useState } from "react";
import Link from "next/link";
import { useProjects } from "@/context/ProjectContext";
import { localDate, projectTasks } from "@/lib/planning";
import type { TaskStatus } from "@/types";
export default function TasksPage() {
  const { projects, isLoaded, addTask, updateTask } = useProjects();
  const [filter, setFilter] = useState("Open");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  if (!isLoaded) return <p>Loading tasks…</p>;
  const tasks = projectTasks(projects)
    .filter(
      (t) =>
        (filter === "All" ||
          (filter === "Open"
            ? t.status !== "Completed"
            : t.status === filter)) &&
        `${t.title} ${t.projectName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-semibold">Tasks</h1>
      <p className="mt-2 text-[#71756e]">
        Plan the next action across every build.
      </p>
      <form
        className="my-6 grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const d = new FormData(form);
          const id = String(d.get("project"));
          if (!projects.some((p) => p.id === id) || !String(d.get("title")).trim()) {
            setError("Choose a project and enter a task title.");
            return;
          }
          addTask(id, {
            title: String(d.get("title")).trim(),
            dueDate: String(d.get("dueDate")),
            priority: "Medium",
            status: "To Do",
            assignee: "Michael",
          });
          form.reset();
          setError("");
        }}
      >
        <input
          name="title"
          aria-label="Task title"
          placeholder="Next action"
          required
          className="rounded-lg border p-3"
        />
        <select
          name="project"
          aria-label="Task project"
          required
          className="rounded-lg border p-3"
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <label>
          Due date
          <input
            name="dueDate"
            type="date"
            required
            defaultValue={localDate()}
            className="ml-3 rounded-lg border p-3"
          />
        </label>
        <button className="rounded-lg bg-[#171918] p-3 text-white">
          Add task
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          aria-label="Search tasks"
          placeholder="Search tasks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border bg-white p-3"
        />
        <select
          aria-label="Task status filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border bg-white p-3"
        >
          {["Open", "All", "To Do", "In Progress", "Blocked", "Completed"].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
      </div>
      <div className="space-y-3">
        {tasks.map((t) => (
          <article
            key={`${t.projectId}-${t.id}`}
            className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4"
          >
            <div className="mr-auto">
              <h2 className="font-medium">{t.title}</h2>
              <Link
                href={`/projects/${t.projectId}`}
                className="text-sm text-[#71756e]"
              >
                {t.projectName}
              </Link>
              <p
                className={
                  t.status !== "Completed" && t.dueDate < localDate()
                    ? "text-sm text-red-700"
                    : "text-sm text-[#71756e]"
                }
              >
                Due {t.dueDate} · {t.priority}
              </p>
            </div>
            <select
              aria-label={`Status for ${t.title}`}
              value={t.status}
              onChange={(e) =>
                updateTask(t.projectId, t.id, {
                  status: e.target.value as TaskStatus,
                })
              }
              className="rounded-lg border p-2"
            >
              {["To Do", "In Progress", "Blocked", "Completed"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </article>
        ))}
      </div>
      {!tasks.length && <p className="py-8">No tasks match this view.</p>}
    </div>
  );
}
