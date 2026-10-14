import type { Milestone, ProjectTask } from "@/types";
import { shiftDate } from "@/lib/planning";
export const buildTemplates = [
  {
    id: "website",
    name: "Website build",
    stages: [
      {
        title: "Discovery and content",
        tasks: [
          "Confirm scope and launch goals",
          "Collect branding, content, and account access",
        ],
      },
      {
        title: "Design approval",
        tasks: [
          "Create responsive page designs",
          "Get client approval on design",
        ],
      },
      {
        title: "Development",
        tasks: [
          "Build pages and core interactions",
          "Connect contact and booking workflows",
        ],
      },
      {
        title: "Launch review",
        tasks: [
          "Check mobile layout and accessibility",
          "Configure SEO and analytics",
          "Review with client and launch",
        ],
      },
    ],
  },
  {
    id: "wordpress",
    name: "WordPress optimization",
    stages: [
      {
        title: "Access and baseline",
        tasks: [
          "Confirm hosting and WordPress access",
          "Back up site and create staging",
          "Record performance and SEO baseline",
        ],
      },
      {
        title: "Optimization",
        tasks: [
          "Review plugin and theme dependencies",
          "Optimize images and asset delivery",
          "Improve page structure and accessibility",
        ],
      },
      {
        title: "Verification",
        tasks: [
          "Test forms, navigation, and mobile layout",
          "Compare performance with baseline",
        ],
      },
      {
        title: "Release and handoff",
        tasks: [
          "Review changes with client",
          "Deploy approved updates and document maintenance",
        ],
      },
    ],
  },
  {
    id: "software",
    name: "Custom software",
    stages: [
      {
        title: "Workflow and scope",
        tasks: [
          "Map client workflows and roles",
          "Define MVP scope and acceptance criteria",
        ],
      },
      {
        title: "Prototype and data model",
        tasks: [
          "Review interface prototype with client",
          "Plan data model and access rules",
        ],
      },
      {
        title: "Implementation",
        tasks: ["Build core workflows", "Connect authentication and database"],
      },
      {
        title: "Validation and rollout",
        tasks: [
          "Test permissions and key workflows",
          "Complete client acceptance review",
          "Deploy and provide user handoff",
        ],
      },
    ],
  },
] as const;
export type BuildTemplateId = (typeof buildTemplates)[number]["id"];
export function createBuildPlan(
  templateId: BuildTemplateId | undefined,
  startDate: string,
  dueDate: string,
): { milestones: Milestone[]; tasks: ProjectTask[] } {
  const template = buildTemplates.find((t) => t.id === templateId);
  if (!template) return { milestones: [], tasks: [] };
  const span = Math.max(
    0,
    Math.round(
      (Date.parse(`${dueDate}T12:00:00Z`) -
        Date.parse(`${startDate}T12:00:00Z`)) /
        86400000,
    ),
  );
  const milestones: Milestone[] = [],
    tasks: ProjectTask[] = [];
  template.stages.forEach((stage, index) => {
    const date = shiftDate(
      startDate,
      Math.round((span * (index + 1)) / template.stages.length),
    );
    milestones.push({
      id: `milestone-${crypto.randomUUID()}`,
      title: stage.title,
      description: `Complete the ${stage.title.toLowerCase()} stage.`,
      status: "Upcoming",
      dueDate: date,
    });
    stage.tasks.forEach((title) =>
      tasks.push({
        id: `task-${crypto.randomUUID()}`,
        title,
        status: "To Do",
        priority: "Medium",
        dueDate: date,
        assignee: "Michael",
      }),
    );
  });
  return { milestones, tasks };
}
