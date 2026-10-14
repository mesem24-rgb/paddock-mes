"use client";
import { useState } from "react";
import { useProjects } from "@/context/ProjectContext";
import { useInvoices, type Invoice } from "@/context/InvoiceContext";
import { localDate } from "@/lib/planning";
const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
export default function InvoicesPage() {
  const { projects, isLoaded: projectsLoaded } = useProjects();
  const { invoices, isLoaded, addInvoice, updateInvoice, scheduleNextInvoice } =
    useInvoices();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState("All");
  if (!isLoaded || !projectsLoaded) return <p>Loading invoices…</p>;
  const today = localDate();
  const visible = invoices
    .filter((i) => filter === "All" || i.status === filter)
    .sort((a, b) => a.sendDate.localeCompare(b.sendDate));
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-semibold">Invoice schedule</h1>
      <p className="mt-2 text-[#71756e]">
        Track when to send invoices and follow up on payments. Sending and
        payment collection happen through your existing process.
      </p>
      <div className="my-6 grid gap-4 sm:grid-cols-3">
        {[
          [
            "Ready to send",
            String(
              invoices.filter(
                (i) => i.status === "Planned" && i.sendDate <= today,
              ).length,
            ),
          ],
          [
            "Outstanding",
            money(
              invoices
                .filter((i) => i.status === "Sent")
                .reduce((n, i) => n + i.amount, 0),
            ),
          ],
          [
            "Overdue",
            money(
              invoices
                .filter((i) => i.status === "Sent" && i.dueDate < today)
                .reduce((n, i) => n + i.amount, 0),
            ),
          ],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-[#71756e]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <form
        id="invoice-form"
        key={editing?.id ?? "new"}
        className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const d = new FormData(form);
          const amount = Number(d.get("amount"));
          const sendDate = String(d.get("sendDate"));
          const dueDate = String(d.get("dueDate"));
          const projectId = String(d.get("project"));
          if (
            !projects.some((p) => p.id === projectId) ||
            !String(d.get("description")).trim() ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            dueDate < sendDate
          ) {
            setError(
              "Choose a project, enter a positive amount, and set a due date on or after the send date.",
            );
            return;
          }
          const recurrence =
            d.get("recurrence") === "Monthly"
              ? ("Monthly" as const)
              : undefined;
          const details = {
            recurrence,
            billingDay: recurrence
              ? editing?.sendDate === sendDate
                ? (editing.billingDay ?? Number(sendDate.slice(8, 10)))
                : Number(sendDate.slice(8, 10))
              : undefined,
            projectId,
            description: String(d.get("description")).trim(),
            amount,
            sendDate,
            dueDate,
            trigger: String(d.get("trigger")).trim(),
          };
          if (editing) updateInvoice(editing.id, details);
          else addInvoice({ ...details, status: "Planned" });
          setEditing(null);
          form.reset();
          setError("");
        }}
      >
        <h2 className="text-xl font-semibold sm:col-span-2">
          {editing ? "Edit invoice" : "Schedule invoice"}
        </h2>
        <label>
          Project
          <select
            name="project"
            defaultValue={editing?.projectId ?? ""}
            required
            className="mt-1 block w-full rounded-lg border p-3"
          >
            <option value="">Choose project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Description
          <input
            name="description"
            defaultValue={editing?.description ?? ""}
            placeholder="Design approval payment"
            required
            className="mt-1 block w-full rounded-lg border p-3"
          />
        </label>
        <label>
          Amount ($)
          <input
            name="amount"
            defaultValue={editing?.amount ?? ""}
            type="number"
            min="0.01"
            step="0.01"
            required
            className="mt-1 block w-full rounded-lg border p-3"
          />
        </label>
        <label>
          Milestone / condition (optional)
          <input
            name="trigger"
            defaultValue={editing?.trigger ?? ""}
            placeholder="Confirm client approval before sending"
            className="mt-1 block w-full rounded-lg border p-3"
          />
        </label>
        <label>
          Send date
          <input
            name="sendDate"
            type="date"
            defaultValue={editing?.sendDate ?? today}
            required
            className="mt-1 block w-full rounded-lg border p-3"
          />
        </label>
        <label>
          Payment due
          <input
            name="dueDate"
            defaultValue={editing?.dueDate ?? ""}
            type="date"
            required
            className="mt-1 block w-full rounded-lg border p-3"
          />
        </label>
        <label className="sm:col-span-2">
          Repeat
          <select
            name="recurrence"
            defaultValue={editing?.recurrence ?? "One-off"}
            className="mt-1 block w-full rounded-lg border p-3"
          >
            <option value="One-off">One-off invoice</option>
            <option value="Monthly">Monthly retainer / maintenance</option>
          </select>
          <span className="mt-2 block text-xs text-[#71756e]">
            Use Create next month on a saved monthly invoice to plan the next
            billing date. Invoices are not sent automatically.
          </span>
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <button className="rounded-lg bg-[#171918] p-3 text-white sm:col-span-2">
          {editing ? "Save invoice changes" : "Schedule invoice"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setError("");
            }}
            className="rounded-lg border p-3 sm:col-span-2"
          >
            Cancel editing
          </button>
        )}
      </form>
      <label className="my-5 block">
        Show{" "}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border bg-white p-2"
        >
          {["All", "Planned", "Sent", "Paid"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="space-y-3">
        {visible.map((i) => (
          <article
            key={i.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-5"
          >
            <div className="mr-auto">
              <h2 className="font-semibold">
                {i.description} · {money(i.amount)}
              </h2>
              <p className="text-sm text-[#71756e]">
                {projects.find((p) => p.id === i.projectId)?.name ??
                  "Project unavailable"}{" "}
                · Send {i.sendDate} · Due {i.dueDate}
              </p>
              {i.recurrence && (
                <p className="mt-1 text-sm font-medium">Monthly billing</p>
              )}
              {i.nextInvoiceId && (
                <p className="mt-1 text-xs text-[#71756e]">
                  Next month already scheduled.
                </p>
              )}
              {i.trigger && (
                <p className="mt-1 text-sm">Condition: {i.trigger}</p>
              )}
              {i.status === "Planned" && i.sendDate <= today && (
                <p className="mt-1 text-sm font-medium">
                  Ready to review and send
                  {i.trigger ? " — check condition first" : ""}
                </p>
              )}
              {i.status === "Sent" && i.dueDate < today && (
                <p className="text-sm text-red-700">Overdue — follow up</p>
              )}
            </div>
            {i.recurrence === "Monthly" && !i.nextInvoiceId && (
              <button
                onClick={() => scheduleNextInvoice(i.id)}
                className="rounded-lg border px-3 py-2"
              >
                Create next month
              </button>
            )}
            <button
              className="rounded-lg border px-3 py-2"
              onClick={() => {
                setEditing(i);
                setError("");
                document
                  .getElementById("invoice-form")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Edit
            </button>
            <select
              aria-label={`Status for ${i.description}`}
              value={i.status}
              onChange={(e) =>
                updateInvoice(i.id, e.target.value as Invoice["status"])
              }
              className="rounded-lg border p-2"
            >
              {["Planned", "Sent", "Paid"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </article>
        ))}
      </div>
      {!visible.length && <p className="py-8">No invoices in this view.</p>}
    </div>
  );
}
