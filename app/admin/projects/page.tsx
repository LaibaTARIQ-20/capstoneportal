"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import ProjectsTable from "@/components/projects/ProjectsTable";
import ExcelUpload from "@/components/ExcelUpload";
import { LoadingSpinner } from "@/components/ui";

export default function AdminProjectsPage() {
  const { projects, loading, remove, bulkRemove, refetch } = useProjects();
  const [showUpload, setShowUpload] = useState(false);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage all final year projects.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
        >
          <FileSpreadsheet size={15} />
          Import from Excel
        </button>
      </div>

      <ProjectsTable
        projects={projects}
        isAdmin={true}
        onDelete={remove}
        onBulkDelete={bulkRemove}
      />

      {showUpload && (
        <ExcelUpload
          onImportComplete={refetch}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
