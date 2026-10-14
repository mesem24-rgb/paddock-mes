"use client";
import { useProjects } from "@/context/ProjectContext";
import { useClients } from "@/context/ClientContext";
import { useInvoices } from "@/context/InvoiceContext";
import { cloudConfigured } from "@/lib/supabase/client";
export default function StorageStatus() {
  const projects = useProjects(),
    clients = useClients(),
    invoices = useInvoices();
  const collections = [
    { name: "Projects", ...projects },
    { name: "Clients", ...clients },
    { name: "Invoices", ...invoices },
  ];
  const errors = collections.filter((c) => c.error);
  const pending = collections.reduce((n, c) => n + c.pending, 0);
  return (
    <aside
      className="mb-5 rounded-xl border bg-white p-3 text-sm"
      aria-live="polite"
    >
      {errors.length ? (
        <>
          <p className="font-semibold text-red-700">
            Saving paused. Keep this page open and download a backup before
            refreshing.
          </p>
          {errors.map((c) => (
            <div key={c.name} className="mt-2">
              <p>
                {c.name}: {c.error}
              </p>
              <button onClick={c.exportRecords} className="mt-1 underline">
                Download {c.name.toLowerCase()} backup
              </button>
            </div>
          ))}
        </>
      ) : (
        <p>
          {pending
            ? "Saving changes…"
            : cloudConfigured
              ? "Cloud workspace connected. Refresh to load changes made on another device."
              : "Saved in this browser. Cloud storage is not connected."}
        </p>
      )}
    </aside>
  );
}
