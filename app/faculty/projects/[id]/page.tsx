"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap, FolderOpen, LogOut,
  LayoutDashboard, ArrowLeft,
  User, Building2, Globe, Tag, Calendar, Users,
} from "lucide-react";
import Link from "next/link";
import ProjectsTable from "@/components/ProjectsTable";

interface Project {
  id: string;
  title: string;
  supervisor: string;
  supervisorId: string;
  coSupervisor: string;
  students: string[];
  studentCount: number;
  industrialPartner: string;
  sdg: string;
  status: string;
  uploadedAt: { seconds: number };
  updatedAt: { seconds: number };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    accepted:     "bg-green-50 text-green-700 border-green-200",
    rejected:     "bg-red-50 text-red-700 border-red-200",
    under_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
    pending:      "bg-gray-100 text-gray-600 border-gray-200",
  };
  const label: Record<string, string> = {
    accepted:     "Accepted",
    rejected:     "Rejected",
    under_review: "Under Review",
    pending:      "Pending",
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${map[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {label[status] || status}
    </span>
  );
}

export default function FacultyProjectDetailPage() {
  const params  = useParams();
  const id      = params?.id as string;
  const router  = useRouter();
  const { user, loading, logout } = useAuth();

  const [project, setProject]       = useState<Project | null>(null);
  const [fetching, setFetching]     = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Route protection ───────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "faculty") { router.push("/admin/dashboard"); return; }
  }, [user, loading, router]);

  // ─── Fetch project ───────────────────────────
  useEffect(() => {
    if (!id || loading || !user) return;
    const fetch = async () => {
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, "projects", id));
        if (snap.exists()) {
          setProject({ id: snap.id, ...snap.data() } as Project);
        } else {
          router.push("/faculty/projects");
        }
      } catch {
        router.push("/faculty/projects");
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, [id, user, loading, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = "/login";
  };

  const formatDate = (ts?: { seconds: number }) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-PK", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user || !project) return null;

  const students = Array.isArray(project.students) ? project.students : [];

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <GraduationCap size={22} className="text-blue-400" />
          <span className="text-base font-bold text-white">Capstone Portal</span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link href="/faculty/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <LayoutDashboard size={17} />Dashboard
          </Link>
          <Link href="/faculty/projects"
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white">
            <FolderOpen size={17} />My Projects
          </Link>
        </nav>
        <div className="mt-auto">
          <div className="mb-3 rounded-lg bg-zinc-800 px-3 py-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-400">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">Faculty</span>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50">
            <LogOut size={17} />{loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 px-8 py-8">

        <div className="mb-6">
          <button onClick={() => router.push("/faculty/projects")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} />Back to My Projects
          </button>
        </div>

        <div className="mb-4">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-mono text-gray-500">
            ID: {project.id}
          </span>
        </div>

        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 max-w-2xl">{project.title}</h1>
          <StatusBadge status={project.status} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <User size={14} />Supervisor
            </div>
            <p className="text-base font-semibold text-gray-900">{project.supervisor || "—"}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <User size={14} />Co-Supervisor
            </div>
            <p className="text-base font-semibold text-gray-900">
              {project.coSupervisor && project.coSupervisor !== "None" ? project.coSupervisor : "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Building2 size={14} />Industrial Partner
            </div>
            <p className="text-base font-semibold text-gray-900">
              {project.industrialPartner && project.industrialPartner !== "None" ? project.industrialPartner : "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Globe size={14} />SDG
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
              {project.sdg || "—"}
            </span>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Tag size={14} />Status
            </div>
            <StatusBadge status={project.status} />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Calendar size={14} />Dates
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Uploaded:</span> {formatDate(project.uploadedAt)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium text-gray-900">Updated:</span> {formatDate(project.updatedAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Users size={14} />Group Members ({students.length})
            </div>
            {students.length === 0 ? (
              <p className="text-sm text-gray-400">No students listed.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {students.map((student, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{student}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}