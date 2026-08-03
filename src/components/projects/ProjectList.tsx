"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Search,
} from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/shared/StatusBadge";
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

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
      {/* Keep the remainder of the existing ProjectList JSX here. */}
    </div>
  );
}