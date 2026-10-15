import type { BusinessClient, Project } from "@/types";
import type { Invoice } from "@/context/InvoiceContext";
import { projectTasks } from "@/lib/planning";
import { invoiceReadiness } from "@/lib/invoiceReadiness";
export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  date: string;
  href: string;
  kind: string;
}
export function needsAttention(
  projects: Project[],
  clients: BusinessClient[],
  invoices: Invoice[],
  today: string,
): AttentionItem[] {
  const tasks = projectTasks(projects)
    .filter((t) => t.status !== "Completed" && t.dueDate <= today)
    .map((t) => ({
      id: `task:${t.projectId}:${t.id}`,
      title: t.title,
      detail: t.projectName,
      date: t.dueDate,
      href: `/projects/${t.projectId}`,
      kind: t.status === "Blocked" ? "Blocked task" : "Task due",
    }));
  const followups = clients
    .filter(
      (c) =>
        c.status !== "Archived" && c.followUpDate && c.followUpDate <= today,
    )
    .map((c) => ({
      id: `client:${c.id}`,
      title: c.followUpAction || "Client check-in",
      detail: c.companyName,
      date: c.followUpDate!,
      href: "/leads",
      kind: "Client follow-up",
    }));
  const bills = invoices
    .filter(
      (i) =>
        invoiceReadiness(i, projects, today).ready ||
        (i.status === "Sent" && i.dueDate && i.dueDate <= today),
    )
    .map((i) => ({
      id: `invoice:${i.id}`,
      title: i.description,
      detail: [projects.find(p => p.id === i.projectId)?.name,
        i.status === "Planned" ? invoiceReadiness(i, projects, today).label : "Follow up on payment",
        i.trigger ? `Check condition: ${i.trigger}` : "",
        Number.isFinite(i.amount) ? `$${i.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "",
      ].filter(Boolean).join(" · "),
      date: i.status === "Planned" ? invoiceReadiness(i, projects, today).date : i.dueDate,
      href: "/invoices",
      kind: i.status === "Planned" ? "Invoice to send" : i.dueDate < today ? "Payment overdue" : "Payment due today",
    }));
  const builds = projects
    .filter((p) => p.status !== "Completed" && p.dueDate <= today)
    .map((p) => ({
      id: `project:${p.id}`,
      title: p.name,
      detail: p.clientName,
      date: p.dueDate,
      href: `/projects/${p.id}`,
      kind: "Build deadline",
    }));
  return [...tasks, ...followups, ...bills, ...builds].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}
