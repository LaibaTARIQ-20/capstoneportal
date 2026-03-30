"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  GraduationCap,
  LayoutDashboard,
  FolderOpen,
  LogOut,
} from "lucide-react";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "faculty") {
      router.push("/admin/dashboard");
      return;
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/faculty/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — shared, never re-mounts */}
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
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive("/faculty/dashboard")
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <LayoutDashboard size={17} />
            Dashboard
          </Link>
          <Link
            href="/faculty/projects"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive("/faculty/projects")
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <FolderOpen size={17} />
            Projects
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

      {/* Page content */}
      <main className="ml-60 flex-1 min-h-screen">{children}</main>
    </div>
  );
}
