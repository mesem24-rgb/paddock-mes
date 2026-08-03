import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import ProjectCard from "@/components/dashboard/ProjectCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import {
  dashboardMetrics,
  projects,
  recentActivity,
  upcomingTasks,
} from "@/data/mock-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1600px]">
      {/* SECTION: Dashboard header */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#858981]">
            Friday, July 17
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20231f] sm:text-4xl">
            Good evening, Michael.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71756e] sm:text-base">
            Here&apos;s what is happening across your business and active
            builds.
          </p>
        </div>

        <button
          type="button"
          className="flex w-fit items-center gap-2 rounded-xl bg-[#171918] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2a2d2a] sm:hidden"
        >
          <Plus size={17} />
          New project
        </button>
      </section>

      {/* SECTION: Dashboard metrics */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
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
        <RecentActivity activities={recentActivity} />
      </section>
    </div>
  );
}