"use client";

import { useFaculty } from "@/hooks/useFaculty";
import FacultyTable from "@/components/faculty/FacultyTable";
import { LoadingSpinner, PageHeader } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function AdminFacultyPage() {
  const { faculty, loading, update, remove, bulkRemove } = useFaculty();
  const router = useRouter();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Faculty"
        subtitle="Manage all faculty members."
      />

      <FacultyTable
        faculty={faculty}
        onUpdate={update}
        onDelete={remove}
        onBulkDelete={bulkRemove}
        onAdd={() => router.push("/admin/faculty/new")}
        showAddButton={true}
        allowDelete={true}
        allowInlineEdit={true}
      />
    </div>
  );
}
