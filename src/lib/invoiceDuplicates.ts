import type { Invoice } from "@/context/InvoiceContext";

// Amount matches are warnings, not proof: milestones can share the same price.
export function potentialInvoiceDuplicates(invoices: Invoice[], projectId: string, amount: string) {
  const value = Number(amount);
  if (!projectId || !amount.trim() || !Number.isFinite(value) || value <= 0) return [];
  const cents = Math.round(value * 100);
  return invoices.filter(invoice => invoice.projectId === projectId && Math.round(invoice.amount * 100) === cents);
}
