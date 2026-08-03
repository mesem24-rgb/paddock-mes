"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Code2,
  Globe2,
  LoaderCircle,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useProjects } from "@/context/ProjectContext";
import type {
  ProjectPriority,
  ProjectStatus,
} from "@/types";

interface ProjectFormValues {
  name: string;
  clientName: string;
  clientEmail: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: string;
  estimatedHours: string;
  startDate: string;
  dueDate: string;
  repositoryUrl: string;
  stagingUrl: string;
  productionUrl: string;
}

type FormErrors = Partial<Record<keyof ProjectFormValues, string>>;

const clientOptions = [
  {
    name: "Internal",
    email: "mesem24@gmail.com",
  },
  {
    name: "Compass Group Recruiting",
    email: "hans@compassgrouprecruiting.com",
  },
];

const suggestedTechnologies = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Supabase",
  "PostgreSQL",
  "Vercel",
  "Stripe",
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getFutureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString().split("T")[0];
}

const initialValues: ProjectFormValues = {
  name: "",
  clientName: "",
  clientEmail: "",
  description: "",
  status: "Planning",
  priority: "Medium",
  budget: "",
  estimatedHours: "",
  startDate: getTodayDate(),
  dueDate: getFutureDate(30),
  repositoryUrl: "",
  stagingUrl: "",
  productionUrl: "",
};

function validateUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function CreateProjectForm() {
  const router = useRouter();
  const { createProject } = useProjects();

  const [values, setValues] =
    useState<ProjectFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [technologies, setTechnologies] = useState<string[]>([
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
  ]);
  const [technologyInput, setTechnologyInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedClient = useMemo(
    () =>
      clientOptions.find(
        (client) => client.name === values.clientName,
      ),
    [values.clientName],
  );

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
  }

  function handleClientChange(event: ChangeEvent<HTMLSelectElement>) {
    const clientName = event.target.value;

    const matchedClient = clientOptions.find(
      (client) => client.name === clientName,
    );

    setValues((currentValues) => ({
      ...currentValues,
      clientName,
      clientEmail: matchedClient?.email ?? "",
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      clientName: undefined,
      clientEmail: undefined,
    }));
  }

  function addTechnology(value = technologyInput) {
    const technology = value.trim();

    if (!technology) {
      return;
    }

    const alreadyExists = technologies.some(
      (item) => item.toLowerCase() === technology.toLowerCase(),
    );

    if (!alreadyExists) {
      setTechnologies((currentTechnologies) => [
        ...currentTechnologies,
        technology,
      ]);
    }

    setTechnologyInput("");
  }

  function removeTechnology(technology: string) {
    setTechnologies((currentTechnologies) =>
      currentTechnologies.filter((item) => item !== technology),
    );
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Enter a project name.";
    }

    if (!values.clientName.trim()) {
      nextErrors.clientName = "Select or enter a client.";
    }

    if (
      values.clientEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.clientEmail)
    ) {
      nextErrors.clientEmail = "Enter a valid email address.";
    }

    if (!values.description.trim()) {
      nextErrors.description = "Add a short project description.";
    } else if (values.description.trim().length < 20) {
      nextErrors.description =
        "The description should be at least 20 characters.";
    }

    const budget = Number(values.budget);

    if (!values.budget) {
      nextErrors.budget = "Enter the project budget.";
    } else if (!Number.isFinite(budget) || budget < 0) {
      nextErrors.budget = "Enter a valid budget.";
    }

    if (
      values.estimatedHours &&
      Number(values.estimatedHours) < 0
    ) {
      nextErrors.estimatedHours =
        "Estimated hours cannot be negative.";
    }

    if (!values.startDate) {
      nextErrors.startDate = "Select a start date.";
    }

    if (!values.dueDate) {
      nextErrors.dueDate = "Select a due date.";
    }

    if (
      values.startDate &&
      values.dueDate &&
      values.dueDate < values.startDate
    ) {
      nextErrors.dueDate =
        "The due date must be after the start date.";
    }

    if (!validateUrl(values.repositoryUrl)) {
      nextErrors.repositoryUrl =
        "Enter a complete URL beginning with http:// or https://.";
    }

    if (!validateUrl(values.stagingUrl)) {
      nextErrors.stagingUrl =
        "Enter a complete URL beginning with http:// or https://.";
    }

    if (!validateUrl(values.productionUrl)) {
      nextErrors.productionUrl =
        "Enter a complete URL beginning with http:// or https://.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setIsSubmitting(true);

    const project = createProject({
      name: values.name.trim(),
      clientName: values.clientName.trim(),
      clientEmail: values.clientEmail.trim() || undefined,
      description: values.description.trim(),
      status: values.status,
      priority: values.priority,
      budget: Number(values.budget),
      estimatedHours: values.estimatedHours
        ? Number(values.estimatedHours)
        : undefined,
      startDate: values.startDate,
      dueDate: values.dueDate,
      technology: technologies,
      repositoryUrl: values.repositoryUrl.trim() || undefined,
      stagingUrl: values.stagingUrl.trim() || undefined,
      productionUrl: values.productionUrl.trim() || undefined,
    });

    router.push(`/projects/${project.id}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* SECTION: Navigation */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#6f736c] transition hover:text-[#20231f]"
      >
        <ArrowLeft size={17} />
        Back to projects
      </Link>

      {/* SECTION: Page heading */}
      <section className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#858981]">
            New build
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20231f] sm:text-4xl">
            Create project
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71756e] sm:text-base">
            Establish the client, scope, schedule, budget, and development
            resources for this build.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-fit items-center gap-2 rounded-xl bg-[#171918] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2b2e2a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Check size={17} />
          )}

          {isSubmitting ? "Creating project..." : "Create project"}
        </button>
      </section>

      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div>
            <p className="text-sm font-semibold">
              Review the highlighted fields
            </p>

            <p className="mt-1 text-sm text-red-700">
              Some required project information is missing or invalid.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
        <div className="space-y-6">
          {/* SECTION: Basic information */}
          <section className="rounded-2xl border border-[#dedfd9] bg-white">
            <div className="border-b border-[#ecece6] px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-[#20231f]">
                Project information
              </h2>

              <p className="mt-1 text-xs text-[#898d85]">
                Define what is being built and who it is for.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <FormField
                label="Project name"
                htmlFor="name"
                error={errors.name}
                required
              >
                <input
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder="Example: Customer Service Portal"
                  className={getInputClass(Boolean(errors.name))}
                />
              </FormField>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Client"
                  htmlFor="clientName"
                  error={errors.clientName}
                  required
                >
                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92968e]"
                    />

                    <select
                      id="clientName"
                      name="clientName"
                      value={values.clientName}
                      onChange={handleClientChange}
                      className={`${getInputClass(
                        Boolean(errors.clientName),
                      )} appearance-none pl-10`}
                    >
                      <option value="">Select a client</option>

                      {clientOptions.map((client) => (
                        <option key={client.name} value={client.name}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>

                <FormField
                  label="Client email"
                  htmlFor="clientEmail"
                  error={errors.clientEmail}
                >
                  <input
                    id="clientEmail"
                    name="clientEmail"
                    type="email"
                    value={values.clientEmail}
                    onChange={handleChange}
                    placeholder="client@example.com"
                    className={getInputClass(
                      Boolean(errors.clientEmail),
                    )}
                  />
                </FormField>
              </div>

              {selectedClient && (
                <div className="rounded-xl bg-[#f5f5f0] px-4 py-3 text-sm text-[#666a62]">
                  Using saved client:{" "}
                  <span className="font-medium text-[#30332e]">
                    {selectedClient.name}
                  </span>
                </div>
              )}

              <FormField
                label="Project description"
                htmlFor="description"
                error={errors.description}
                required
              >
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={values.description}
                  onChange={handleChange}
                  placeholder="Describe the business problem, intended users, and primary outcome..."
                  className={`${getInputClass(
                    Boolean(errors.description),
                  )} min-h-32 resize-y py-3`}
                />

                <p className="mt-2 text-right text-xs text-[#969a92]">
                  {values.description.length} characters
                </p>
              </FormField>
            </div>
          </section>

          {/* SECTION: Schedule */}
          <section className="rounded-2xl border border-[#dedfd9] bg-white">
            <div className="border-b border-[#ecece6] px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-[#20231f]">
                Schedule and status
              </h2>

              <p className="mt-1 text-xs text-[#898d85]">
                Establish the expected delivery window.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <FormField
                label="Start date"
                htmlFor="startDate"
                error={errors.startDate}
                required
              >
                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92968e]"
                  />

                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={values.startDate}
                    onChange={handleChange}
                    className={`${getInputClass(
                      Boolean(errors.startDate),
                    )} pl-10`}
                  />
                </div>
              </FormField>

              <FormField
                label="Due date"
                htmlFor="dueDate"
                error={errors.dueDate}
                required
              >
                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92968e]"
                  />

                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    min={values.startDate}
                    value={values.dueDate}
                    onChange={handleChange}
                    className={`${getInputClass(
                      Boolean(errors.dueDate),
                    )} pl-10`}
                  />
                </div>
              </FormField>

              <FormField label="Initial status" htmlFor="status">
                <select
                  id="status"
                  name="status"
                  value={values.status}
                  onChange={handleChange}
                  className={`${getInputClass(false)} appearance-none`}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Client Review">Client Review</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </FormField>

              <FormField label="Priority" htmlFor="priority">
                <select
                  id="priority"
                  name="priority"
                  value={values.priority}
                  onChange={handleChange}
                  className={`${getInputClass(false)} appearance-none`}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </FormField>
            </div>
          </section>

          {/* SECTION: Technology */}
          <section className="rounded-2xl border border-[#dedfd9] bg-white">
            <div className="border-b border-[#ecece6] px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-[#20231f]">
                Technology
              </h2>

              <p className="mt-1 text-xs text-[#898d85]">
                Record the primary tools and services used in the build.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Code2
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92968e]"
                  />

                  <input
                    value={technologyInput}
                    onChange={(event) =>
                      setTechnologyInput(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTechnology();
                      }
                    }}
                    placeholder="Add a technology"
                    className={`${getInputClass(false)} pl-10`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => addTechnology()}
                  className="flex h-11 items-center gap-2 rounded-xl border border-[#d8dad3] bg-[#f5f5f0] px-4 text-sm font-medium text-[#444842] transition hover:bg-[#ebede5]"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {technologies.map((technology) => (
                  <button
                    key={technology}
                    type="button"
                    onClick={() => removeTechnology(technology)}
                    className="flex items-center gap-1.5 rounded-full bg-[#20231f] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#383c37]"
                    aria-label={`Remove ${technology}`}
                  >
                    {technology}
                    <X size={13} />
                  </button>
                ))}
              </div>

              <div className="mt-5 border-t border-[#ecece6] pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#969a92]">
                  Suggestions
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedTechnologies
                    .filter(
                      (suggestion) =>
                        !technologies.some(
                          (technology) =>
                            technology.toLowerCase() ===
                            suggestion.toLowerCase(),
                        ),
                    )
                    .map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addTechnology(suggestion)}
                        className="rounded-full border border-[#dadcd5] px-3 py-1.5 text-xs font-medium text-[#656961] transition hover:bg-[#f2f3ed]"
                      >
                        + {suggestion}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: Development resources */}
          <section className="rounded-2xl border border-[#dedfd9] bg-white">
            <div className="border-b border-[#ecece6] px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-[#20231f]">
                Development resources
              </h2>

              <p className="mt-1 text-xs text-[#898d85]">
                These fields can be completed later.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <FormField
                label="GitHub repository"
                htmlFor="repositoryUrl"
                error={errors.repositoryUrl}
              >
                <input
                  id="repositoryUrl"
                  name="repositoryUrl"
                  type="url"
                  value={values.repositoryUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/username/project"
                  className={getInputClass(
                    Boolean(errors.repositoryUrl),
                  )}
                />
              </FormField>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Staging URL"
                  htmlFor="stagingUrl"
                  error={errors.stagingUrl}
                >
                  <div className="relative">
                    <Globe2
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92968e]"
                    />

                    <input
                      id="stagingUrl"
                      name="stagingUrl"
                      type="url"
                      value={values.stagingUrl}
                      onChange={handleChange}
                      placeholder="https://staging.example.com"
                      className={`${getInputClass(
                        Boolean(errors.stagingUrl),
                      )} pl-10`}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Production URL"
                  htmlFor="productionUrl"
                  error={errors.productionUrl}
                >
                  <div className="relative">
                    <Globe2
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92968e]"
                    />

                    <input
                      id="productionUrl"
                      name="productionUrl"
                      type="url"
                      value={values.productionUrl}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className={`${getInputClass(
                        Boolean(errors.productionUrl),
                      )} pl-10`}
                    />
                  </div>
                </FormField>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {/* SECTION: Financial planning */}
          <section className="rounded-2xl border border-[#dedfd9] bg-white">
            <div className="border-b border-[#ecece6] px-5 py-4">
              <h2 className="font-semibold text-[#20231f]">
                Financial planning
              </h2>

              <p className="mt-1 text-xs text-[#898d85]">
                Establish the initial project value.
              </p>
            </div>

            <div className="space-y-5 p-5">
              <FormField
                label="Project budget"
                htmlFor="budget"
                error={errors.budget}
                required
              >
                <div className="relative">
                  <CircleDollarSign
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92968e]"
                  />

                  <input
                    id="budget"
                    name="budget"
                    type="number"
                    min="0"
                    step="100"
                    value={values.budget}
                    onChange={handleChange}
                    placeholder="15000"
                    className={`${getInputClass(
                      Boolean(errors.budget),
                    )} pl-10`}
                  />
                </div>
              </FormField>

              <FormField
                label="Estimated hours"
                htmlFor="estimatedHours"
                error={errors.estimatedHours}
              >
                <div className="relative">
                  <Clock3
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92968e]"
                  />

                  <input
                    id="estimatedHours"
                    name="estimatedHours"
                    type="number"
                    min="0"
                    value={values.estimatedHours}
                    onChange={handleChange}
                    placeholder="160"
                    className={`${getInputClass(
                      Boolean(errors.estimatedHours),
                    )} pl-10`}
                  />
                </div>
              </FormField>

              {values.budget &&
                values.estimatedHours &&
                Number(values.estimatedHours) > 0 && (
                  <div className="rounded-xl bg-[#f4f5ef] p-4">
                    <p className="text-xs font-medium text-[#777b73]">
                      Estimated project rate
                    </p>

                    <p className="mt-2 text-xl font-semibold text-[#252825]">
                      $
                      {(
                        Number(values.budget) /
                        Number(values.estimatedHours)
                      ).toFixed(2)}
                      /hr
                    </p>
                  </div>
                )}
            </div>
          </section>

          {/* SECTION: Setup summary */}
          <section className="rounded-2xl bg-[#171918] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
              Project setup
            </p>

            <h2 className="mt-3 text-xl font-semibold">
              Ready for the paddock
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/60">
              Creating this project will establish its overview. Milestones,
              tasks, documents, time, and invoices can then be added from the
              project workspace.
            </p>

            <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm">
              <SummaryRow
                label="Client"
                value={values.clientName || "Not selected"}
              />

              <SummaryRow
                label="Status"
                value={values.status}
              />

              <SummaryRow
                label="Priority"
                value={values.priority}
              />

              <SummaryRow
                label="Technology"
                value={`${technologies.length} selected`}
              />
            </div>
          </section>

          <Link
            href="/projects"
            className="flex w-full items-center justify-center rounded-xl border border-[#d8dad3] bg-white px-4 py-3 text-sm font-medium text-[#555951] transition hover:bg-[#f0f1eb]"
          >
            Cancel
          </Link>
        </aside>
      </div>

      {/* SECTION: Mobile submit */}
      <div className="sticky bottom-4 z-20 mt-8 sm:hidden">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171918] px-5 py-3.5 text-sm font-medium text-white shadow-xl disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Check size={17} />
          )}

          {isSubmitting ? "Creating project..." : "Create project"}
        </button>
      </div>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({
  label,
  htmlFor,
  error,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-medium text-[#3d403b]"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700">
          <AlertCircle size={13} />
          {error}
        </p>
      )}
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/45">{label}</span>
      <span className="text-right font-medium text-white/85">
        {value}
      </span>
    </div>
  );
}

function getInputClass(hasError: boolean) {
  return `h-11 w-full rounded-xl border bg-[#fafaf7] px-3.5 text-sm text-[#292c28] outline-none transition placeholder:text-[#a0a39c] focus:bg-white ${
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-[#dedfd9] focus:border-[#777b72]"
  }`;
}