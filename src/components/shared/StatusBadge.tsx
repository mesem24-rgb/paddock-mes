import type {
  ClientStatus,
  ProjectPriority,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/types";

type StatusValue =
  | ProjectStatus
  | ProjectPriority
  | TaskStatus
  | TaskPriority
  | ClientStatus;

interface StatusBadgeProps {
  value: StatusValue;
}

const statusStyles: Record<StatusValue, string> = {
  Planning: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  "Client Review":
    "bg-purple-50 text-purple-700 border-purple-200",
  "On Hold": "bg-gray-100 text-gray-700 border-gray-200",
  Completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200",

  "To Do": "bg-slate-50 text-slate-700 border-slate-200",
  Blocked: "bg-red-50 text-red-700 border-red-200",

  Low: "bg-gray-50 text-gray-600 border-gray-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Urgent: "bg-red-50 text-red-700 border-red-200",

  Lead: "bg-violet-50 text-violet-700 border-violet-200",
  Active:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-50 text-slate-600 border-slate-200",
  Archived: "bg-stone-100 text-stone-600 border-stone-200",
};

export default function StatusBadge({
  value,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[value]}`}
    >
      {value}
    </span>
  );
}