"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap, FolderOpen, Users, LogOut,
  LayoutDashboard, ArrowLeft, Trash2,
  User, Building2, Globe,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// ── NO status, NO dates in this interface ──
interface Project {
  id: string;
  title: string;
  supervisor: string;
  coSupervisor: string;
  students: string[];
  studentCount: number;
  industrialPartner: string;
  sdg: string;
}

export default function AdminProjectDetailPage() {
  const params  = useParams();
  const id      = params?.id as string;
  const router  = useRouter();
  const { user, loading, logout } = useAuth();

  const [project, setProject]       = useState<Project | null>(null);
  const [fetching, setFetching]     = useState(true);
  const [deleting, setDeleting]     = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/faculty/dashboard"); return; }
  }, [user, loading, router]);

  useEffect(() => {
    if (!id || loading || !user) return;
    const fetchProject = async () => {
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, "projects", id));
        if (snap.exists()) {
          setProject({ id: snap.id, ...snap.data() } as Project);
        } else {
          router.push("/admin/projects");
        }
      } catch {
        router.push("/admin/projects");
      } finally {
        setFetching(false);
      }
    };
    fetchProject();
  }, [id, user, loading, router]);

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "projects", project.id));
      toast.success("Project deleted");
      router.push("/admin/projects");
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = "/login";
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
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6 z-30">
        <div className="mb-8 flex items-center gap-2 px-2">
          <GraduationCap size={22} className="text-blue-400" />
          <span className="text-base font-bold text-white">Capstone Portal</span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <LayoutDashboard size={17} />Dashboard
          </Link>
          <Link href="/admin/projects"
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white">
            <FolderOpen size={17} />Projects
          </Link>
          <Link href="/admin/faculty"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <Users size={17} />Faculty
          </Link>
        </nav>
        <div className="mt-auto">
          <div className="mb-3 rounded-lg bg-zinc-800 px-3 py-3">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
              Admin
            </span>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50">
            <LogOut size={17} />{loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 px-4 py-6 md:px-8 md:py-8">

        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => router.push("/admin/projects")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} />Back to Projects
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50">
            {deleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Delete Project
              </>
            )}
          </button>
        </div>

        {/* Project ID */}
        <p className="mb-3 text-xs font-mono text-gray-400">
          ID: {project.id}
        </p>

        {/* Title */}
        <h1 className="mb-8 text-2xl font-bold text-gray-900 leading-snug">
          {project.title}
        </h1>

        {/* Cards — NO status card, NO dates card */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Supervisor */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              <User size={13} />
              Supervisor
            </div>
            <p className="text-base font-bold text-gray-900">
              {project.supervisor || "—"}
            </p>
          </div>

          {/* Co-Supervisor */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              <User size={13} />
              Co-Supervisor
            </div>
            <p className="text-base font-bold text-gray-900">
              {project.coSupervisor && project.coSupervisor !== "None"
                ? project.coSupervisor
                : "—"}
            </p>
          </div>

          {/* Industrial Partner */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              <Building2 size={13} />
              Industrial Partner
            </div>
            <p className="text-base font-bold text-gray-900">
              {project.industrialPartner && project.industrialPartner !== "None"
                ? project.industrialPartner
                : "—"}
            </p>
          </div>

          {/* SDG */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              <Globe size={13} />
              SDG
            </div>
            <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
              {project.sdg || "—"}
            </span>
          </div>

          {/* Group Members — full width */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              <Users size={13} />
              Group Members ({students.length})
            </div>
            {students.length === 0 ? (
              <p className="text-sm text-gray-400">No students listed.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {students.map((student, i) => (
                  <div key={i}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {student}
                    </span>
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
