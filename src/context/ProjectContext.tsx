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
import { projects as initialProjects } from "@/data/mock-data";
import type { Milestone, Project, ProjectTask } from "@/types";

export interface CreateProjectInput {
  name: string;
  clientName: string;
  clientEmail?: string;
  description: string;
  status: Project["status"];
  priority: Project["priority"];
  budget: number;
  estimatedHours?: number;
  startDate: string;
  dueDate: string;
  technology: string[];
  repositoryUrl?: string;
  stagingUrl?: string;
  productionUrl?: string;
}

interface ProjectContextValue {
  projects: Project[];
  isLoaded: boolean;
  createProject: (input: CreateProjectInput) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  getProjectById: (projectId: string) => Project | undefined;
  addMilestone: (projectId: string, milestone: Omit<Milestone, "id">) => void;
  addTask: (projectId: string, task: Omit<ProjectTask, "id">) => void;
  updateTask: (
    projectId: string,
    taskId: string,
    updates: Partial<ProjectTask>,
  ) => void;
  deleteTask: (projectId: string, taskId: string) => void;
}

interface ProjectProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "paddock-projects";

const ProjectContext = createContext<ProjectContextValue | undefined>(
  undefined,
);

function createProjectId(name: string) {
  const baseId = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const suffix = Date.now().toString().slice(-6);

  return `${baseId || "project"}-${suffix}`;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedProjects = window.localStorage.getItem(STORAGE_KEY);

      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects) as Project[];

        if (Array.isArray(parsedProjects)) {
          setProjects(parsedProjects);
        }
      }
    } catch (error) {
      console.error("Unable to load projects from browser storage.", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("Unable to save projects to browser storage.", error);
    }
  }, [isLoaded, projects]);

  const createProject = useCallback((input: CreateProjectInput): Project => {
    const project: Project = {
      id: createProjectId(input.name),
      name: input.name,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      description: input.description,
      status: input.status,
      priority: input.priority,
      progress: 0,
      budget: input.budget,
      amountPaid: 0,
      estimatedHours: input.estimatedHours,
      hoursWorked: 0,
      startDate: input.startDate,
      dueDate: input.dueDate,
      technology: input.technology,
      repositoryUrl: input.repositoryUrl,
      stagingUrl: input.stagingUrl,
      productionUrl: input.productionUrl,
      milestones: [],
      tasks: [],
      documents: [],
    };

    setProjects((currentProjects) => [project, ...currentProjects]);

    return project;
  }, []);

  const updateProject = useCallback(
    (projectId: string, updates: Partial<Project>) => {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                ...updates,
                id: project.id,
              }
            : project,
        ),
      );
    },
    [],
  );

  const deleteProject = useCallback((projectId: string) => {
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectId),
    );
  }, []);

  const addMilestone = useCallback(
    (projectId: string, milestoneInput: Omit<Milestone, "id">) => {
      const milestone: Milestone = {
        ...milestoneInput,
        id: `milestone-${Date.now()}`,
      };

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                milestones: [...(project.milestones ?? []), milestone],
              }
            : project,
        ),
      );
    },
    [],
  );

  const addTask = useCallback(
    (projectId: string, taskInput: Omit<ProjectTask, "id">) => {
      const task: ProjectTask = {
        ...taskInput,
        id: `task-${Date.now()}`,
      };

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                tasks: [...(project.tasks ?? []), task],
              }
            : project,
        ),
      );
    },
    [],
  );

  const updateTask = useCallback(
    (projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                tasks: (project.tasks ?? []).map((task) =>
                  task.id === taskId
                    ? {
                        ...task,
                        ...updates,
                        id: task.id,
                      }
                    : task,
                ),
              }
            : project,
        ),
      );
    },
    [],
  );

  const deleteTask = useCallback((projectId: string, taskId: string) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: (project.tasks ?? []).filter((task) => task.id !== taskId),
            }
          : project,
      ),
    );
  }, []);

  const getProjectById = useCallback(
    (projectId: string) => projects.find((project) => project.id === projectId),
    [projects],
  );

  const value = useMemo(
    () => ({
      projects,
      isLoaded,
      createProject,
      updateProject,
      deleteProject,
      getProjectById,
      addMilestone,
      addTask,
      updateTask,
      deleteTask,
    }),
    [
      projects,
      isLoaded,
      createProject,
      updateProject,
      deleteProject,
      getProjectById,
      addMilestone,
      addTask,
      updateTask,
      deleteTask,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjects must be used inside ProjectProvider.");
  }

  return context;
}
