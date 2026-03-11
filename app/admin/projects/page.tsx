"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProjectsTable from "@/components/ProjectsTable";
import {
  GraduationCap,
  FolderOpen,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

export default function FacultyProjectsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <GraduationCap size={22} className="text-blue-400" />
          <span className="text-base font-bold text-white">Capstone Portal</span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/faculty/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LayoutDashboard size={17} />
            Dashboard
          </Link>
          <Link
            href="/faculty/projects"
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white"
          >
            <FolderOpen size={17} />
            My Projects
          </Link>
        </nav>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Projects you are supervising. Contact admin to update status.
          </p>
        </div>

        {/* Pass real UID — filters only this faculty's projects */}
        <ProjectsTable
          isAdmin={false}
          supervisorId={user.uid}
        />
      </main>
    </div>
  );
}