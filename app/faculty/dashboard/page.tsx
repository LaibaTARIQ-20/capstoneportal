"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  GraduationCap,
  FolderOpen,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

export default function FacultyDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [totalProjects, setTotalProjects] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "faculty") router.push("/admin/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        // Search by both supervisorId and supervisor name
        const [byId, byName] = await Promise.all([
          getDocs(
            query(
              collection(db, "projects"),
              where("supervisorId", "==", user.uid),
            ),
          ),
          getDocs(
            query(
              collection(db, "projects"),
              where("supervisor", "==", user.name || ""),
            ),
          ),
        ]);
        // Deduplicate
        const ids = new Set<string>();
        [...byId.docs, ...byName.docs].forEach((d) => ids.add(d.id));
        setTotalProjects(ids.size);
      } catch {
        /* silent */
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = "/login";
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
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6 z-30">
        <div className="mb-8 flex items-center gap-2 px-2">
          <GraduationCap size={22} className="text-blue-400" />
          <span className="text-base font-bold text-white">
            Capstone Portal
          </span>
        </div>
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
        <div className="mt-auto">
          <div className="mb-3 rounded-lg bg-zinc-800 px-3 py-3">
            <p className="text-sm font-medium text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
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

      {/* Main */}
      <main className="ml-60 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user.name}.
          </p>
        </div>

        {statsLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg">
            <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-sm">
              <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-2">
                <FolderOpen size={20} className="text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {totalProjects}
              </p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gray-400">
                My Projects
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
