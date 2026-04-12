import { ProjectStatus } from "@/types";

export const ROUTES = {
  LOGIN: "/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_PROJECTS: "/admin/projects",
  ADMIN_FACULTY: "/admin/faculty",
  FACULTY_DASHBOARD: "/faculty/dashboard",
  FACULTY_PROJECTS: "/faculty/projects",
} as const;

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export const DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
  "Senior Lecturer",
] as const;

export const DEPARTMENTS = [
  "Computer Science",
  "Software Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
] as const;

export const PHASE_ORDER = ["synopsis", "progress", "demo", "final"] as const;