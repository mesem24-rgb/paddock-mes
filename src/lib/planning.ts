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

export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localDate(value);
}
export function weekDates(date: string) {
  const value = new Date(`${date}T12:00:00`);
  const offset = (value.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, index) =>
    shiftDate(date, index - offset),
  );
}
export function conflictingTasks(tasks: ReturnType<typeof projectTasks>) {
  const conflicts = new Set<string>();
  const intervals = tasks
    .filter(
      (t) =>
        t.status !== "Completed" &&
        t.scheduledDate &&
        t.scheduledTime &&
        (t.estimatedHours ?? 0) > 0,
    )
    .map((t) => {
      const start = new Date(`${t.scheduledDate}T${t.scheduledTime}`).getTime();
      return {
        key: `${t.projectId}:${t.id}`,
        start,
        end: start + (t.estimatedHours ?? 0) * 3600000,
      };
    })
    .filter((t) => Number.isFinite(t.start));
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      const a = intervals[i],
        b = intervals[j];
      if (a.start < b.end && b.start < a.end) {
        conflicts.add(a.key);
        conflicts.add(b.key);
      }
    }
  }
  return conflicts;
}
