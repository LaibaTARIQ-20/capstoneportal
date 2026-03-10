/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  FolderOpen,
  LogOut,
  LayoutDashboard,
  CheckCircle,
  Clock,
  XCircle,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import page from "@/app/admin/faculty/[id]/page";

// ─────────────────────────────────────────────
// Dummy recent projects for this faculty
// ─────────────────────────────────────────────
const FACULTY_RECENT_PROJECTS = [
  {
    id: "1",
    title: "AI-Based Smart Attendance System",
    studentCount: 3,
    status: "pending",
  },
  {
    id: "3",
    title: "Blockchain Voting System",
    studentCount: 3,
    status: "accepted",
  },
  {
    id: "6",
    title: "E-Learning Recommendation System",
    studentCount: 2,
    status: "accepted",
  },
  {
    id: "9",
    title: "Online Thesis Repository",
    studentCount: 3,
    status: "accepted",
  },
];

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

export default function FacultyDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // ─────────────────────────────────────────────
  // Route protection
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "faculty") {
      router.push("/admin/dashboard");
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

  // ─────────────────────────────────────────────
  // Stats calculated from dummy data
  // ─────────────────────────────────────────────
  const totalProjects = FACULTY_RECENT_PROJECTS.length;
  const accepted = FACULTY_RECENT_PROJECTS.filter(
    (p) => p.status === "accepted"
  ).length;
  const pending = FACULTY_RECENT_PROJECTS.filter(
    (p) => p.status === "pending"
  ).length;
  const underReview = FACULTY_RECENT_PROJECTS.filter(
    (p) => p.status === "under_review"
  ).length;
  const rejected = FACULTY_RECENT_PROJECTS.filter(
    (p) => p.status === "rejected"
  ).length;

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6">

        {/* Brand */}
        <div className="mb-8 flex items-center gap-2 px-2">
          <GraduationCap size={22} className="text-blue-400" />
          <span className="text-base font-bold text-white">
            Capstone Portal
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1">
          <Link
            href="/faculty/dashboard"
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white"
          >
            <LayoutDashboard size={17} />
            Dashboard
          </Link>
          <Link
            href="/faculty/projects"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <FolderOpen size={17} />
            My Projects
          </Link>
        </nav>

        {/* User + Logout */}
        <div className="mt-auto">
          <div className="mb-3 rounded-lg bg-zinc-800 px-3 py-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-400">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
              Faculty
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

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user.name.split(" ")[0]}. Here are your projects.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Total
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Accepted
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{accepted}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Clock size={16} className="text-yellow-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                In Review
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{underReview}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <XCircle size={16} className="text-red-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Rejected
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{rejected}</p>
          </div>

        </div>

        {/* Recent Projects Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-800">
              My Recent Projects
            </h2>
            <Link
              href="/faculty/projects"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>

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
              {FACULTY_RECENT_PROJECTS.map((project, index) => (
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
        </div>

      </main>
    </div>
  );
}
