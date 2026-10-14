"use client";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { useInvoices } from "@/context/InvoiceContext";
import { useProjects } from "@/context/ProjectContext";
import { localDate, projectTasks } from "@/lib/planning";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
export default function DashboardPage() {
  const { projects: allProjects, isLoaded } = useProjects();
  const { invoices, isLoaded: invoicesLoaded } = useInvoices();
  if (!isLoaded || !invoicesLoaded) return <p>Loading your workspace…</p>;
  const today = localDate();
  const projects = allProjects.filter((p) => p.status !== "Completed");
  const openTasks = projectTasks(allProjects).filter(
    (t) => t.status !== "Completed",
  );
  const upcomingTasks = [...openTasks]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);
  const scheduled = openTasks.filter((t) => t.scheduledDate === today);
  const dashboardMetrics = [
    {
      id: "projects",
      label: "Active Projects",
      value: String(projects.length),
    },
    {
      id: "tasks",
      label: "Open Tasks",
      value: String(openTasks.length),
      change: `${openTasks.filter((t) => t.dueDate < today).length} overdue`,
    },
    {
      id: "today",
      label: "Today's Planned Work",
      value: `${scheduled.reduce((n, t) => n + (t.estimatedHours ?? 0), 0)}h`,
      change: `${scheduled.length} tasks scheduled`,
    },
    {
      id: "blocked",
      label: "Blocked Tasks",
      value: String(openTasks.filter((t) => t.status === "Blocked").length),
    },
  ];
  return (
    <div className="mx-auto max-w-[1600px]">
      {/* SECTION: Dashboard header */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#858981]">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20231f] sm:text-4xl">
            Your day, Michael.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71756e] sm:text-base">
            Here&apos;s what is happening across your business and active
            builds.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="flex w-fit items-center gap-2 rounded-xl bg-[#171918] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2a2d2a] sm:hidden"
        >
          <Plus size={17} />
          New project
        </Link>
      </section>

      {/* SECTION: Dashboard metrics */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-[#dedfd9] bg-white p-5">
        <h2 className="font-semibold">Billing reminders</h2>
        <p className="mt-2 text-sm">
          {
            invoices.filter(
              (i) => i.status === "Planned" && i.sendDate <= today,
            ).length
          }{" "}
          invoices ready to review and send ·{" "}
          {
            invoices.filter((i) => i.status === "Sent" && i.dueDate < today)
              .length
          }{" "}
          overdue payments
        </p>
        <Link
          href="/invoices"
          className="mt-3 inline-block text-sm font-medium"
        >
          Open invoice schedule →
        </Link>
      </section>
      {/* SECTION: Active projects */}
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#93978f]">
              In the paddock
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[#20231f]">
              Active projects
            </h2>
          </div>

          <Link
            href="/projects"
            className="flex items-center gap-2 text-sm font-medium text-[#555951] transition hover:text-[#20231f]"
          >
            View all projects
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* SECTION: Tasks and activity */}
      <section className="mt-10 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <UpcomingTasks tasks={upcomingTasks} />
        <section className="rounded-2xl border border-[#dedfd9] bg-white p-5">
          <h2 className="font-semibold">Today&apos;s plan</h2>
          {scheduled.map((t) => (
            <p key={`${t.projectId}-${t.id}`} className="mt-3 text-sm">
              {t.scheduledTime || "Any time"} · {t.title}
            </p>
          ))}
          {!scheduled.length && (
            <p className="mt-3 text-sm text-[#71756e]">
              Choose tasks and reserve work time in your planner.
            </p>
          )}
          <Link href="/time" className="mt-4 inline-block text-sm font-medium">
            Open daily planner →
          </Link>
        </section>
      </section>
    </div>
  );
}
