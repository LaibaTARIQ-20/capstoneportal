import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "faculty";

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

export interface FacultyFormData {
  name: string;
  email: string;
  password: string;         // only used on create, empty on edit
  gender: "Male" | "Female";
  department: string;
  designation: string;
  phone: string;
}