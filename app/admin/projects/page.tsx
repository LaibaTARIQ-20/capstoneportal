"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import ProjectsTable from "@/components/projects/ProjectsTable";
import ExcelUpload from "@/components/ExcelUpload";
import { LoadingSpinner, PageHeader, Button } from "@/components/ui";

export default function AdminProjectsPage() {
  const { projects, loading, remove, bulkRemove, refetch } = useProjects();
  const [showUpload, setShowUpload] = useState(false);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Manage all final year projects."
        action={
          <Button
            variant="success"
            icon={<FileSpreadsheet />}
            onClick={() => setShowUpload(true)}
          >
            Import from Excel
          </Button>
        }
      />

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
