"use client";

import { useAuth } from "@/context/AuthContext";
import { useStats } from "@/hooks/useStats";
import { FolderOpen, Users } from "lucide-react";
import { InlineSpinner, PageHeader, StatCard } from "@/components/ui";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { stats, loading } = useStats();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name}.`}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <InlineSpinner /> Loading stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            icon={<FolderOpen />}
            color="blue"
            value={stats.totalProjects}
            label="Total Projects"
          />
          <StatCard
            icon={<Users />}
            color="purple"
            value={stats.totalFaculty}
            label="Total Faculty"
          />
        </div>
      )}
    </div>
  );
}
