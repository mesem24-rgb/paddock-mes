import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/shared/StatusBadge";
import type { Task } from "@/types";

interface UpcomingTasksProps {
  tasks: Task[];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  return (
    <section className="rounded-2xl border border-[#dedfd9] bg-white">
      <div className="flex items-center justify-between border-b border-[#ecece6] px-5 py-4">
        <div>
          <h2 className="font-semibold text-[#20231f]">Upcoming tasks</h2>
          <p className="mt-1 text-xs text-[#858981]">
            Work that needs your attention
          </p>
        </div>

        <Link
          href="/tasks"
          className="flex items-center gap-1 text-sm font-medium text-[#555951] hover:text-[#20231f]"
        >
          View all
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="divide-y divide-[#ecece6]">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#2d302c]">
                {task.title}
              </p>

              <p className="mt-1 truncate text-xs text-[#858981]">
                {task.projectName}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <StatusBadge value={task.priority} />

              <div className="flex items-center gap-1.5 text-xs text-[#777b73]">
                <CalendarDays size={14} />
                {formatDate(task.dueDate)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}