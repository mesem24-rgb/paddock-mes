"use client";
import { useState } from "react";
import Link from "next/link";
import DocumentLibrary from "@/components/projects/DocumentLibrary";
import { useClients } from "@/context/ClientContext";
import { useProjects } from "@/context/ProjectContext";
import { useInvoices } from "@/context/InvoiceContext";
import { saveOriginalDocument } from "@/lib/documentStorage";
import type { Project, ProjectDocument } from "@/types";
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
  type Field = "clientName" | "contactName" | "email" | "projectName" | "budget" | "startDate" | "dueDate" | "clientLink";
  const [selected, setSelected] = useState<Partial<Record<Field, boolean>>>({});
  const [includeInvoices, setIncludeInvoices] = useState<Record<number, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saveFile, setSaveFile] = useState(true);
  const [saveText, setSaveText] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState("");
  if (!clientsLoaded || !projectsLoaded || !invoicesLoaded)
    return <p>Loading documents…</p>;
  function analyze() {
    if ((!text.trim() && !selectedFile) || text.length > 100000) {
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
    setSelected({ projectName: true, budget: true, startDate: true, dueDate: true, clientLink: true });
    setIncludeInvoices(Object.fromEntries(suggestions.billing.map((_, i) => [i, true])));
    setError("");
    setApplied("");
  }
  async function apply() {
    if (!review || applied || busy) return;
    const existing = projects.find((p) => p.id === projectId);
    const client = clients.find((c) => c.id === clientId);
    const changeLink = !existing || selected.clientLink;
    const startDate = (!existing || selected.startDate) ? review.startDate || existing?.startDate || localDate() : existing.startDate;
    const dueDate = (!existing || selected.dueDate) ? review.dueDate || existing?.dueDate || shiftDate(startDate, 30) : existing.dueDate;
    const budget = (!existing || selected.budget) ? Number(review.budget || existing?.budget || 0) : existing.budget;
    const name = (!existing || selected.projectName) ? review.projectName.trim() : existing.name;
    if (!name || !Number.isFinite(budget) || budget < 0 || dueDate < startDate) {
      setError("Enter a project name, a valid budget, and a completion date on or after the start date."); return;
    }
    const createNewClient = changeLink && clientId === "__new__";
    if (createNewClient && (!review.clientName.trim() || !review.contactName.trim() || !/^\S+@\S+\.\S+$/.test(review.email))) {
      setError("A new client needs a company name, contact name, and valid email."); return;
    }
    if (changeLink && clientId !== "__new__" && clientId !== "__internal__" && !client) {
      setError("Choose an available client."); return;
    }
    if (client && ((selected.clientName && !review.clientName.trim()) || (selected.contactName && !review.contactName.trim()) || (selected.email && !/^\S+@\S+\.\S+$/.test(review.email)))) {
      setError("Check the selected client fields. Names cannot be empty and email must be valid."); return;
    }
    const billing = review.billing.filter((_, i) => includeInvoices[i]);
    if (billing.some(b => !b.description.trim() || !Number.isFinite(Number(b.amount)) || Number(b.amount) <= 0 || !b.sendDate || !b.dueDate || b.dueDate < b.sendDate)) {
      setError("Each selected invoice needs a description, positive amount, send date, and a due date on or after its send date. Uncheck invoices you do not want to create."); return;
    }
    const attach = Boolean((saveText && text.trim()) || (saveFile && selectedFile));
    if (existing && !attach && !billing.length && !Object.values(selected).some(Boolean)) {
      setError("Select at least one update or document to save."); return;
    }
    setBusy(true); setError("");
    try {
      const document: ProjectDocument = {
        id: `document-${crypto.randomUUID()}`, name: source, type: "Imported text",
        size: `${text.length} characters`, updatedAt: new Date().toISOString(),
        ...(saveText && text.trim() ? { sourceText: text } : {}),
      };
      // Finish the file upload before changing any workspace records.
      if (saveFile && selectedFile) Object.assign(document, await saveOriginalDocument(selectedFile, document.id));
      let linked = client;
      if (createNewClient) linked = createClient({ companyName: review.clientName.trim(), contactName: review.contactName.trim(), email: review.email.trim(), status: "Active", source: "Other" });
      else if (client) {
        const fields: Partial<typeof client> = {};
        if (selected.clientName) fields.companyName = review.clientName.trim();
        if (selected.contactName) fields.contactName = review.contactName.trim();
        if (selected.email) fields.email = review.email.trim();
        if (selected.contactName || selected.email) {
          const parts = review.contactName.trim().split(/\s+/);
          fields.contacts = client.contacts.map(contact => contact.isPrimary ? {
            ...contact,
            ...(selected.contactName ? { firstName: parts[0], lastName: parts.slice(1).join(" ") } : {}),
            ...(selected.email ? { email: review.email.trim() } : {}),
          } : contact);
        }
        if (Object.keys(fields).length) updateClient(client.id, fields);
        linked = { ...client, ...fields };
      }
      const fields: Partial<Project> = {};
      if (!existing || selected.projectName) fields.name = name;
      if (!existing || selected.budget) fields.budget = budget;
      if (!existing || selected.startDate) fields.startDate = startDate;
      if (!existing || selected.dueDate) fields.dueDate = dueDate;
      if (changeLink) Object.assign(fields, { clientId: linked?.id, clientName: linked?.companyName ?? "Internal", clientEmail: linked?.email });
      let target = existing;
      if (existing) {
        if (attach) fields.documents = [...(existing.documents ?? []), document];
        if (Object.keys(fields).length) updateProject(existing.id, fields);
      } else {
        target = createProject({ name, budget, startDate, dueDate, clientId: linked?.id, clientName: linked?.companyName ?? "Internal", clientEmail: linked?.email, description: `Imported from ${source}.`, status: "Planning", priority: "Medium", technology: [] });
        if (attach) updateProject(target.id, { documents: [document] });
      }
      billing.forEach(b => addInvoice({ projectId: target!.id, description: b.description.trim(), amount: Number(b.amount), sendDate: b.sendDate, dueDate: b.dueDate, trigger: "", status: "Planned" }));
      setApplied(target!.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not apply this import."); }
    finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-semibold">Documents</h1>
      <DocumentLibrary projects={projects} />
      <h2 id="document-import" className="scroll-mt-6 text-2xl font-semibold">Import a document</h2>
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
              setSelectedFile(file);
              setSaveFile(true);
              setText("");
              setSource(file.name);
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
          PDF, DOCX, TXT, or Markdown · up to 3 MB · PDFs up to 30 pages. Choose whether to save the original file and extracted text with the project. Cloud files use private storage; demo files stay in this browser.
        </p>
        <label className="mt-5 block">
          Document text
          <textarea
            rows={10}
            disabled={busy}
            value={text}
            maxLength={100000}
            onChange={(e) => {
              setText(e.target.value);
              setReview(null);
              if (!selectedFile) setSource("Pasted document");
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
            Wait for saving to finish. Only your selected changes and attachments were applied.
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
            <fieldset disabled={busy}>
            <h2 className="text-xl font-semibold">Review changes</h2>
            <p className="mt-2 text-sm text-[#71756e]">For an existing project, check only the fields you want to replace. Unchecked values stay as they are. You can also save a document without updating any fields.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                Project destination
                <select
                  aria-label="Project destination"
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setIncludeInvoices(Object.fromEntries(review.billing.map((_, i) => [i, !e.target.value])));
                    if (!e.target.value) setSelected({ projectName: true, budget: true, startDate: true, dueDate: true, clientLink: true });
                    const p = projects.find((p) => p.id === e.target.value);
                    if (p) {
                      const linkedClient = clients.find(
                        (c) =>
                          c.id === p.clientId ||
                          (!p.clientId && c.companyName === p.clientName),
                      );
                      setClientId(linkedClient?.id ?? "__internal__");
                      setSelected({});
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
                {projectId && <span className="mr-2"><input aria-label="Update project client link" type="checkbox" checked={!!selected.clientLink} onChange={e => setSelected({ ...selected, clientLink: e.target.checked })} /> Update </span>}
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
                  {(["clientName", "contactName", "email"].includes(key) ? clientId !== "__new__" : Boolean(projectId)) && <span className="mr-2"><input type="checkbox" aria-label={`Update ${label}`} checked={!!selected[key]} onChange={e => setSelected({ ...selected, [key]: e.target.checked })} /> Update </span>}
                  {label}
                  <input
                    aria-label={label}
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
            <div className="mt-5 space-y-3 rounded-xl border p-4">
              <h3 className="font-semibold">Save attachments</h3>
              {selectedFile && <label className="block text-sm"><input type="checkbox" checked={saveFile} onChange={e => setSaveFile(e.target.checked)} /> Save original file: {selectedFile.name}</label>}
              <label className="block text-sm"><input type="checkbox" checked={saveText} onChange={e => setSaveText(e.target.checked)} /> Save extracted or pasted text</label>
              <p className="text-xs text-[#71756e]">Original files will appear in the project&apos;s Documents section with a download button.</p>
            </div>
            <h3 className="mt-6 font-semibold">
              Invoice suggestions · {review.billing.length}
            </h3>
            <p className="mt-1 text-sm text-[#71756e]">
              Check only the invoices you want to create, then enter their dates. Nothing is sent.
            </p>
            {review.billing.map((b, index) => (
              <div
                key={index}
                className="mt-3 grid gap-3 rounded-xl border p-3 sm:grid-cols-2"
              >
                <label className="text-sm sm:col-span-2"><input type="checkbox" checked={!!includeInvoices[index]} onChange={e => setIncludeInvoices({ ...includeInvoices, [index]: e.target.checked })} /> Create this invoice</label>
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
                      aria-label={label}
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

              </div>
            ))}
            <button
              disabled={busy}
              onClick={apply}
              className="mt-6 rounded-xl bg-[#171918] px-5 py-3 text-white"
            >
              {busy ? "Saving document…" : "Apply reviewed changes"}
            </button>
            </fieldset>
          </section>
        )
      )}
    </div>
  );
}
