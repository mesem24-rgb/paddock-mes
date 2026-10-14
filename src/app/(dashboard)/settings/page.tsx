"use client";
import { useProjects } from "@/context/ProjectContext";
import { useClients } from "@/context/ClientContext";
import { useInvoices } from "@/context/InvoiceContext";
import { cloudConfigured } from "@/lib/supabase/client";
export default function SettingsPage() {
  const projects = useProjects(),
    clients = useClients(),
    invoices = useInvoices();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Workspace data</h1>
      <p className="my-4">
        Download backups of your current records. When connecting cloud storage,
        import each collection from the browser where you previously used
        Paddock.
      </p>
      {[
        { name: "Projects", count: projects.projects.length, ...projects },
        { name: "Clients", count: clients.clients.length, ...clients },
        { name: "Invoices", count: invoices.invoices.length, ...invoices },
      ].map((c) => (
        <section key={c.name} className="mb-4 rounded-xl border bg-white p-5">
          <h2 className="font-semibold">
            {c.name} · {c.count} records
          </h2>
          <button
            disabled={!c.isLoaded}
            onClick={c.exportRecords}
            className="mt-3 rounded-lg border px-4 py-2"
          >
            Download backup
          </button>
          {cloudConfigured && (
            <button
              disabled={
                !c.isLoaded || c.count > 0 || c.pending > 0 || Boolean(c.error)
              }
              onClick={c.importLocal}
              className="ml-3 mt-3 rounded-lg border px-4 py-2 disabled:opacity-50"
            >
              Import this browser&apos;s records
            </button>
          )}
          {cloudConfigured && (
            <p className="mt-3 text-sm text-[#71756e]">
              Import is available only when this cloud collection is empty.
              Review the browser backup before importing; it may include sample
              records.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
