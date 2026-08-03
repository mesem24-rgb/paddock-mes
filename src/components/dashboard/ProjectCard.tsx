import { ArrowUpRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/shared/StatusBadge";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="rounded-2xl border border-[#dedfd9] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c4c7bd]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94988f]">
            {project.clientName}
          </p>

          <h3 className="mt-2 text-lg font-semibold text-[#20231f]">
            {project.name}
          </h3>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="rounded-lg border border-[#dedfd9] p-2 text-[#696d66] transition hover:bg-[#f3f3ed] hover:text-[#20231f]"
          aria-label={`View ${project.name}`}
        >
          <ArrowUpRight size={18} />
        </Link>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6d716a]">
        {project.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <StatusBadge value={project.status} />
        <StatusBadge value={project.priority} />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-[#696d66]">Progress</span>
          <span className="font-semibold text-[#30332e]">
            {project.progress}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#ecece6]">
          <div
            className="h-full rounded-full bg-[#30332e]"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-[#ecece6] pt-4 text-xs text-[#777b73]">
        <CalendarDays size={15} />
        Due {formatDate(project.dueDate)}
      </div>
    </article>
  );
}