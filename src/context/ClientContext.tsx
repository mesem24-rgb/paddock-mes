"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialClients } from "@/data/clients";
import type {
  BusinessClient,
  ClientNote,
} from "@/types";

const STORAGE_KEY = "paddock-clients";

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
  createClient: (
    input: CreateClientInput,
  ) => BusinessClient;
  updateClient: (
    clientId: string,
    updates: Partial<BusinessClient>,
  ) => void;
  deleteClient: (clientId: string) => void;
  getClientById: (
    clientId: string,
  ) => BusinessClient | undefined;
  addClientNote: (
    clientId: string,
    content: string,
  ) => void;
}

const ClientContext =
  createContext<ClientContextValue | null>(null);

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createClientId(
  companyName: string,
  existingClients: BusinessClient[],
) {
  const baseId =
    createSlug(companyName) || `client-${Date.now()}`;

  const alreadyExists = existingClients.some(
    (client) => client.id === baseId,
  );

  return alreadyExists
    ? `${baseId}-${Date.now()}`
    : baseId;
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

export function ClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [clients, setClients] =
    useState<BusinessClient[]>(initialClients);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedClients =
        window.localStorage.getItem(STORAGE_KEY);

      if (storedClients) {
        const parsedClients = JSON.parse(
          storedClients,
        ) as BusinessClient[];

        setClients(parsedClients);
      }
    } catch (error) {
      console.error(
        "Unable to load clients from local storage.",
        error,
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(clients),
      );
    } catch (error) {
      console.error(
        "Unable to save clients to local storage.",
        error,
      );
    }
  }, [clients, isLoaded]);

  const createClient = useCallback(
    (input: CreateClientInput) => {
      const now = new Date().toISOString();
      const { firstName, lastName } =
        splitContactName(input.contactName);

      let createdClient: BusinessClient | null = null;

      setClients((currentClients) => {
        createdClient = {
          id: createClientId(
            input.companyName,
            currentClients,
          ),
          companyName: input.companyName.trim(),
          contactName: input.contactName.trim(),
          email: input.email.trim(),
          phone: input.phone?.trim() || undefined,
          website: input.website?.trim() || undefined,
          industry:
            input.industry?.trim() || undefined,
          location:
            input.location?.trim() || undefined,
          status: input.status,
          source: input.source,
          description:
            input.description?.trim() || undefined,
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

        return [...currentClients, createdClient];
      });

      if (!createdClient) {
        throw new Error("Unable to create client.");
      }

      return createdClient;
    },
    [],
  );

  const updateClient = useCallback(
    (
      clientId: string,
      updates: Partial<BusinessClient>,
    ) => {
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
    [],
  );

  const deleteClient = useCallback(
    (clientId: string) => {
      setClients((currentClients) =>
        currentClients.filter(
          (client) => client.id !== clientId,
        ),
      );
    },
    [],
  );

  const getClientById = useCallback(
    (clientId: string) =>
      clients.find((client) => client.id === clientId),
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
    [],
  );

  const value = useMemo(
    () => ({
      clients,
      isLoaded,
      createClient,
      updateClient,
      deleteClient,
      getClientById,
      addClientNote,
    }),
    [
      clients,
      isLoaded,
      createClient,
      updateClient,
      deleteClient,
      getClientById,
      addClientNote,
    ],
  );

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);

  if (!context) {
    throw new Error(
      "useClients must be used inside ClientProvider.",
    );
  }

  return context;
}