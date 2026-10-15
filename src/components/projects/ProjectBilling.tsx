"use client";

import Link from "next/link";
import { useInvoices } from "@/context/InvoiceContext";
import { invoiceReadiness } from "@/lib/invoiceReadiness";
import { projectBilling } from "@/lib/projectBilling";
import { localDate } from "@/lib/planning";
import type { Project } from "@/types";

const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export default function ProjectBilling({ project }: { project: Project }) {
  const { invoices, isLoaded } = useInvoices();
  if (!isLoaded) return <p className="mt-6">Loading project billing…</p>;
  const billing = projectBilling(project, invoices);
  const today = localDate();
  return <section className="mt-6 rounded-2xl border border-[#dedfd9] bg-white p-5" aria-labelledby="project-billing-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="project-billing-title" className="text-xl font-semibold">Project billing</h2>
      <Link href="/invoices" className="text-sm font-medium underline">Manage invoices</Link>
    </div>
    <p className="mt-2 text-sm text-[#71756e]">One-off invoices against the {money(project.budget)} project budget. Paid totals come from invoices marked Paid.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Paid invoices", billing.paid, "Recorded as received"],
        ["Awaiting payment", billing.outstanding, "Sent and not yet paid"],
        ["Planned invoices", billing.planned, "Not marked sent yet"],
        ["Unbilled budget", billing.unbilled, "Includes any planned invoices"],
      ].map(([label, amount, detail]) => <div key={String(label)} className="rounded-xl border bg-[#fafaf7] p-4">
        <h3 className="text-sm text-[#71756e]">{label}</h3>
        <p className="mt-2 text-xl font-semibold">{money(Number(amount))}</p>
        <p className="mt-1 text-xs text-[#71756e]">{detail}</p>
      </div>)}
    </div>
    <p className="mt-3 text-sm">{money(billing.unscheduled)} of the budget has no invoice scheduled yet.</p>
    {billing.overBudget > 0 && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">One-off invoices exceed the project budget by {money(billing.overBudget)}. Review the budget and charges, including any approved additional work.</p>}
    {billing.paymentMismatch && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Project payments entered manually total {money(project.amountPaid)}; invoices marked Paid total {money(billing.paid)}. Review the difference. These amounts are not added together.</p>}
    {billing.monthly.count > 0 && <div className="mt-4 rounded-xl bg-[#f5f5f0] p-4 text-sm">
      <h3 className="font-semibold">Monthly retainer invoices</h3>
      <p className="mt-1">Planned {money(billing.monthly.planned)} · Awaiting payment {money(billing.monthly.outstanding)} · Paid {money(billing.monthly.paid)}</p>
      <p className="mt-1 text-xs text-[#71756e]">Shown separately from the one-off project budget.</p>
    </div>}
    <ul className="mt-5 divide-y">
      {billing.records.map(invoice => {
        const readiness = invoiceReadiness(invoice, [project], today);
        return <li key={invoice.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
          <div>
            <Link href={`/invoices#invoice-${invoice.id}`} className="font-medium underline">{invoice.description}</Link>
            <p className="mt-1 text-sm text-[#71756e]">{invoice.recurrence === "Monthly" ? "Monthly" : "One-off"} · Target send {invoice.sendDate} · Due {invoice.dueDate}</p>
            {invoice.status === "Planned" && <p className="mt-1 text-sm">{readiness.ready ? "Ready to review and send" : readiness.label}</p>}
            {invoice.status === "Sent" && invoice.dueDate < today && <p className="mt-1 text-sm text-red-700">Overdue payment</p>}
          </div>
          <p className="text-sm font-semibold">{money(invoice.amount)} · {invoice.status}</p>
        </li>;
      })}
    </ul>
    {!billing.records.length && <p className="mt-4 text-sm text-[#71756e]">No invoices are linked to this project yet. Schedule invoices to track deposits and milestone payments here.</p>}
  </section>;
}
