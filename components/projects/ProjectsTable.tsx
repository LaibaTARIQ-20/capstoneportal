"use client";

import { useRouter } from "next/navigation";
import { Trash2, Eye } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog, DataTable } from "@/components/ui";
import type { ColumnDef, BulkAction } from "@/components/ui";
import type { Project } from "@/types";

interface ProjectsTableProps {
  projects: Project[];
  isAdmin?: boolean;
  onDelete?: (id: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
}

export default function ProjectsTable({
  projects,
  isAdmin = false,
  onDelete,
  onBulkDelete,
}: ProjectsTableProps) {
  const router = useRouter();
  const { confirm, options, handleConfirm, handleCancel } = useConfirm();

  // ── Column definitions ──────────────────────────────────────────────────────
  const columns: ColumnDef<Project>[] = [
    {
      key: "index",
      header: "#",
      className: "w-10 text-gray-400 text-xs font-medium",
      cell: (_, index) => index + 1,
    },
    {
      key: "title",
      header: "Project Title",
      sortable: true,
      cell: (project) => (
        <div>
          <p className="font-semibold text-gray-900 max-w-[200px] truncate">
            {project.title}
          </p>
          {project.sdg && (
            <p className="text-xs text-green-600 mt-0.5">{project.sdg}</p>
          )}
        </div>
      ),
    },
    {
      key: "supervisor",
      header: "Supervisor",
      sortable: true,
      cell: (project) => (
        <span className="text-gray-700 font-medium">
          {project.supervisor || "—"}
        </span>
      ),
    },
    {
      key: "students",
      header: "Members",
      cell: (project) => {
        const count =
          Array.isArray(project.students) && project.students.length > 0
            ? project.students.length
            : (project.studentCount ?? 0);
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {count} Members
          </span>
        );
      },
    },
    {
      key: "industrialPartner",
      header: "Industrial Partner",
      cell: (project) => (
        <span className="text-gray-600 text-xs">
          {!project.industrialPartner || project.industrialPartner === "None"
            ? "—"
            : project.industrialPartner}
        </span>
      ),
    },
  ];

  // ── Bulk actions ────────────────────────────────────────────────────────────
  const bulkActions: BulkAction[] = isAdmin && onBulkDelete
    ? [
        {
          label: "Delete Selected",
          icon: <Trash2 size={13} />,
          colorClass: "bg-red-600 hover:bg-red-700 text-white",
          onClick: async (ids) => {
            const ok = await confirm({
              title: "Delete Selected Projects",
              message: `Are you sure you want to delete ${ids.length} project${ids.length > 1 ? "s" : ""}? This cannot be undone.`,
              confirmLabel: "Delete All",
              confirmColor: "red",
            });
            if (ok) await onBulkDelete(ids);
          },
        },
      ]
    : [];

  return (
    <>
      <ConfirmDialog
        isOpen={!!options}
        title={options?.title ?? ""}
        message={options?.message ?? ""}
        confirmLabel={options?.confirmLabel}
        confirmColor={options?.confirmColor}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <DataTable
        data={projects}
        columns={columns}
        rowIdKey="id"
        countLabel="project"
        searchPlaceholder="Search projects…"
        searchFields={["title", "supervisor", "industrialPartner"]}
        selectable={isAdmin}
        bulkActions={bulkActions}
        emptyMessage="No projects found."
        renderRowActions={(project, { isEditing: _ }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                router.push(
                  isAdmin
                    ? `/admin/projects/${project.id}`
                    : `/faculty/projects/${project.id}`
                )
              }
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Eye size={13} /> View
            </button>
            {isAdmin && onDelete && (
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: "Delete Project",
                    message: `Are you sure you want to delete "${project.title}"? This cannot be undone.`,
                    confirmLabel: "Delete",
                    confirmColor: "red",
                  });
                  if (ok) await onDelete(project.id);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        )}
      />
    </>
  );
}
