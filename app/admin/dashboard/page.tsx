
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FolderOpen, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]               = useState({ totalProjects: 0, totalFaculty: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [projectsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "projects")),
          getDocs(query(collection(db, "users"), where("role", "==", "faculty"))),
        ]);
        setStats({
          totalProjects: projectsSnap.size,
          totalFaculty:  usersSnap.size,
        });
      } catch { /* silent */ }
      finally { setStatsLoading(false); }
    };
    fetchStats();
  }, [user]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.name}.
        </p>
      </div>

      {statsLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          Loading stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-sm">
            <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-2">
              <FolderOpen size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Total Projects
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-sm">
            <div className="mb-3 inline-flex rounded-xl bg-purple-50 p-2">
              <Users size={20} className="text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalFaculty}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Total Faculty
            </p>
          </div>
        </div>
      )}
    </div>
  );
}