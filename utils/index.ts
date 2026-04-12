import { Timestamp } from "firebase/firestore";
import { ProjectStatus } from "@/types";

export function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getStudentCount(students: string[]): number {
  return students.filter((s) => s.trim() !== "").length;
}

export function getSdgColor(sdg: string): string {
  const num = parseInt(sdg);
  if (isNaN(num)) return "bg-gray-100 text-gray-600";
  const colors = [
    "bg-red-100 text-red-700",
    "bg-yellow-100 text-yellow-700",
    "bg-green-100 text-green-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
  ];
  return colors[num % colors.length];
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-");
}