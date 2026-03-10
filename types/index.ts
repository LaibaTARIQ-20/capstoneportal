import { Timestamp } from "firebase/firestore";

// ─────────────────────────────────────────────
// 1. User Roles
// ─────────────────────────────────────────────
export type UserRole = "admin" | "faculty";

// ─────────────────────────────────────────────
// 2. Project Status
// ─────────────────────────────────────────────
export type ProjectStatus =
  | "pending"
  | "under_review"
  | "accepted"
  | "rejected";

// ─────────────────────────────────────────────
// 3. User / Faculty Profile
// ─────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  gender: "Male" | "Female";
  department: string;
  designation: string;
  phone: string;
  joinedAt: Timestamp;
  profileComplete: boolean;
}

// ─────────────────────────────────────────────
// 4. Project
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// 5. Form data for creating a new project
// ─────────────────────────────────────────────
export interface ProjectFormData {
  title: string;
  description: string;
  studentsRaw: string;       // comma separated string from input
  coSupervisor: string;      // empty string if none
  industrialPartner: string;
  sdg: string;
}

// ─────────────────────────────────────────────
// 6. Form data for adding / editing faculty
// ─────────────────────────────────────────────
export interface FacultyFormData {
  name: string;
  email: string;
  password: string;          // only used on create, empty on edit
  gender: "Male" | "Female";
  department: string;
  designation: string;
  phone: string;
}

// ─────────────────────────────────────────────
// 7. Auth context shape
// ─────────────────────────────────────────────
export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// ─────────────────────────────────────────────
// 8. Sidebar nav link shape
// ─────────────────────────────────────────────
export interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}