"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  StickyNote,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import StatusBadge from "@/components/shared/StatusBadge";
import { useClients } from "@/context/ClientContext";
import { useProjects } from "@/context/ProjectContext";
import type {
  BusinessClient,
  ClientSource,
  ClientStatus,
} from "@/types";

interface ClientWorkspaceProps {
  clientId: string;
}

interface EditClientValues {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  location: string;
  status: ClientStatus;
  source: ClientSource;
  description: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function createEditValues(
  client: BusinessClient,
): EditClientValues {
  return {
    companyName: client.companyName,
    contactName: client.contactName,
    email: client.email,
    phone: client.phone ?? "",
    website: client.website ?? "",
    industry: client.industry ?? "",
    location: client.location ?? "",
    status: client.status,
    source: client.source,
    description: client.description ?? "",
  };
}

export default function ClientWorkspace({
  clientId,
}: ClientWorkspaceProps) {
  const router = useRouter();

  const {
    getClientById,
    updateClient,
    deleteClient,
    addClientNote,
    isLoaded,
  } = useClients();

  const { projects } = useProjects();

  const client = getClientById(clientId);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] =
    useState<EditClientValues | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [error, setError] = useState("");

  const linkedProjects = useMemo(() => {
    if (!client) {
      return [];
    }

    return projects.filter(
      (project) =>
        project.clientName.trim().toLowerCase() ===
        client.companyName.trim().toLowerCase(),
    );
  }, [client, projects]);

  const accountMetrics = useMemo(() => {
    const totalValue = linkedProjects.reduce(
      (sum, project) => sum + project.budget,
      0,
    );

    const amountPaid = linkedProjects.reduce(
      (sum, project) => sum + project.amountPaid,
      0,
    );

    const outstanding = linkedProjects.reduce(
      (sum, project) =>
        sum +
        Math.max(
          project.budget - project.amountPaid,
          0,
        ),
      0,
    );

    const activeProjects = linkedProjects.filter(
      (project) =>
        project.status !== "Completed" &&
        project.status !== "On Hold",
    ).length;

    return {
      totalValue,
      amountPaid,
      outstanding,
      activeProjects,
    };
  }, [linkedProjects]);

  function beginEditing() {
    if (!client) {
      return;
    }

    setEditValues(createEditValues(client));
    setError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setEditValues(null);
    setError("");
    setIsEditing(false);
  }

  function updateEditValue<
    Key extends keyof EditClientValues,
  >(
    key: Key,
    value: EditClientValues[Key],
  ) {
    setEditValues((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: value,
      };
    });
  }

  function handleSaveClient(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!client || !editValues) {
      return;
    }

    setError("");

    if (!editValues.companyName.trim()) {
      setError("Enter a company or client name.");
      return;
    }

    if (!editValues.contactName.trim()) {
      setError("Enter the primary contact name.");
      return;
    }

    if (!editValues.email.trim()) {
      setError("Enter an email address.");
      return;
    }

    if (
      editValues.website &&
      !editValues.website.startsWith("http://") &&
      !editValues.website.startsWith("https://")
    ) {
      setError(
        "Website URLs must begin with http:// or https://.",
      );
      return;
    }

    const existingPrimaryContact =
      client.contacts.find(
        (contact) => contact.isPrimary,
      );

    const nameParts = editValues.contactName
      .trim()
      .split(/\s+/);

    const firstName = nameParts[0] || "Primary";
    const lastName = nameParts.slice(1).join(" ");

    const updatedContacts =
      client.contacts.length > 0
        ? client.contacts.map((contact) =>
            contact.isPrimary
              ? {
                  ...contact,
                  firstName,
                  lastName,
                  email: editValues.email.trim(),
                  phone:
                    editValues.phone.trim() ||
                    undefined,
                }
              : contact,
          )
        : [
            {
              id:
                existingPrimaryContact?.id ??
                `contact-${Date.now()}`,
              firstName,
              lastName,
              email: editValues.email.trim(),
              phone:
                editValues.phone.trim() || undefined,
              isPrimary: true,
            },
          ];

    updateClient(client.id, {
      companyName: editValues.companyName.trim(),
      contactName: editValues.contactName.trim(),
      email: editValues.email.trim(),
      phone: editValues.phone.trim() || undefined,
      website:
        editValues.website.trim() || undefined,
      industry:
        editValues.industry.trim() || undefined,
      location:
        editValues.location.trim() || undefined,
      status: editValues.status,
      source: editValues.source,
      description:
        editValues.description.trim() || undefined,
      contacts: updatedContacts,
    });

    setEditValues(null);
    setIsEditing(false);
  }

  function handleAddNote(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!client) {
      return;
    }

    const trimmedNote = noteContent.trim();

    if (!trimmedNote) {
      return;
    }

    addClientNote(client.id, trimmedNote);
    setNoteContent("");
  }

  function handleDeleteClient() {
    if (!client) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${client.companyName}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    deleteClient(client.id);
    router.push("/clients");
  }

  if (!isLoaded) {
    return <ClientWorkspaceLoading />;
  }

  if (!client) {
    return <ClientNotFound />;
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/clients"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[#6f736c] transition hover:text-[#20231f]"
        >
          <ArrowLeft size={17} />
          Back to clients
        </Link>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/projects/new?client=${encodeURIComponent(
              client.companyName,
            )}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a2d2a]"
          >
            <Plus size={16} />
            Create project
          </Link>

          <button
            type="button"
            onClick={beginEditing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dedfd9] bg-white px-4 py-2.5 text-sm font-medium text-[#4f534c] transition hover:bg-[#f7f7f3]"
          >
            <Pencil size={16} />
            Edit client
          </button>

          <button
            type="button"
            onClick={handleDeleteClient}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-[#dedfd9] bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge value={client.status} />

              <span className="rounded-full border border-[#dedfd9] bg-[#f8f8f4] px-2.5 py-1 text-xs font-medium text-[#74786f]">
                {client.source}
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#20231f] sm:text-4xl">
              {client.companyName}
            </h1>

            <p className="mt-2 text-sm font-medium text-[#74786f]">
              {client.contactName}
            </p>

            {client.description && (
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#6f736c]">
                {client.description}
              </p>
            )}
          </div>

          <div className="min-w-72 space-y-3 rounded-2xl border border-[#e4e5df] bg-[#fafaf7] p-5">
            <ContactRow
              icon={Mail}
              label="Email"
              value={client.email}
              href={`mailto:${client.email}`}
            />

            {client.phone && (
              <ContactRow
                icon={Phone}
                label="Phone"
                value={client.phone}
                href={`tel:${client.phone}`}
              />
            )}

            {client.location && (
              <ContactRow
                icon={MapPin}
                label="Location"
                value={client.location}
              />
            )}

            {client.industry && (
              <ContactRow
                icon={Building2}
                label="Industry"
                value={client.industry}
              />
            )}

            {client.website && (
              <ContactRow
                icon={ExternalLink}
                label="Website"
                value="Open website"
                href={client.website}
                external
              />
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total project value"
          value={formatCurrency(
            accountMetrics.totalValue,
          )}
          supportingText={`${linkedProjects.length} linked ${
            linkedProjects.length === 1
              ? "project"
              : "projects"
          }`}
          icon={CircleDollarSign}
        />

        <MetricCard
          label="Amount paid"
          value={formatCurrency(
            accountMetrics.amountPaid,
          )}
          supportingText="Collected revenue"
          icon={CircleDollarSign}
        />

        <MetricCard
          label="Outstanding"
          value={formatCurrency(
            accountMetrics.outstanding,
          )}
          supportingText="Remaining balance"
          icon={CircleDollarSign}
        />

        <MetricCard
          label="Active projects"
          value={String(
            accountMetrics.activeProjects,
          )}
          supportingText="Currently in progress"
          icon={BriefcaseBusiness}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <section className="rounded-2xl border border-[#dedfd9] bg-white">
          <div className="flex items-center justify-between border-b border-[#ecece6] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-[#20231f]">
                Linked projects
              </h2>

              <p className="mt-1 text-xs text-[#898d85]">
                Projects associated with this client.
              </p>
            </div>

            <Link
              href={`/projects/new?client=${encodeURIComponent(
                client.companyName,
              )}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#555951] transition hover:text-black"
            >
              <Plus size={15} />
              Add project
            </Link>
          </div>

          {linkedProjects.length > 0 ? (
            <div className="divide-y divide-[#ecece6]">
              {linkedProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex flex-col gap-5 px-5 py-5 transition hover:bg-[#fafaf7] sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#30332e] transition group-hover:text-black">
                        {project.name}
                      </h3>

                      <StatusBadge
                        value={project.status}
                      />
                    </div>

                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-[#777b73]">
                      {project.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#8b8f87]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        Due {formatDate(project.dueDate)}
                      </span>

                      <span>
                        {formatCurrency(project.budget)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full shrink-0 lg:w-44">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b8f87]">
                        Progress
                      </span>

                      <span className="font-semibold text-[#4f534c]">
                        {project.progress}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8e9e3]">
                      <div
                        className="h-full rounded-full bg-[#30332e]"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              project.progress,
                              0,
                            ),
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyProjects
              clientName={client.companyName}
            />
          )}
        </section>

        <section className="rounded-2xl border border-[#dedfd9] bg-white">
          <div className="border-b border-[#ecece6] px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-[#20231f]">
              Client notes
            </h2>

            <p className="mt-1 text-xs text-[#898d85]">
              Keep relationship details and follow-ups
              together.
            </p>
          </div>

          <form
            onSubmit={handleAddNote}
            className="border-b border-[#ecece6] p-5 sm:p-6"
          >
            <textarea
              rows={4}
              value={noteContent}
              onChange={(event) =>
                setNoteContent(event.target.value)
              }
              placeholder="Add a note about this client..."
              className="min-h-28 w-full resize-none rounded-xl border border-[#dedfd9] bg-[#fafaf7] px-3.5 py-3 text-sm text-[#292c28] outline-none transition placeholder:text-[#a0a39c] focus:border-[#777b72] focus:bg-white"
            />

            <button
              type="submit"
              disabled={!noteContent.trim()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a2d2a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={16} />
              Add note
            </button>
          </form>

          {client.notes.length > 0 ? (
            <div className="max-h-[520px] divide-y divide-[#ecece6] overflow-y-auto">
              {client.notes.map((note) => (
                <article
                  key={note.id}
                  className="px-5 py-5 sm:px-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef0e8] text-[#656961]">
                      <StickyNote size={16} />
                    </div>

                    <div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[#565a53]">
                        {note.content}
                      </p>

                      <p className="mt-2 text-xs text-[#989c94]">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <StickyNote
                size={30}
                className="mx-auto text-[#a0a39c]"
              />

              <p className="mt-3 text-sm font-medium text-[#5f635b]">
                No client notes yet
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[#dedfd9] bg-white">
        <div className="border-b border-[#ecece6] px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-[#20231f]">
            Account details
          </h2>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <DetailItem
            label="Primary contact"
            value={client.contactName}
          />

          <DetailItem
            label="Relationship source"
            value={client.source}
          />

          <DetailItem
            label="Created"
            value={formatDate(client.createdAt)}
          />

          <DetailItem
            label="Last updated"
            value={formatDate(client.updatedAt)}
          />
        </div>
      </section>

      {isEditing && editValues && (
        <EditClientModal
          values={editValues}
          error={error}
          onClose={cancelEditing}
          onSubmit={handleSaveClient}
          onChange={updateEditValue}
        />
      )}
    </div>
  );
}

interface EditClientModalProps {
  values: EditClientValues;
  error: string;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onChange: <
    Key extends keyof EditClientValues,
  >(
    key: Key,
    value: EditClientValues[Key],
  ) => void;
}

function EditClientModal({
  values,
  error,
  onClose,
  onSubmit,
  onChange,
}: EditClientModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#dedfd9] bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ecece6] bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[#20231f]">
              Edit client
            </h2>

            <p className="mt-1 text-xs text-[#898d85]">
              Update relationship and contact details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777b73] transition hover:bg-[#f1f2ec]"
            aria-label="Close edit client modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormField label="Company name">
            <input
              required
              value={values.companyName}
              onChange={(event) =>
                onChange(
                  "companyName",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Primary contact">
            <input
              required
              value={values.contactName}
              onChange={(event) =>
                onChange(
                  "contactName",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Email">
            <input
              required
              type="email"
              value={values.email}
              onChange={(event) =>
                onChange("email", event.target.value)
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Phone">
            <input
              type="tel"
              value={values.phone}
              onChange={(event) =>
                onChange("phone", event.target.value)
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Website">
            <input
              type="url"
              value={values.website}
              onChange={(event) =>
                onChange(
                  "website",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Industry">
            <input
              value={values.industry}
              onChange={(event) =>
                onChange(
                  "industry",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Location">
            <input
              value={values.location}
              onChange={(event) =>
                onChange(
                  "location",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Status">
            <select
              value={values.status}
              onChange={(event) =>
                onChange(
                  "status",
                  event.target.value as ClientStatus,
                )
              }
              className={inputClass}
            >
              <option>Lead</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Archived</option>
            </select>
          </FormField>

          <FormField label="Source">
            <select
              value={values.source}
              onChange={(event) =>
                onChange(
                  "source",
                  event.target.value as ClientSource,
                )
              }
              className={inputClass}
            >
              <option>Referral</option>
              <option>Website</option>
              <option>LinkedIn</option>
              <option>Existing Network</option>
              <option>Cold Outreach</option>
              <option>Other</option>
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Description">
              <textarea
                rows={5}
                value={values.description}
                onChange={(event) =>
                  onChange(
                    "description",
                    event.target.value,
                  )
                }
                className={`${inputClass} min-h-32 py-3`}
              />
            </FormField>
          </div>

          {error && (
            <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#ecece6] bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dedfd9] px-4 py-2.5 text-sm font-medium text-[#62665e]"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-2.5 text-sm font-medium text-white"
          >
            <Save size={16} />
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  supportingText: string;
  icon: typeof CircleDollarSign;
}

function MetricCard({
  label,
  value,
  supportingText,
  icon: Icon,
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-[#dedfd9] bg-white p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef0e8] text-[#656961]">
        <Icon size={18} />
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.13em] text-[#92968e]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-[#292c28]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#898d85]">
        {supportingText}
      </p>
    </article>
  );
}

interface ContactRowProps {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  external = false,
}: ContactRowProps) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#777b73]">
        <Icon size={16} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#999d95]">
          {label}
        </p>

        <p className="truncate text-sm font-medium text-[#50544d]">
          {value}
        </p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={
        external
          ? "noreferrer noopener"
          : undefined
      }
      className="block rounded-xl transition hover:bg-[#f1f2ec]"
    >
      {content}
    </a>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#959991]">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-[#444841]">
        {value}
      </p>
    </div>
  );
}

function EmptyProjects({
  clientName,
}: {
  clientName: string;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <BriefcaseBusiness
        size={34}
        className="mx-auto text-[#a0a39c]"
      />

      <h3 className="mt-4 font-semibold text-[#30332e]">
        No linked projects
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#81857d]">
        Create a project for {clientName} to connect
        project progress, value, and payments to this
        account.
      </p>

      <Link
        href={`/projects/new?client=${encodeURIComponent(
          clientName,
        )}`}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-2.5 text-sm font-medium text-white"
      >
        <Plus size={16} />
        Create project
      </Link>
    </div>
  );
}

function ClientNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Building2
          size={42}
          className="mx-auto text-[#999d95]"
        />

        <h1 className="mt-4 text-2xl font-semibold text-[#20231f]">
          Client not found
        </h1>

        <p className="mt-2 text-sm text-[#81857d]">
          This client may have been deleted.
        </p>

        <Link
          href="/clients"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-3 text-sm font-medium text-white"
        >
          <ArrowLeft size={17} />
          Return to clients
        </Link>
      </div>
    </div>
  );
}

function ClientWorkspaceLoading() {
  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="h-10 w-40 animate-pulse rounded-lg bg-white" />

      <div className="mt-6 h-72 animate-pulse rounded-2xl bg-white" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl bg-white"
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#3d403b]">
        {label}
      </span>

      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#dedfd9] bg-[#fafaf7] px-3.5 text-sm text-[#292c28] outline-none transition placeholder:text-[#a0a39c] focus:border-[#777b72] focus:bg-white";