"use client";

import { useStoredCollection } from "@/lib/useStoredCollection";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { initialClients } from "@/data/clients";
import type { BusinessClient, ClientNote } from "@/types";

export interface CreateClientInput {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  location?: string;
  status: BusinessClient["status"];
  source: BusinessClient["source"];
  description?: string;
}

interface ClientContextValue {
  clients: BusinessClient[];
  isLoaded: boolean;
  error: string;
  pending: number;
  exportRecords: () => void;
  importLocal: () => void;
  createClient: (input: CreateClientInput) => BusinessClient;
  updateClient: (clientId: string, updates: Partial<BusinessClient>) => void;
  deleteClient: (clientId: string) => void;
  getClientById: (clientId: string) => BusinessClient | undefined;
  addClientNote: (clientId: string, content: string) => void;
  completeFollowUp: (clientId: string) => void;
}

const ClientContext = createContext<ClientContextValue | null>(null);

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitContactName(contactName: string) {
  const parts = contactName.trim().split(/\s+/);
  const firstName = parts[0] || "Primary";
  const lastName = parts.slice(1).join(" ");

  return {
    firstName,
    lastName,
  };
}

export function ClientProvider({ children }: { children: ReactNode }) {
  const {
    records: clients,
    setRecords: setClients,
    isLoaded,
    error,
    pending,
    exportRecords,
    importLocal,
  } = useStoredCollection<BusinessClient>("clients", initialClients);

  const createClient = useCallback(
    (input: CreateClientInput) => {
      const now = new Date().toISOString();
      const { firstName, lastName } = splitContactName(input.contactName);

      const createdClient: BusinessClient = {
        id: `${createSlug(input.companyName) || "client"}-${crypto.randomUUID()}`,
        companyName: input.companyName.trim(),
        contactName: input.contactName.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || undefined,
        website: input.website?.trim() || undefined,
        industry: input.industry?.trim() || undefined,
        location: input.location?.trim() || undefined,
        status: input.status,
        source: input.source,
        description: input.description?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
        contacts: [
          {
            id: `contact-${Date.now()}`,
            firstName,
            lastName,
            email: input.email.trim(),
            phone: input.phone?.trim() || undefined,
            isPrimary: true,
          },
        ],
        notes: [],
      };
      setClients((current) => [...current, createdClient]);

      return createdClient;
    },
    [setClients],
  );

  const updateClient = useCallback(
    (clientId: string, updates: Partial<BusinessClient>) => {
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.id === clientId
            ? {
                ...client,
                ...updates,
                id: client.id,
                updatedAt: new Date().toISOString(),
              }
            : client,
        ),
      );
    },
    [setClients],
  );

  const deleteClient = useCallback(
    (clientId: string) => {
      setClients((currentClients) =>
        currentClients.filter((client) => client.id !== clientId),
      );
    },
    [setClients],
  );

  const getClientById = useCallback(
    (clientId: string) => clients.find((client) => client.id === clientId),
    [clients],
  );

  const addClientNote = useCallback(
    (clientId: string, content: string) => {
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return;
      }

      const note: ClientNote = {
        id: `note-${Date.now()}`,
        content: trimmedContent,
        createdAt: new Date().toISOString(),
      };

      setClients((currentClients) =>
        currentClients.map((client) =>
          client.id === clientId
            ? {
                ...client,
                updatedAt: new Date().toISOString(),
                notes: [note, ...client.notes],
              }
            : client,
        ),
      );
    },
    [setClients],
  );

  const completeFollowUp = useCallback(
    (clientId: string) => {
      setClients((current) =>
        current.map((client) => {
          if (client.id !== clientId || !client.followUpDate) return client;
          const now = new Date().toISOString();
          return {
            ...client,
            followUpDate: "",
            followUpAction: "",
            updatedAt: now,
            notes: [
              {
                id: `note-${crypto.randomUUID()}`,
                content: `Follow-up completed: ${client.followUpAction || "Client check-in"}`,
                createdAt: now,
              },
              ...client.notes,
            ],
          };
        }),
      );
    },
    [setClients],
  );

  const value = useMemo(
    () => ({
      clients,
      isLoaded,
      error,
      pending,
      exportRecords,
      importLocal,
      createClient,
      updateClient,
      deleteClient,
      getClientById,
      addClientNote,
      completeFollowUp,
    }),
    [
      clients,
      isLoaded,
      error,
      pending,
      exportRecords,
      importLocal,
      createClient,
      updateClient,
      deleteClient,
      getClientById,
      addClientNote,
      completeFollowUp,
    ],
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);

  if (!context) {
    throw new Error("useClients must be used inside ClientProvider.");
  }

  return context;
}
