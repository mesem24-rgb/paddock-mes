"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { useProjects } from "@/context/ProjectContext";
import type { ProjectStatus } from "@/types";

const statusOptions: Array<"All" | ProjectStatus> = [
  "All",
  "Planning",
  "In Progress",
  "Client Review",
  "On Hold",
  "Completed",
];

export default function ProjectList() {
  const { projects, isLoaded } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof statusOptions)[number]>("All");

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.clientName.toLowerCase().includes(normalizedSearch) ||
        project.description.toLowerCase().includes(normalizedSearch) ||
        project.technology.some((technology) =>
          technology.toLowerCase().includes(normalizedSearch),
        );

      const matchesStatus =
        selectedStatus === "All" || project.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, selectedStatus]);

  if (!isLoaded) {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-80 animate-pulse rounded-2xl border border-[#dedfd9] bg-white"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="mr-auto text-3xl font-semibold">Projects</h1>
        <Link
          href="/projects/new"
          className="rounded-xl bg-[#171918] px-4 py-3 text-white"
        >
          New project
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 rounded-xl border bg-white px-3">
          <Search size={18} />
          <input
            aria-label="Search projects"
            placeholder="Search projects or clients"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 outline-none"
          />
        </label>
        <select
          aria-label="Filter project status"
          value={selectedStatus}
          onChange={(e) =>
            setSelectedStatus(e.target.value as typeof selectedStatus)
          }
          className="rounded-xl border bg-white px-3"
        >
          {statusOptions.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      {!filteredProjects.length && (
        <p className="py-12 text-center text-[#71756e]">
          No projects match your filters.
        </p>
      )}
    </div>
  );
}
