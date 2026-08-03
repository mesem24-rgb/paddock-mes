"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import ProjectList from "@/components/projects/ProjectList";
import { useProjects } from "@/context/ProjectContext";

export default function ProjectsOverview() {
  const { projects, isLoaded } = useProjects();

  const activeProjects = projects.filter(
    (project) =>
      project.status !== "Completed" && project.status !== "On Hold",
  ).length;

  const totalValue = projects.reduce(
    (total, project) => total + project.budget,
    0,
  );

  const totalOutstanding = projects.reduce(
    (total, project) =>
      total + Math.max(project.budget - project.amountPaid, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* SECTION: Page header */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#858981]">
            Delivery workspace
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20231f] sm:text-4xl">
            Projects
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71756e] sm:text-base">
            Manage every client build from initial planning through launch and
            ongoing support.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="flex w-fit items-center gap-2 rounded-xl bg-[#171918] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2b2e2a]"
        >
          <Plus size={17} />
          New project
        </Link>
      </section>

      {/* SECTION: Project summary */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#dedfd9] bg-white p-5">
          <p className="text-sm text-[#777b73]">Active projects</p>

          <p className="mt-3 text-3xl font-semibold text-[#20231f]">
            {isLoaded ? activeProjects : "—"}
          </p>
        </article>

        <article className="rounded-2xl border border-[#dedfd9] bg-white p-5">
          <p className="text-sm text-[#777b73]">Total project value</p>

          <p className="mt-3 text-3xl font-semibold text-[#20231f]">
            {isLoaded ? `$${totalValue.toLocaleString()}` : "—"}
          </p>
        </article>

        <article className="rounded-2xl border border-[#dedfd9] bg-white p-5">
          <p className="text-sm text-[#777b73]">Outstanding value</p>

          <p className="mt-3 text-3xl font-semibold text-[#20231f]">
            {isLoaded ? `$${totalOutstanding.toLocaleString()}` : "—"}
          </p>
        </article>
      </section>

      {/* SECTION: Project list */}
      <section className="mt-8">
        <ProjectList />
      </section>
    </div>
  );
}