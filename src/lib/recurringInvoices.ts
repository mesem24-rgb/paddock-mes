import type { Invoice } from "@/context/InvoiceContext";
import { localDate, shiftDate } from "@/lib/planning";
export function nextMonthlyDate(
  date: string,
  billingDay = Number(date.slice(8, 10)),
) {
  const year = Number(date.slice(0, 4)),
    month = Number(date.slice(5, 7));
  const lastDay = new Date(year, month + 1, 0, 12).getDate();
  return localDate(
    new Date(year, month, Math.min(Math.max(1, billingDay), lastDay), 12),
  );
}
export function scheduleNextMonthlyInvoice(
  invoices: Invoice[],
  sourceId: string,
): Invoice[] {
  const source = invoices.find((i) => i.id === sourceId);
  if (
    !source ||
    source.recurrence !== "Monthly" ||
    source.nextInvoiceId ||
    invoices.some((i) => i.sourceInvoiceId === sourceId)
  )
    return invoices;
  const terms = Math.round(
    (Date.parse(`${source.dueDate}T12:00:00Z`) -
      Date.parse(`${source.sendDate}T12:00:00Z`)) /
      86400000,
  );
  if (!Number.isFinite(terms) || terms < 0) return invoices;
  const billingDay = source.billingDay ?? Number(source.sendDate.slice(8, 10));
  const sendDate = nextMonthlyDate(source.sendDate, billingDay);
  const next: Invoice = {
    ...source,
    milestoneId: undefined,
    id: crypto.randomUUID(),
    sendDate,
    dueDate: shiftDate(sendDate, terms),
    status: "Planned",
    billingDay,
    sourceInvoiceId: source.id,
    nextInvoiceId: undefined,
  };
  return [
    ...invoices.map((i) =>
      i.id === sourceId ? { ...i, nextInvoiceId: next.id } : i,
    ),
    next,
  ];
}
