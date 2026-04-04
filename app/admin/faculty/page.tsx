"use client";

import { useState } from "react";
import FacultyTable from "@/components/FacultyTable";
import FacultyExcelUpload from "@/components/FacultyExcelUpload";

export default function AdminFacultyPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <button type="button" onClick={() => setShowUpload(true)}>
        Import Faculty
      </button>

      {/* FacultyTable handles all fetch / search / inline-edit / delete */}
      <FacultyTable
        key={refreshKey}
        showAddButton={true}
        allowDelete={true}
        allowInlineEdit={true}
        onMutation={() => setRefreshKey((k) => k + 1)}
      />

      {showUpload && (
        <FacultyExcelUpload
          onImportComplete={() => setRefreshKey((k) => k + 1)}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
