"use client";

import { useFaculty } from "@/hooks/useFaculty";
import FacultyTable from "@/components/faculty/FacultyTable";
import { LoadingSpinner } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function AdminFacultyPage() {
  const { faculty, loading, update, remove, bulkRemove } = useFaculty();
  const router = useRouter();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage all faculty members.
        </p>
      </div>

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
