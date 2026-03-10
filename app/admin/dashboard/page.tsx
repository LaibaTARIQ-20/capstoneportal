"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  FolderOpen,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  LogOut,
  LayoutDashboard,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import page from "@/app/login/page";
import { Sign } from "crypto";

// ─────────────────────────────────────────────
// Dummy stats — will come from Firestore later
// ─────────────────────────────────────────────
const STATS = {
  totalProjects: 10,
  totalFaculty: 4,
  accepted: 3,
  underReview: 2,
  pending: 4,
  rejected: 1,
};

// ─────────────────────────────────────────────
// Recent projects preview
// ─────────────────────────────────────────────
const RECENT_PROJECTS = [
  {
    id: "1",
    title: "AI-Based Smart Attendance System",
    supervisor: "Dr. Ayesha Malik",
    status: "pending",
  },
  {
    id: "2",
    title: "Food Waste Reduction App",
    supervisor: "Dr. Imran Khalid",
    status: "under_review",
  },
  {
    id: "3",
    title: "Blockchain Voting System",
    supervisor: "Dr. Ayesha Malik",
    status: "accepted",
  },
  {
    id: "4",
    title: "Smart Traffic Management System",
    supervisor: "Dr. Khalid Mehmood",
    status: "rejected",
  },
  {
    id: "5",
    title: "AI Resume Analyzer",
    supervisor: "Dr. Imran Khalid",
    status: "pending",
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

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // ─────────────────────────────────────────────
  // Route protection
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
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
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white"
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
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Users size={17} />
            Faculty
          </Link>
        </nav>

        {/* User + Logout at bottom */}
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

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user.name.split(" ")[0]}. Here is your overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Projects
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {STATS.totalProjects}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Users size={16} className="text-purple-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Faculty
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {STATS.totalFaculty}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Accepted
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {STATS.accepted}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Clock size={16} className="text-yellow-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                In Review
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {STATS.underReview}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Pending
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {STATS.pending}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <XCircle size={16} className="text-red-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Rejected
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {STATS.rejected}
            </p>
          </div>

        </div>

        {/* Recent Projects */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Recent Projects
            </h2>
            <Link
              href="/admin/projects"
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
                <th className="px-6 py-3 text-left">Supervisor</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RECENT_PROJECTS.map((project, index) => (
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
                    {project.supervisor}
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
