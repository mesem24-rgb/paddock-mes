import type { Project, BusinessClient } from "@/types";
import type { Invoice } from "@/context/InvoiceContext";
import { conflictingTasks, projectTasks } from "@/lib/planning";
import { needsAttention } from "@/lib/attention";

export function dailyPlan(projects: Project[], clients: BusinessClient[], invoices: Invoice[], day: string) {
  const tasks = projectTasks(projects).filter(task => task.status !== "Completed");
  const scheduled = tasks.filter(task => task.scheduledDate === day)
    .sort((a, b) => (a.scheduledTime || "99:99").localeCompare(b.scheduledTime || "99:99") || a.title.localeCompare(b.title));
  const scheduledKeys = new Set(scheduled.map(task => `task:${task.projectId}:${task.id}`));
  const actions = needsAttention(projects, clients, invoices, day).filter(item => !scheduledKeys.has(item.id));
  return {
    scheduled, actions,
    hours: scheduled.reduce((total, task) => total + (task.estimatedHours ?? 0), 0),
    unestimated: scheduled.filter(task => !(task.estimatedHours && task.estimatedHours > 0)).length,
    conflicts: conflictingTasks(tasks),
  };
}
