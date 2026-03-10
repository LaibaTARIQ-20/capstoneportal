"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  FolderOpen,
  Users,
  LogOut,
  LayoutDashboard,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  Venus,
  Mars,
} from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Faculty {
  id: string;
  name: string;
  email: string;
  gender: "Male" | "Female";
  department: string;
  designation: string;
  phone: string;
  projects: FacultyProject[];
}

interface FacultyProject {
  id: string;
  title: string;
  status: string;
  studentCount: number;
}

// ─────────────────────────────────────────────
// Dummy Data
// ─────────────────────────────────────────────
const DUMMY_FACULTY: Record<string, Faculty> = {
  FAC001: {
    id: "FAC001",
    name: "Dr. Ayesha Malik",
    email: "ayesha.malik@university.edu",
    gender: "Female",
    department: "Software Engineering",
    designation: "Associate Professor",
    phone: "03001234567",
    projects: [
      {
        id: "1",
        title: "AI-Based Smart Attendance System",
        status: "pending",
        studentCount: 3,
      },
      {
        id: "3",
        title: "Blockchain Voting System",
        status: "accepted",
        studentCount: 3,
      },
      {
        id: "6",
        title: "E-Learning Recommendation System",
        status: "accepted",
        studentCount: 2,
      },
      {
        id: "9",
        title: "Online Thesis Repository",
        status: "accepted",
        studentCount: 3,
      },
    ],
  },
  FAC002: {
    id: "FAC002",
    name: "Dr. Imran Khalid",
    email: "imran.khalid@university.edu",
    gender: "Male",
    department: "Computer Science",
    designation: "Assistant Professor",
    phone: "03011234567",
    projects: [
      {
        id: "2",
        title: "Food Waste Reduction App",
        status: "under_review",
        studentCount: 2,
      },
      {
        id: "5",
        title: "AI Resume Analyzer",
        status: "pending",
        studentCount: 3,
      },
      {
        id: "8",
        title: "Smart Parking System",
        status: "pending",
        studentCount: 2,
      },
    ],
  },
  FAC003: {
    id: "FAC003",
    name: "Dr. Khalid Mehmood",
    email: "khalid.mehmood@university.edu",
    gender: "Male",
    department: "Information Technology",
    designation: "Professor",
    phone: "03021234567",
    projects: [
      {
        id: "4",
        title: "Smart Traffic Management System",
        status: "rejected",
        studentCount: 2,
      },
      {
        id: "7",
        title: "Health Monitoring IoT System",
        status: "under_review",
        studentCount: 3,
      },
      {
        id: "10",
        title: "AI Chatbot for Student Support",
        status: "pending",
        studentCount: 2,
      },
    ],
  },
  FAC004: {
    id: "FAC004",
    name: "Dr. Sana Javed",
    email: "sana.javed@university.edu",
    gender: "Female",
    department: "Software Engineering",
    designation: "Lecturer",
    phone: "03031234567",
    projects: [],
  },
};

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────
type ProjectStatus = "pending" | "under_review" | "accepted" | "rejected";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<ProjectStatus, string> = {
    pending: "bg-gray-100 text-gray-600",
    under_review: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  const labels: Record<ProjectStatus, string> = {
    pending: "Pending",
    under_review: "Under Review",
    accepted: "Accepted",
    rejected: "Rejected",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status as ProjectStatus]}`}
    >
      {labels[status as ProjectStatus]}
    </span>
  );
}

// ─────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────
function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .split(" ")
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white
        ${size === "lg" ? "h-16 w-16 text-xl" : "h-8 w-8 text-xs"}`}
    >
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function FacultyDetailPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [loggingOut, setLoggingOut] = useState(false);

  const facultyId = params.id as string;
  const faculty = DUMMY_FACULTY[facultyId];

  // ─────────────────────────────────────────────
  // Route protection
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "admin") {
      router.push("/faculty/dashboard");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  // Faculty not found
  if (!faculty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            Faculty not found
          </p>
          <Link
            href="/admin/faculty"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            ← Back to faculty list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <GraduationCap size={22} className="text-blue-400" />
          <span className="text-base font-bold text-white">
            Capstone Portal
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LayoutDashboard size={17} />
            Dashboard
          </Link>
          <Link
            href="/admin/projects"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <FolderOpen size={17} />
            Projects
          </Link>
          <Link
            href="/admin/faculty"
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white"
          >
            <Users size={17} />
            Faculty
          </Link>
        </nav>
        <div className="mt-auto">
          <div className="mb-3 rounded-lg bg-zinc-800 px-3 py-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-400">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <LogOut size={17} />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 flex-1 px-8 py-8">

        {/* Back Button */}
        <Link
          href="/admin/faculty"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Faculty
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Left — Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              {/* Avatar + Name */}
              <div className="mb-6 flex flex-col items-center text-center">
                <Avatar name={faculty.name} size="lg" />
                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  {faculty.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {faculty.designation}
                </p>
              </div>

              {/* Divider */}
              <div className="mb-5 h-px bg-gray-100" />

              {/* Info rows */}
              <div className="flex flex-col gap-4">

                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Email
                    </p>
                    <p className="text-sm text-gray-700">{faculty.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Phone
                    </p>
                    <p className="text-sm text-gray-700">{faculty.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2
                    size={16}
                    className="mt-0.5 shrink-0 text-gray-400"
                  />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Department
                    </p>
                    <p className="text-sm text-gray-700">
                      {faculty.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BadgeCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-gray-400"
                  />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Designation
                    </p>
                    <p className="text-sm text-gray-700">
                      {faculty.designation}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {faculty.gender === "Female" ? (
                    <Venus
                      size={16}
                      className="mt-0.5 shrink-0 text-pink-400"
                    />
                  ) : (
                    <Mars
                      size={16}
                      className="mt-0.5 shrink-0 text-blue-400"
                    />
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Gender
                    </p>
                    <p className="text-sm text-gray-700">{faculty.gender}</p>
                  </div>
                </div>

              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-gray-100" />

              {/* Edit Button */}
              <button className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                Edit Profile
              </button>

            </div>
          </div>

          {/* Right — Projects */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-gray-800">
                  Supervised Projects
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {faculty.projects.length} projects
                </span>
              </div>

              {/* Empty state */}
              {faculty.projects.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400">
                    No projects assigned yet
                  </p>
                </div>
              )}

              {/* Projects table */}
              {faculty.projects.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left">#</th>
                      <th className="px-6 py-3 text-left">Project Title</th>
                      <th className="px-6 py-3 text-left">Students</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {faculty.projects.map((project, index) => (
                      <tr
                        key={project.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-3 text-xs text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {project.title}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {project.studentCount} students
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={project.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
