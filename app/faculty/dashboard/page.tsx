"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection, getDocs, query, where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  GraduationCap, FolderOpen, LogOut,
  LayoutDashboard, CheckCircle, Clock,
  AlertCircle, XCircle,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  total:    number;
  accepted: number;
  inReview: number;
  pending:  number;
  rejected: number;
}

export default function FacultyDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats]         = useState<Stats>({
    total: 0, accepted: 0, inReview: 0, pending: 0, rejected: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [loggingOut, setLoggingOut]     = useState(false);

  // ─── Route protection ───────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "faculty") router.push("/admin/dashboard");
  }, [user, loading, router]);

  // ─── Load stats ─────────────────────────────
  useEffect(() => {
    if (!user?.uid || user.role !== "faculty") return;

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const snap = await getDocs(
          query(
            collection(db, "projects"),
            where("supervisorId", "==", user.uid)
          )
        );
        const projects = snap.docs.map((d) => d.data());

        setStats({
          total:    projects.length,
          accepted: projects.filter((p) => p.status === "accepted").length,
          inReview: projects.filter((p) => p.status === "under_review").length,
          pending:  projects.filter((p) => p.status === "pending").length,
          rejected: projects.filter((p) => p.status === "rejected").length,
        });
      } catch {
        // silent
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

  const statCards = [
    {
      label: "My Projects",
      value: stats.total,
      icon:  <FolderOpen size={18} className="text-blue-600" />,
      bg:    "bg-blue-50",
    },
    {
      label: "Accepted",
      value: stats.accepted,
      icon:  <CheckCircle size={18} className="text-green-600" />,
      bg:    "bg-green-50",
    },
    {
      label: "In Review",
      value: stats.inReview,
      icon:  <Clock size={18} className="text-yellow-600" />,
      bg:    "bg-yellow-50",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon:  <AlertCircle size={18} className="text-orange-500" />,
      bg:    "bg-orange-50",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon:  <XCircle size={18} className="text-red-500" />,
      bg:    "bg-red-50",
    },
  ];

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
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white">
            <LayoutDashboard size={17} />Dashboard
          </Link>
          <Link href="/faculty/projects"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <FolderOpen size={17} />My Projects
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
          <button onClick={handleLogout} disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50">
            <LogOut size={17} />{loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user.name}. Here are your project stats.
          </p>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            Loading stats...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm"
              >
                <div className={`mb-3 inline-flex rounded-xl p-2 ${card.bg}`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {card.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}