"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import ProjectsTable from "@/components/ProjectsTable";
import ExcelUpload from "@/components/ExcelUpload";

export default function AdminProjectsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

      <ProjectsTable key={refreshKey} isAdmin={true} />

      {showUpload && (
        <ExcelUpload
          onImportComplete={() => setRefreshKey((k) => k + 1)}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
