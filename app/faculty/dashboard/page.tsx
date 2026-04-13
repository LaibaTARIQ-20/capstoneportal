"use client";

import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { FolderOpen, ClipboardList } from "lucide-react";
import { InlineSpinner, PageHeader, StatCard } from "@/components/ui";

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const { projects, loading } = useProjects(user?.uid);

  const pending = projects.filter((p) => p.status === "pending").length;

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name}.`}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <InlineSpinner /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg">
          <StatCard
            icon={<FolderOpen />}
            color="blue"
            value={projects.length}
            label="My Projects"
          />
          <StatCard
            icon={<ClipboardList />}
            color="yellow"
            value={pending}
            label="Pending Review"
          />
        </div>
      )}
    </div>
  );
}
