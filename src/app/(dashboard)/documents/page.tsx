"use client";
import { useState } from "react";
import Link from "next/link";
import { useClients } from "@/context/ClientContext";
import { useProjects } from "@/context/ProjectContext";
import { useInvoices } from "@/context/InvoiceContext";
import { getSupabase } from "@/lib/supabase/client";
import {
  extractSuggestions,
  type DocumentSuggestions,
} from "@/lib/documentImport";
import { localDate, shiftDate } from "@/lib/planning";
const control = "mt-1 block w-full rounded-lg border bg-white p-3";
export default function DocumentsPage() {
  const {
    clients,
    isLoaded: clientsLoaded,
    createClient,
    updateClient,
  } = useClients();
  const {
    projects,
    isLoaded: projectsLoaded,
    createProject,
    updateProject,
  } = useProjects();
  const { isLoaded: invoicesLoaded, addInvoice } = useInvoices();
  const [text, setText] = useState("");
  const [source, setSource] = useState("Pasted document");
  const [review, setReview] = useState<DocumentSuggestions | null>(null);
  const [clientId, setClientId] = useState("__internal__");
  const [projectId, setProjectId] = useState("");
  const [updateContact, setUpdateContact] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState("");
  if (!clientsLoaded || !projectsLoaded || !invoicesLoaded)
    return <p>Loading documents…</p>;
  function analyze() {
    if (!text.trim() || text.length > 100000) {
      setError("Paste between 1 and 100,000 characters.");
      return;
    }
    const suggestions = extractSuggestions(text);
    setReview(suggestions);
    const match = clients.find(
      (c) =>
        c.companyName.toLowerCase() === suggestions.clientName.toLowerCase(),
    );
    setClientId(
      match?.id ?? (suggestions.clientName ? "__new__" : "__internal__"),
    );
    setProjectId("");
    setUpdateContact(false);
    setError("");
    setApplied("");
  }
  function apply() {
    if (!review || applied) return;
    const existing = projects.find((p) => p.id === projectId);
    const client = clients.find((c) => c.id === clientId);
    const startDate = review.startDate || existing?.startDate || localDate();
    const dueDate =
      review.dueDate || existing?.dueDate || shiftDate(startDate, 30);
    const budget = Number(review.budget || existing?.budget || 0);
    if (
      !review.projectName.trim() ||
      !Number.isFinite(budget) ||
      budget < 0 ||
      dueDate < startDate
    ) {
      setError(
        "Enter a project name, a valid budget, and a completion date on or after the start date.",
      );
      return;
    }
    if (
      clientId === "__new__" &&
      (!review.clientName.trim() ||
        !review.contactName.trim() ||
        !/^\S+@\S+\.\S+$/.test(review.email))
    ) {
      setError(
        "A new client needs a company name, contact name, and valid email.",
      );
      return;
    }
    if (clientId !== "__new__" && clientId !== "__internal__" && !client) {
      setError("Choose an available client.");
      return;
    }
    if (
      updateContact &&
      client &&
      (!review.clientName.trim() ||
        !review.contactName.trim() ||
        !/^\S+@\S+\.\S+$/.test(review.email))
    ) {
      setError(
        "Review all client fields before updating the selected client's details.",
      );
      return;
    }
    if (
      review.billing.some(
        (b) =>
          !b.description.trim() ||
          !Number.isFinite(Number(b.amount)) ||
          Number(b.amount) <= 0 ||
          !b.sendDate ||
          !b.dueDate ||
          b.dueDate < b.sendDate,
      )
    ) {
      setError(
        "Each invoice needs a description, positive amount, send date, and a due date on or after its send date. Remove any invoice you don't want to create.",
      );
      return;
    }
    let linked = client;
    if (clientId === "__new__")
      linked = createClient({
        companyName: review.clientName.trim(),
        contactName: review.contactName.trim(),
        email: review.email.trim(),
        status: "Active",
        source: "Other",
      });
    else if (updateContact && client) {
      const parts = review.contactName.trim().split(/\s+/);
      updateClient(client.id, {
        companyName: review.clientName.trim(),
        contactName: review.contactName.trim(),
        email: review.email.trim(),
        contacts: client.contacts.map((contact) =>
          contact.isPrimary
            ? {
                ...contact,
                firstName: parts[0],
                lastName: parts.slice(1).join(" "),
                email: review.email.trim(),
              }
            : contact,
        ),
      });
      linked = {
        ...client,
        companyName: review.clientName.trim(),
        email: review.email.trim(),
      };
    }
    const fields = {
      name: review.projectName.trim(),
      clientId: linked?.id,
      clientName: linked?.companyName ?? "Internal",
      clientEmail: linked?.email,
      budget,
      startDate,
      dueDate,
    };
    const document = {
      id: `document-${crypto.randomUUID()}`,
      name: source,
      type: "Imported text",
      size: `${text.length} characters`,
      updatedAt: new Date().toISOString(),
      sourceText: text,
    };
    let target = existing;
    if (existing)
      updateProject(existing.id, {
        ...fields,
        documents: [...(existing.documents ?? []), document],
      });
    else {
      target = createProject({
        ...fields,
        description: `Imported from ${source}. Review scope in the source text.`,
        status: "Planning",
        priority: "Medium",
        technology: [],
      });
      updateProject(target.id, { documents: [document] });
    }
    review.billing.forEach((b) =>
      addInvoice({
        projectId: target!.id,
        description: b.description.trim(),
        amount: Number(b.amount),
        sendDate: b.sendDate,
        dueDate: b.dueDate,
        trigger: "",
        status: "Planned",
      }),
    );
    setApplied(target!.id);
    setError("");
  }
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-semibold">Document import</h1>
      <p className="mt-2 text-[#71756e]">
        Upload a proposal, contract, or invoice, or paste its text. Review
        suggestions before applying them.
      </p>
      <section className="my-6 rounded-2xl border bg-white p-5">
        <label className="font-medium">
          Choose document
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            disabled={busy}
            className="mt-2 block w-full"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 3000000) {
                setError("Use a file smaller than 3 MB.");
                return;
              }
              setBusy(true);
              setReview(null);
              setError("");
              setApplied("");
              try {
                const form = new FormData();
                form.append("file", file);
                const session = await getSupabase()?.auth.getSession();
                const token = session?.data.session?.access_token;
                const response = await fetch("/api/documents/extract", {
                  method: "POST",
                  body: form,
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!response.headers.get("content-type")?.includes("application/json")) {
                  throw new Error(
                    `The upload service returned an unexpected page (HTTP ${response.status}). Refresh this preview and try again, or paste the document text.`,
                  );
                }
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                setText(result.text);
                setSource(file.name);
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Unable to read file.",
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        <p className="mt-2 text-xs text-[#71756e]">
          PDF, DOCX, TXT, or Markdown · up to 3 MB · PDFs up to 30 pages. Files
          are read for import; the original file is not archived. Source text is
          saved with the project when applied.
        </p>
        <label className="mt-5 block">
          Document text
          <textarea
            rows={10}
            value={text}
            maxLength={100000}
            onChange={(e) => {
              setText(e.target.value);
              setReview(null);
              setSource("Pasted document");
              setApplied("");
            }}
            className={control}
            placeholder="Client: Example Company&#10;Project: Website rebuild&#10;Total: $3,800&#10;Start date: 2026-10-20&#10;Completion date: 2026-11-20&#10;Deposit: $1,900"
          />
        </label>
        <button
          disabled={busy}
          onClick={analyze}
          className="mt-4 rounded-xl bg-[#171918] px-4 py-3 text-white disabled:opacity-50"
        >
          {busy ? "Reading file…" : "Review extracted fields"}
        </button>
        <p className="mt-3 text-xs text-[#71756e]">
          This first version recognizes common labeled fields and dollar
          amounts. Unrecognized terms stay blank. Scanned documents require OCR
          or pasted text.
        </p>
      </section>
      {error && (
        <p role="alert" className="mb-4 text-red-700">
          {error}
        </p>
      )}
      {applied ? (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Changes applied to your workspace</h2>
          <p className="mt-2 text-sm">
            Wait for saving to finish. The source text is attached to the
            project.
          </p>
          <Link
            href={`/projects/${applied}`}
            className="mt-3 inline-block underline"
          >
            Open project →
          </Link>
        </section>
      ) : (
        review && (
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="text-xl font-semibold">Review changes</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                Project destination
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    const p = projects.find((p) => p.id === e.target.value);
                    if (p) {
                      const linkedClient = clients.find(
                        (c) =>
                          c.id === p.clientId ||
                          (!p.clientId && c.companyName === p.clientName),
                      );
                      setClientId(linkedClient?.id ?? "__internal__");
                      setUpdateContact(false);
                      setReview({
                        ...review,
                        projectName: review.projectName || p.name,
                        budget: review.budget || String(p.budget),
                        startDate: review.startDate || p.startDate,
                        dueDate: review.dueDate || p.dueDate,
                      });
                    }
                  }}
                  className={control}
                >
                  <option value="">Create new project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Client destination
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className={control}
                >
                  <option value="__internal__">Internal project</option>
                  <option value="__new__">Create new client</option>
                  {clients
                    .filter((c) => c.status !== "Archived")
                    .map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                </select>
              </label>
              {(
                [
                  ["clientName", "Company name"],
                  ["contactName", "Contact name"],
                  ["email", "Client email"],
                  ["projectName", "Project name"],
                  ["budget", "Project budget ($)"],
                  ["startDate", "Start date"],
                  ["dueDate", "Completion date"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    type={
                      key.endsWith("Date")
                        ? "date"
                        : key === "budget"
                          ? "number"
                          : key === "email"
                            ? "email"
                            : "text"
                    }
                    min={key === "budget" ? "0" : undefined}
                    step={key === "budget" ? "0.01" : undefined}
                    value={review[key]}
                    onChange={(e) =>
                      setReview({ ...review, [key]: e.target.value })
                    }
                    className={control}
                  />
                </label>
              ))}
            </div>
            {projects.find((p) => p.id === projectId) && (
              <p className="mt-4 text-sm">
                Existing project:{" "}
                {projects.find((p) => p.id === projectId)?.name} · Budget $
                {projects.find((p) => p.id === projectId)?.budget} · Due{" "}
                {projects.find((p) => p.id === projectId)?.dueDate}. Applying
                replaces the reviewed project fields and client link; tasks and
                milestones remain intact.
              </p>
            )}
            {clients.some((c) => c.id === clientId) && (
              <label className="mt-4 block text-sm">
                <input
                  type="checkbox"
                  checked={updateContact}
                  onChange={(e) => setUpdateContact(e.target.checked)}
                />{" "}
                Also update the selected client&apos;s company, contact name,
                and email from these fields
              </label>
            )}
            <h3 className="mt-6 font-semibold">
              Invoice suggestions · {review.billing.length}
            </h3>
            <p className="mt-1 text-sm text-[#71756e]">
              Review amounts and enter both dates for each invoice. Nothing is
              sent.
            </p>
            {review.billing.map((b, index) => (
              <div
                key={index}
                className="mt-3 grid gap-3 rounded-xl border p-3 sm:grid-cols-2"
              >
                {(
                  [
                    ["description", "Invoice description"],
                    ["amount", "Amount ($)"],
                    ["sendDate", "Send date"],
                    ["dueDate", "Payment due"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      value={b[key]}
                      type={
                        key.endsWith("Date")
                          ? "date"
                          : key === "amount"
                            ? "number"
                            : "text"
                      }
                      onChange={(e) =>
                        setReview({
                          ...review,
                          billing: review.billing.map((item, i) =>
                            i === index
                              ? { ...item, [key]: e.target.value }
                              : item,
                          ),
                        })
                      }
                      className={control}
                    />
                  </label>
                ))}
                <button
                  onClick={() =>
                    setReview({
                      ...review,
                      billing: review.billing.filter((_, i) => i !== index),
                    })
                  }
                  className="text-sm underline"
                >
                  Remove invoice suggestion
                </button>
              </div>
            ))}
            <button
              onClick={apply}
              className="mt-6 rounded-xl bg-[#171918] px-5 py-3 text-white"
            >
              Apply reviewed changes
            </button>
          </section>
        )
      )}
    </div>
  );
}
