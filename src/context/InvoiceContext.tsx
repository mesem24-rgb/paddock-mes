"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
export interface Invoice {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  sendDate: string;
  dueDate: string;
  trigger: string;
  status: "Planned" | "Sent" | "Paid";
}
const Context = createContext<{
  invoices: Invoice[];
  isLoaded: boolean;
  addInvoice: (invoice: Omit<Invoice, "id">) => void;
  updateInvoice: (id: string, status: Invoice["status"]) => void;
} | null>(null);
export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoaded, setLoaded] = useState(false);
  useEffect(() => {
    // Hydrate browser persistence after mount to keep server rendering consistent.
    try {
      const saved = localStorage.getItem("paddock-invoices");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (i) =>
              i &&
              typeof i.id === "string" &&
              typeof i.projectId === "string" &&
              typeof i.description === "string" &&
              typeof i.trigger === "string" &&
              typeof i.amount === "number" &&
              typeof i.sendDate === "string" &&
              typeof i.dueDate === "string" &&
              ["Planned", "Sent", "Paid"].includes(i.status),
          )
        )
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser storage after mount.
          setInvoices(parsed);
      }
    } catch (error) {
      console.error("Unable to load invoices.", error);
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("paddock-invoices", JSON.stringify(invoices));
      } catch (error) {
        console.error("Unable to save invoices.", error);
      }
    }
  }, [invoices, isLoaded]);
  return (
    <Context.Provider
      value={{
        invoices,
        isLoaded,
        addInvoice: (invoice) =>
          setInvoices((current) => [
            ...current,
            { ...invoice, id: crypto.randomUUID() },
          ]),
        updateInvoice: (id, status) =>
          setInvoices((current) =>
            current.map((i) => (i.id === id ? { ...i, status } : i)),
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
