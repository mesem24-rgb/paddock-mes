"use client";
import { createContext, useContext, type ReactNode } from "react";
import { scheduleNextMonthlyInvoice } from "@/lib/recurringInvoices";
import { useStoredCollection } from "@/lib/useStoredCollection";
export interface Invoice {
  milestoneId?: string;
  recurrence?: "Monthly";
  billingDay?: number;
  sourceInvoiceId?: string;
  nextInvoiceId?: string;
  id: string;
  projectId: string;
  description: string;
  amount: number;
  sendDate: string;
  dueDate: string;
  trigger: string;
  status: "Planned" | "Sent" | "Paid";
}
const initialInvoices: Invoice[] = [];
const Context = createContext<{
  invoices: Invoice[];
  isLoaded: boolean;
  error: string;
  pending: number;
  exportRecords: () => void;
  importLocal: () => void;
  scheduleNextInvoice: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, "id">) => void;
  updateInvoice: (
    id: string,
    updates: Invoice["status"] | Partial<Omit<Invoice, "id">>,
  ) => void;
} | null>(null);
export function InvoiceProvider({ children }: { children: ReactNode }) {
  const {
    records: invoices,
    setRecords,
    isLoaded,
    error,
    pending,
    exportRecords,
    importLocal,
  } = useStoredCollection<Invoice>("invoices", initialInvoices);
  return (
    <Context.Provider
      value={{
        invoices,
        isLoaded,
        error,
        pending,
        exportRecords,
        importLocal,
        scheduleNextInvoice: (id) =>
          setRecords((current) => scheduleNextMonthlyInvoice(current, id)),
        addInvoice: (invoice) =>
          setRecords((current) => [
            ...current,
            { ...invoice, id: crypto.randomUUID() },
          ]),
        updateInvoice: (id, updates) =>
          setRecords((current) =>
            current.map((i) =>
              i.id === id
                ? {
                    ...i,
                    ...(typeof updates === "string"
                      ? { status: updates }
                      : updates),
                    id: i.id,
                  }
                : i,
            ),
          ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useInvoices() {
  const context = useContext(Context);
  if (!context) throw new Error("InvoiceProvider is required.");
  return context;
}
