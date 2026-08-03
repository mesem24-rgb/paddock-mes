export type ProjectStatus =
  | "Planning"
  | "In Progress"
  | "Client Review"
  | "On Hold"
  | "Completed";

export type ProjectPriority = "Low" | "Medium" | "High" | "Urgent";

export type TaskStatus = "To Do" | "In Progress" | "Blocked" | "Completed";

export type TaskPriority = "Low" | "Medium" | "High";

export type MilestoneStatus =
  | "Upcoming"
  | "In Progress"
  | "Completed"
  | "Delayed";

export type ClientStatus = "Lead" | "Active" | "Inactive" | "Archived";

export type ClientSource =
  | "Referral"
  | "Website"
  | "LinkedIn"
  | "Existing Network"
  | "Cold Outreach"
  | "Other";

export interface ClientContact {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
}

export interface ClientNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface BusinessClient {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  location?: string;
  status: ClientStatus;
  source: ClientSource;
  description?: string;
  createdAt: string;
  updatedAt: string;
  contacts: ClientContact[];
  notes: ClientNote[];
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  dueDate: string;
  completedDate?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail?: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  budget: number;
  amountPaid: number;
  estimatedHours?: number;
  hoursWorked?: number;
  startDate: string;
  dueDate: string;
  technology: string[];
  repositoryUrl?: string;
  stagingUrl?: string;
  productionUrl?: string;
  milestones?: Milestone[];
  tasks?: ProjectTask[];
  documents?: ProjectDocument[];
}

export interface Task {
  id: string;
  title: string;
  projectName: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "project" | "task" | "client" | "invoice";
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}
