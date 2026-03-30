/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap, FolderOpen, Users,
  LogOut, LayoutDashboard,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router   = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = "/login";
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/projects",  label: "Projects",  icon: FolderOpen },
    { href: "/admin/faculty",   label: "Faculty",   icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar — never reloads */}
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6 z-30">
        <div className="mb-8 flex items-center gap-2 px-2">
          <GraduationCap size={22} className="text-blue-400" />
          <span className="text-base font-bold text-white">Capstone Portal</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          {user && (
            <div className="mb-3 rounded-lg bg-zinc-800 px-3 py-3">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                Admin
              </span>
            </div>
          )}
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

      {/* Content */}
      <main className="ml-60 flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}