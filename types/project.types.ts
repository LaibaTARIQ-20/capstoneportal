import { Timestamp } from "firebase/firestore";

export type ProjectStatus =
  | "pending"
  | "under_review"
  | "accepted"
  | "rejected";

export interface Project {
  id: string;
  title: string;
  description: string;
  students: string[];
  studentCount: number;
  supervisor: string;
  supervisorId: string;
  coSupervisor: string | null;
  industrialPartner: string;
  sdg: string;
  status: ProjectStatus;
  uploadedBy: string;
  uploadedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProjectFormData {
  title: string;
  description: string;
  studentsRaw: string;      // comma-separated string from input
  coSupervisor: string;     // empty string if none
  industrialPartner: string;
  sdg: string;
}