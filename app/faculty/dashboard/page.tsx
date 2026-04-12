"use client";

import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { FolderOpen, ClipboardList } from "lucide-react";
import { InlineSpinner } from "@/components/ui";

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const { projects, loading } = useProjects(user?.uid);

  const pending = projects.filter((p) => p.status === "pending").length;

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.name}.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <InlineSpinner /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg">
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-sm">
            <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-2">
              <FolderOpen size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {projects.length}
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gray-400">
              My Projects
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-sm">
            <div className="mb-3 inline-flex rounded-xl bg-yellow-50 p-2">
              <ClipboardList size={20} className="text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{pending}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Pending Review
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
