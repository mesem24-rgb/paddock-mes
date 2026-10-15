import type { Invoice } from "@/context/InvoiceContext";
import type { Project } from "@/types";

export function invoiceReadiness(invoice: Invoice, projects: Project[], today: string) {
  if (invoice.status !== "Planned")
    return { ready: false, label: invoice.status, date: invoice.sendDate };
  if (invoice.milestoneId) {
    const milestone = projects.find(p => p.id === invoice.projectId)?.milestones?.find(m => m.id === invoice.milestoneId);
    if (!milestone) return { ready: false, label: "Linked milestone unavailable — edit this invoice", date: invoice.sendDate };
    if (milestone.status !== "Completed")
      return { ready: false, label: `Waiting for milestone: ${milestone.title}`, date: invoice.sendDate };
    return { ready: true, label: `Milestone complete: ${milestone.title}`, date: milestone.completedDate || today };
  }
  return {
    ready: Boolean(invoice.sendDate && invoice.sendDate <= today),
    label: invoice.sendDate && invoice.sendDate <= today ? "Scheduled invoice ready to review" : "Scheduled for a future date",
    date: invoice.sendDate,
  };
}
