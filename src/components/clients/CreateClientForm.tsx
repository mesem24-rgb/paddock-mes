"use client";

import {
  ArrowLeft,
  Building2,
  Save,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
} from "react";
import {
  useClients,
  type CreateClientInput,
} from "@/context/ClientContext";
import type {
  ClientSource,
  ClientStatus,
} from "@/types";

const initialValues: CreateClientInput = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  industry: "",
  location: "",
  status: "Lead",
  source: "Referral",
  description: "",
};

export default function CreateClientForm() {
  const router = useRouter();
  const { createClient } = useClients();

  const [values, setValues] =
    useState<CreateClientInput>(initialValues);
  const [error, setError] = useState("");

  function updateValue<
    Key extends keyof CreateClientInput,
  >(key: Key, value: CreateClientInput[Key]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!values.companyName.trim()) {
      setError("Enter a company or client name.");
      return;
    }

    if (!values.contactName.trim()) {
      setError("Enter the primary contact name.");
      return;
    }

    if (!values.email.trim()) {
      setError("Enter a contact email address.");
      return;
    }

    if (
      values.website &&
      !values.website.startsWith("http://") &&
      !values.website.startsWith("https://")
    ) {
      setError(
        "Website URLs must begin with http:// or https://.",
      );
      return;
    }

    const client = createClient(values);
    router.push(`/clients/${client.id}`);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#6f736c] transition hover:text-[#20231f]"
      >
        <ArrowLeft size={17} />
        Back to clients
      </Link>

      <section className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#858981]">
          New relationship
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20231f]">
          Create client
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#74786f]">
          Add a client or prospective client to Paddock.
          Projects, notes, invoices, and documents will
          connect to this account.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]"
      >
        <div className="space-y-6">
          <FormSection
            title="Company information"
            description="Basic details about the organization."
            icon={Building2}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Company or client name">
                <input
                  required
                  value={values.companyName}
                  onChange={(event) =>
                    updateValue(
                      "companyName",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="Acme Company"
                />
              </FormField>

              <FormField label="Industry">
                <input
                  value={values.industry}
                  onChange={(event) =>
                    updateValue(
                      "industry",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="Professional services"
                />
              </FormField>

              <FormField label="Website">
                <input
                  type="url"
                  value={values.website}
                  onChange={(event) =>
                    updateValue(
                      "website",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="https://example.com"
                />
              </FormField>

              <FormField label="Location">
                <input
                  value={values.location}
                  onChange={(event) =>
                    updateValue(
                      "location",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="Gulfport, MS"
                />
              </FormField>

              <FormField label="Relationship status">
                <select
                  value={values.status}
                  onChange={(event) =>
                    updateValue(
                      "status",
                      event.target
                        .value as ClientStatus,
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
                    updateValue(
                      "source",
                      event.target
                        .value as ClientSource,
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
                <FormField label="Client description">
                  <textarea
                    rows={5}
                    value={values.description}
                    onChange={(event) =>
                      updateValue(
                        "description",
                        event.target.value,
                      )
                    }
                    className={`${inputClass} min-h-32 py-3`}
                    placeholder="Describe the client, opportunity, or relationship."
                  />
                </FormField>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Primary contact"
            description="The main person associated with this account."
            icon={UserRound}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Contact name">
                <input
                  required
                  value={values.contactName}
                  onChange={(event) =>
                    updateValue(
                      "contactName",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="Jane Smith"
                />
              </FormField>

              <FormField label="Email address">
                <input
                  required
                  type="email"
                  value={values.email}
                  onChange={(event) =>
                    updateValue(
                      "email",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="jane@example.com"
                />
              </FormField>

              <FormField label="Phone number">
                <input
                  type="tel"
                  value={values.phone}
                  onChange={(event) =>
                    updateValue(
                      "phone",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="(228) 555-0100"
                />
              </FormField>
            </div>
          </FormSection>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <aside>
          <div className="sticky top-24 rounded-2xl border border-[#dedfd9] bg-white p-5">
            <h2 className="font-semibold text-[#20231f]">
              Client summary
            </h2>

            <div className="mt-5 space-y-4">
              <SummaryRow
                label="Company"
                value={
                  values.companyName || "Not entered"
                }
              />

              <SummaryRow
                label="Contact"
                value={
                  values.contactName || "Not entered"
                }
              />

              <SummaryRow
                label="Status"
                value={values.status}
              />

              <SummaryRow
                label="Source"
                value={values.source}
              />
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171918] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2a2d2a]"
            >
              <Save size={16} />
              Create client
            </button>

            <Link
              href="/clients"
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-[#dedfd9] px-4 py-3 text-sm font-medium text-[#62665e]"
            >
              Cancel
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#dedfd9] bg-[#fafaf7] px-3.5 text-sm text-[#292c28] outline-none transition placeholder:text-[#a0a39c] focus:border-[#777b72] focus:bg-white";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

function FormField({
  label,
  children,
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#3d403b]">
        {label}
      </span>

      {children}
    </label>
  );
}

interface FormSectionProps {
  title: string;
  description: string;
  icon: typeof Building2;
  children: React.ReactNode;
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-2xl border border-[#dedfd9] bg-white">
      <div className="flex items-start gap-3 border-b border-[#ecece6] px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0e8] text-[#555951]">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="font-semibold text-[#20231f]">
            {title}
          </h2>

          <p className="mt-1 text-xs text-[#898d85]">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#ecece6] pb-3">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#92968e]">
        {label}
      </span>

      <span className="max-w-[60%] text-right text-sm font-medium text-[#3d403b]">
        {value}
      </span>
    </div>
  );
}