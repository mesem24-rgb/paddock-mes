import type { BusinessClient, Project } from "@/types";
export const INTERNAL_CLIENT = "__internal__";
export interface ClientOption {
  id: string;
  name: string;
  email: string;
}
export function clientOptions(clients: BusinessClient[]): ClientOption[] {
  return [
    { id: INTERNAL_CLIENT, name: "Internal", email: "" },
    ...clients
      .filter((c) => c.status !== "Archived")
      .map((c) => ({ id: c.id, name: c.companyName, email: c.email })),
  ];
}
export function projectBelongsToClient(
  project: Project,
  client: BusinessClient,
) {
  return project.clientId
    ? project.clientId === client.id
    : project.clientName.trim().toLowerCase() ===
        client.companyName.trim().toLowerCase();
}
