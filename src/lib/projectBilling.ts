import type { Invoice } from "@/context/InvoiceContext";
import type { Project } from "@/types";

// Sum in cents so balances do not accumulate floating-point rounding errors.
export function projectBilling(project: Project, invoices: Invoice[]) {
  const records = invoices.filter(invoice => invoice.projectId === project.id);
  const oneOff = records.filter(invoice => !invoice.recurrence);
  const monthly = records.filter(invoice => invoice.recurrence === "Monthly");
  const total = (items: Invoice[], status?: Invoice["status"]) => items
    .filter(invoice => !status || invoice.status === status)
    .reduce((sum, invoice) => sum + Math.round(invoice.amount * 100), 0);
  const budget = Math.round(project.budget * 100);
  const planned = total(oneOff, "Planned");
  const outstanding = total(oneOff, "Sent");
  const paid = total(oneOff, "Paid");
  const scheduled = planned + outstanding + paid;
  return {
    records: [...records].sort((a, b) => a.sendDate.localeCompare(b.sendDate) || a.id.localeCompare(b.id)),
    planned: planned / 100,
    outstanding: outstanding / 100,
    paid: paid / 100,
    unbilled: Math.max(0, budget - outstanding - paid) / 100,
    unscheduled: Math.max(0, budget - scheduled) / 100,
    overBudget: Math.max(0, scheduled - budget) / 100,
    paymentMismatch: oneOff.length > 0 && project.amountPaid > 0 && Math.round(project.amountPaid * 100) !== paid,
    monthly: { count: monthly.length, planned: total(monthly, "Planned") / 100, outstanding: total(monthly, "Sent") / 100, paid: total(monthly, "Paid") / 100 },
  };
}
