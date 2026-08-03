"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileText,
  GitBranch,
  Globe2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import ProjectStat from "@/components/projects/ProjectStat";
import StatusBadge from "@/components/shared/StatusBadge";
import { useProjects } from "@/context/ProjectContext";
import type {
  MilestoneStatus,
  Project,
  ProjectPriority,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/types";

interface ProjectWorkspaceProps {
  projectId: string;
}

interface EditProjectValues {
  name: string;
  clientName: string;
  clientEmail: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: string;
  budget: string;
  amountPaid: string;
  estimatedHours: string;
  hoursWorked: string;
  startDate: string;
  dueDate: string;
  repositoryUrl: string;
  stagingUrl: string;
  productionUrl: string;
}

interface MilestoneFormValues {
  title: string;
  description: string;
  status: MilestoneStatus;
  dueDate: string;
}

interface TaskFormValues {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: string;
}

const milestoneStyles: Record<MilestoneStatus, string> = {
  Completed: "bg-emerald-500",
  "In Progress": "bg-amber-500",
  Upcoming: "bg-slate-300",
  Delayed: "bg-red-500",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getInitialEditValues(project: Project): EditProjectValues {
  return {
    name: project.name,
    clientName: project.clientName,
    clientEmail: project.clientEmail ?? "",
    description: project.description,
    status: project.status,
    priority: project.priority,
    progress: String(project.progress),
    budget: String(project.budget),
    amountPaid: String(project.amountPaid),
    estimatedHours: String(project.estimatedHours ?? ""),
    hoursWorked: String(project.hoursWorked ?? ""),
    startDate: project.startDate,
    dueDate: project.dueDate,
    repositoryUrl: project.repositoryUrl ?? "",
    stagingUrl: project.stagingUrl ?? "",
    productionUrl: project.productionUrl ?? "",
  };
}

const emptyMilestone: MilestoneFormValues = {
  title: "",
  description: "",
  status: "Upcoming",
  dueDate: "",
};

const emptyTask: TaskFormValues = {
  title: "",
  status: "To Do",
  priority: "Medium",
  dueDate: "",
  assignee: "Michael Sullivan",
};

export default function ProjectWorkspace({ projectId }: ProjectWorkspaceProps) {
  const router = useRouter();

  const {
    isLoaded,
    getProjectById,
    updateProject,
    deleteProject,
    addMilestone,
    addTask,
    updateTask,
    deleteTask,
  } = useProjects();

  const project = getProjectById(projectId);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [editValues, setEditValues] = useState<EditProjectValues | null>(null);

  const [milestoneValues, setMilestoneValues] =
    useState<MilestoneFormValues>(emptyMilestone);

  const [taskValues, setTaskValues] = useState<TaskFormValues>(emptyTask);

  useEffect(() => {
    if (project) {
      setEditValues(getInitialEditValues(project));
    }
  }, [project]);

  const completedTasks = useMemo(
    () =>
      project?.tasks?.filter((task) => task.status === "Completed").length ?? 0,
    [project],
  );

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-white" />
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-white" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!project || !editValues) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <AlertTriangle size={42} className="mx-auto text-[#777b73]" />

          <h1 className="mt-5 text-2xl font-semibold text-[#20231f]">
            Project not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#777b73]">
            This project may have been deleted or is no longer available in this
            workspace.
          </p>

          <Link
            href="/projects"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-3 text-sm font-medium text-white"
          >
            <ArrowLeft size={17} />
            Return to projects
          </Link>
        </div>
      </div>
    );
  }

  const outstandingAmount = Math.max(project.budget - project.amountPaid, 0);

  function handleSaveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project || !editValues) {
      return;
    }

    updateProject(project.id, {
      name: editValues.name.trim(),
      clientName: editValues.clientName.trim(),
      clientEmail: editValues.clientEmail.trim() || undefined,
      description: editValues.description.trim(),
      status: editValues.status,
      priority: editValues.priority,
      progress: Math.min(Math.max(Number(editValues.progress), 0), 100),
      budget: Math.max(Number(editValues.budget), 0),
      amountPaid: Math.max(Number(editValues.amountPaid), 0),
      estimatedHours: editValues.estimatedHours
        ? Math.max(Number(editValues.estimatedHours), 0)
        : undefined,
      hoursWorked: editValues.hoursWorked
        ? Math.max(Number(editValues.hoursWorked), 0)
        : 0,
      startDate: editValues.startDate,
      dueDate: editValues.dueDate,
      repositoryUrl: editValues.repositoryUrl.trim() || undefined,
      stagingUrl: editValues.stagingUrl.trim() || undefined,
      productionUrl: editValues.productionUrl.trim() || undefined,
    });

    setIsEditing(false);
  }

  function handleDeleteProject() {
    if (!project) {
      return;
    }

    deleteProject(project.id);
    router.push("/projects");
  }

  function handleAddMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project || !milestoneValues.title.trim() || !milestoneValues.dueDate) {
      return;
    }

    addMilestone(project.id, {
      title: milestoneValues.title.trim(),
      description: milestoneValues.description.trim(),
      status: milestoneValues.status,
      dueDate: milestoneValues.dueDate,
    });

    setMilestoneValues(emptyMilestone);
    setShowMilestoneForm(false);
  }

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project || !taskValues.title.trim() || !taskValues.dueDate) {
      return;
    }

    addTask(project.id, {
      title: taskValues.title.trim(),
      status: taskValues.status,
      priority: taskValues.priority,
      dueDate: taskValues.dueDate,
      assignee: taskValues.assignee.trim() || "Michael Sullivan",
    });

    setTaskValues(emptyTask);
    setShowTaskForm(false);
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#6f736c] transition hover:text-[#20231f]"
      >
        <ArrowLeft size={17} />
        Back to projects
      </Link>

      {isEditing ? (
        <form
          onSubmit={handleSaveProject}
          className="mt-6 rounded-2xl border border-[#dedfd9] bg-white"
        >
          <div className="flex items-center justify-between border-b border-[#ecece6] px-5 py-4 sm:px-6">
            <div>
              <h1 className="text-xl font-semibold text-[#20231f]">
                Edit project
              </h1>
              <p className="mt-1 text-xs text-[#898d85]">
                Update the primary project details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditValues(getInitialEditValues(project));
                setIsEditing(false);
              }}
              className="rounded-lg p-2 text-[#6f736c] hover:bg-[#f1f2ec]"
              aria-label="Cancel editing"
            >
              <X size={19} />
            </button>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <EditField label="Project name">
              <input
                required
                value={editValues.name}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    name: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Client">
              <input
                required
                value={editValues.clientName}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    clientName: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Client email">
              <input
                type="email"
                value={editValues.clientEmail}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    clientEmail: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Status">
              <select
                value={editValues.status}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    status: event.target.value as ProjectStatus,
                  })
                }
                className={inputClass}
              >
                <option>Planning</option>
                <option>In Progress</option>
                <option>Client Review</option>
                <option>On Hold</option>
                <option>Completed</option>
              </select>
            </EditField>

            <EditField label="Priority">
              <select
                value={editValues.priority}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    priority: event.target.value as ProjectPriority,
                  })
                }
                className={inputClass}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </EditField>

            <EditField label="Progress">
              <input
                type="number"
                min="0"
                max="100"
                value={editValues.progress}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    progress: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Budget">
              <input
                type="number"
                min="0"
                value={editValues.budget}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    budget: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Amount paid">
              <input
                type="number"
                min="0"
                value={editValues.amountPaid}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    amountPaid: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Estimated hours">
              <input
                type="number"
                min="0"
                value={editValues.estimatedHours}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    estimatedHours: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Hours worked">
              <input
                type="number"
                min="0"
                value={editValues.hoursWorked}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    hoursWorked: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Start date">
              <input
                type="date"
                value={editValues.startDate}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    startDate: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Due date">
              <input
                type="date"
                min={editValues.startDate}
                value={editValues.dueDate}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    dueDate: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <div className="sm:col-span-2">
              <EditField label="Description">
                <textarea
                  required
                  rows={5}
                  value={editValues.description}
                  onChange={(event) =>
                    setEditValues({
                      ...editValues,
                      description: event.target.value,
                    })
                  }
                  className={`${inputClass} min-h-32 py-3`}
                />
              </EditField>
            </div>

            <EditField label="GitHub repository">
              <input
                type="url"
                value={editValues.repositoryUrl}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    repositoryUrl: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Staging URL">
              <input
                type="url"
                value={editValues.stagingUrl}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    stagingUrl: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>

            <EditField label="Production URL">
              <input
                type="url"
                value={editValues.productionUrl}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    productionUrl: event.target.value,
                  })
                }
                className={inputClass}
              />
            </EditField>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#ecece6] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => {
                setEditValues(getInitialEditValues(project));
                setIsEditing(false);
              }}
              className="rounded-xl border border-[#dedfd9] px-4 py-2.5 text-sm font-medium text-[#555951]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-2.5 text-sm font-medium text-white"
            >
              <Save size={16} />
              Save changes
            </button>
          </div>
        </form>
      ) : (
        <>
          <section className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={project.status} />
                <StatusBadge value={project.priority} />
              </div>

              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#8a8e86]">
                {project.clientName}
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20231f] sm:text-4xl">
                {project.name}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6f736c] sm:text-base">
                {project.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm((current) => !current)}
                className="rounded-xl border border-red-200 bg-white p-3 text-red-600 transition hover:bg-red-50"
                aria-label="Delete project"
              >
                <Trash2 size={18} />
              </button>

              <button
                type="button"
                className="rounded-xl border border-[#dedfd9] bg-white p-3 text-[#63675f]"
                aria-label="More project actions"
              >
                <MoreHorizontal size={19} />
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-3 text-sm font-medium text-white"
              >
                <Pencil size={16} />
                Edit project
              </button>
            </div>
          </section>

          {showDeleteConfirm && (
            <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-red-900">
                  Delete this project?
                </p>
                <p className="mt-1 text-sm text-red-700">
                  This removes the project and its local tasks and milestones.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white"
                >
                  Delete project
                </button>
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-8 rounded-2xl border border-[#dedfd9] bg-white p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#777b73]">
              Overall project progress
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#20231f]">
              {project.progress}%
            </p>
          </div>

          <p className="text-right text-xs leading-5 text-[#8a8e86]">
            Started {formatDate(project.startDate)}
            <br />
            Due {formatDate(project.dueDate)}
          </p>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#ecece6]">
          <div
            className="h-full rounded-full bg-[#242724]"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProjectStat
          label="Project budget"
          value={formatCurrency(project.budget)}
          icon={CircleDollarSign}
          supportingText={`${formatCurrency(project.amountPaid)} received`}
        />

        <ProjectStat
          label="Outstanding"
          value={formatCurrency(outstandingAmount)}
          icon={CircleDollarSign}
          supportingText="Remaining project value"
        />

        <ProjectStat
          label="Hours tracked"
          value={`${project.hoursWorked ?? 0}`}
          icon={Clock3}
          supportingText={`${project.estimatedHours ?? 0} estimated hours`}
        />

        <ProjectStat
          label="Tasks completed"
          value={`${completedTasks}/${project.tasks?.length ?? 0}`}
          icon={CheckCircle2}
          supportingText="Across the current project"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-[#dedfd9] bg-white">
            <div className="flex items-center justify-between border-b border-[#ecece6] px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-semibold text-[#20231f]">
                  Project milestones
                </h2>
                <p className="mt-1 text-xs text-[#898d85]">
                  Major phases of the build
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMilestoneForm((current) => !current)}
                className="flex items-center gap-1.5 text-sm font-medium text-[#595d56]"
              >
                <Plus size={16} />
                Add milestone
              </button>
            </div>

            {showMilestoneForm && (
              <form
                onSubmit={handleAddMilestone}
                className="grid gap-4 border-b border-[#ecece6] bg-[#fafaf7] p-5 sm:grid-cols-2 sm:p-6"
              >
                <EditField label="Milestone title">
                  <input
                    required
                    value={milestoneValues.title}
                    onChange={(event) =>
                      setMilestoneValues({
                        ...milestoneValues,
                        title: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </EditField>

                <EditField label="Due date">
                  <input
                    required
                    type="date"
                    value={milestoneValues.dueDate}
                    onChange={(event) =>
                      setMilestoneValues({
                        ...milestoneValues,
                        dueDate: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </EditField>

                <EditField label="Status">
                  <select
                    value={milestoneValues.status}
                    onChange={(event) =>
                      setMilestoneValues({
                        ...milestoneValues,
                        status: event.target.value as MilestoneStatus,
                      })
                    }
                    className={inputClass}
                  >
                    <option>Upcoming</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Delayed</option>
                  </select>
                </EditField>

                <div className="sm:col-span-2">
                  <EditField label="Description">
                    <textarea
                      rows={3}
                      value={milestoneValues.description}
                      onChange={(event) =>
                        setMilestoneValues({
                          ...milestoneValues,
                          description: event.target.value,
                        })
                      }
                      className={`${inputClass} min-h-24 py-3`}
                    />
                  </EditField>
                </div>

                <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowMilestoneForm(false)}
                    className="rounded-xl border border-[#dedfd9] bg-white px-4 py-2.5 text-sm font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-2.5 text-sm font-medium text-white"
                  >
                    <Check size={16} />
                    Add milestone
                  </button>
                </div>
              </form>
            )}

            {project.milestones?.length ? (
              <div className="divide-y divide-[#ecece6]">
                {project.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex gap-4 px-5 py-5 sm:px-6"
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1 h-3 w-3 rounded-full ${milestoneStyles[milestone.status]}`}
                      />
                      <span className="mt-2 h-full w-px bg-[#e3e4de]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <div>
                          <h3 className="font-medium text-[#30332e]">
                            {milestone.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[#73776f]">
                            {milestone.description ||
                              "No milestone description."}
                          </p>
                        </div>

                        <span className="h-fit w-fit rounded-full border border-[#dedfd9] px-2.5 py-1 text-xs font-medium text-[#666a62]">
                          {milestone.status}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-[#8a8e86]">
                        <CalendarDays size={14} />
                        Due {formatDate(milestone.dueDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No milestones have been added." />
            )}
          </article>

          <article className="rounded-2xl border border-[#dedfd9] bg-white">
            <div className="flex items-center justify-between border-b border-[#ecece6] px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-semibold text-[#20231f]">Current tasks</h2>
                <p className="mt-1 text-xs text-[#898d85]">
                  Work assigned to this project
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTaskForm((current) => !current)}
                className="flex items-center gap-1.5 text-sm font-medium text-[#595d56]"
              >
                <Plus size={16} />
                Add task
              </button>
            </div>

            {showTaskForm && (
              <form
                onSubmit={handleAddTask}
                className="grid gap-4 border-b border-[#ecece6] bg-[#fafaf7] p-5 sm:grid-cols-2 sm:p-6"
              >
                <EditField label="Task title">
                  <input
                    required
                    value={taskValues.title}
                    onChange={(event) =>
                      setTaskValues({
                        ...taskValues,
                        title: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </EditField>

                <EditField label="Due date">
                  <input
                    required
                    type="date"
                    value={taskValues.dueDate}
                    onChange={(event) =>
                      setTaskValues({
                        ...taskValues,
                        dueDate: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </EditField>

                <EditField label="Status">
                  <select
                    value={taskValues.status}
                    onChange={(event) =>
                      setTaskValues({
                        ...taskValues,
                        status: event.target.value as TaskStatus,
                      })
                    }
                    className={inputClass}
                  >
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Blocked</option>
                    <option>Completed</option>
                  </select>
                </EditField>

                <EditField label="Priority">
                  <select
                    value={taskValues.priority}
                    onChange={(event) =>
                      setTaskValues({
                        ...taskValues,
                        priority: event.target.value as TaskPriority,
                      })
                    }
                    className={inputClass}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </EditField>

                <div className="sm:col-span-2">
                  <EditField label="Assignee">
                    <input
                      value={taskValues.assignee}
                      onChange={(event) =>
                        setTaskValues({
                          ...taskValues,
                          assignee: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </EditField>
                </div>

                <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="rounded-xl border border-[#dedfd9] bg-white px-4 py-2.5 text-sm font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-2.5 text-sm font-medium text-white"
                  >
                    <Check size={16} />
                    Add task
                  </button>
                </div>
              </form>
            )}

            {project.tasks?.length ? (
              <div className="divide-y divide-[#ecece6]">
                {project.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(project.id, task.id, {
                            status:
                              task.status === "Completed"
                                ? "To Do"
                                : "Completed",
                          })
                        }
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          task.status === "Completed"
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-[#cfd1ca] text-transparent"
                        }`}
                        aria-label={`Mark ${task.title} ${
                          task.status === "Completed"
                            ? "incomplete"
                            : "complete"
                        }`}
                      >
                        <Check size={14} />
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-medium ${
                            task.status === "Completed"
                              ? "text-[#92968e] line-through"
                              : "text-[#30332e]"
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-[#898d85]">
                          {task.assignee}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={task.status} />
                      <StatusBadge value={task.priority} />

                      <span className="text-xs text-[#858981]">
                        {formatDate(task.dueDate)}
                      </span>

                      <button
                        type="button"
                        onClick={() => deleteTask(project.id, task.id)}
                        className="rounded-lg p-2 text-[#999d95] hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${task.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No tasks have been added." />
            )}
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-[#dedfd9] bg-white p-5">
            <h2 className="font-semibold text-[#20231f]">Client</h2>

            <div className="mt-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0e8] text-[#545850]">
                <UserRound size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-[#30332e]">
                  {project.clientName}
                </p>

                {project.clientEmail && (
                  <a
                    href={`mailto:${project.clientEmail}`}
                    className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#777b73]"
                  >
                    <Mail size={13} />
                    {project.clientEmail}
                  </a>
                )}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#dedfd9] bg-white p-5">
            <h2 className="font-semibold text-[#20231f]">
              Development resources
            </h2>

            <div className="mt-4 space-y-2">
              {project.repositoryUrl && (
                <ResourceLink
                  href={project.repositoryUrl}
                  label="GitHub repository"
                  icon={GitBranch}
                />
              )}

              {project.stagingUrl && (
                <ResourceLink
                  href={project.stagingUrl}
                  label="Staging website"
                  icon={Globe2}
                />
              )}

              {project.productionUrl && (
                <ResourceLink
                  href={project.productionUrl}
                  label="Production website"
                  icon={Globe2}
                />
              )}

              {!project.repositoryUrl &&
                !project.stagingUrl &&
                !project.productionUrl && (
                  <p className="rounded-xl bg-[#f5f5f0] px-4 py-4 text-sm text-[#777b73]">
                    No development resources added.
                  </p>
                )}
            </div>
          </article>

          <article className="rounded-2xl border border-[#dedfd9] bg-white p-5">
            <h2 className="font-semibold text-[#20231f]">Technology</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {project.technology.map((technology) => (
                <span
                  key={technology}
                  className="rounded-full bg-[#f0f1eb] px-3 py-1.5 text-xs font-medium text-[#5f635b]"
                >
                  {technology}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[#dedfd9] bg-white">
            <div className="flex items-center justify-between border-b border-[#ecece6] px-5 py-4">
              <h2 className="font-semibold text-[#20231f]">Documents</h2>

              <button
                type="button"
                className="text-sm font-medium text-[#595d56]"
              >
                Upload
              </button>
            </div>

            {project.documents?.length ? (
              <div className="divide-y divide-[#ecece6]">
                {project.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center gap-3 px-5 py-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0f1eb] text-[#5d6159]">
                      <FileText size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#343733]">
                        {document.name}
                      </p>
                      <p className="mt-1 text-xs text-[#8a8e86]">
                        {document.type} · {document.size}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No documents uploaded." />
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#dedfd9] bg-[#fafaf7] px-3.5 text-sm text-[#292c28] outline-none transition placeholder:text-[#a0a39c] focus:border-[#777b72] focus:bg-white";

interface EditFieldProps {
  label: string;
  children: React.ReactNode;
}

function EditField({ label, children }: EditFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#3d403b]">
        {label}
      </span>
      {children}
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-sm text-[#777b73]">{text}</p>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

interface ResourceLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

function ResourceLink({ href, label, icon: Icon }: ResourceLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-xl border border-[#e2e3dd] px-3.5 py-3 text-sm text-[#555951] transition hover:bg-[#f4f4ef] hover:text-[#20231f]"
    >
      <span className="flex items-center gap-2">
        <Icon size={17} />
        {label}
      </span>

      <ExternalLink size={14} />
    </a>
  );
}
