import type { Project } from "@/types";
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function projectTasks(projects: Project[]) {
  return projects.flatMap((project) =>
    (project.tasks ?? []).map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
    })),
  );
}
