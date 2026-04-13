"use client";

import { useRouter } from "next/navigation";
import { Eye, Trash2, Plus, Pencil } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog, DataTable } from "@/components/ui";
import type { ColumnDef, BulkAction, ToolbarAction } from "@/components/ui";
import { getInitials } from "@/utils";
import { DESIGNATIONS, DEPARTMENTS } from "@/constants";
import type { UserProfile } from "@/types";

interface FacultyTableProps {
  faculty: UserProfile[];
  onDelete?: (id: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onUpdate?: (id: string, data: Partial<UserProfile>) => Promise<void>;
  onAdd?: () => void;
  showAddButton?: boolean;
  allowDelete?: boolean;
  allowInlineEdit?: boolean;
}

export default function FacultyTable({
  faculty,
  onDelete,
  onBulkDelete,
  onUpdate,
  onAdd,
  showAddButton = false,
  allowDelete = false,
  allowInlineEdit = false,
}: FacultyTableProps) {
  const router = useRouter();
  const { confirm, options, handleConfirm, handleCancel } = useConfirm();

  // ── Column definitions ──────────────────────────────────────────────────────
  const columns: ColumnDef<UserProfile>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (member) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {getInitials(member.name)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{member.name}</p>
            <p className="text-xs text-gray-400">{member.email}</p>
          </div>
        </div>
      ),
      editCell: (_, form) => (
        <input
          {...form.register("name")}
          className="rounded border border-gray-200 px-2 py-1 text-sm w-36 focus:outline-none focus:border-blue-400"
          placeholder="Full name"
        />
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      cell: (member) => (
        <span className="text-gray-700">{member.department}</span>
      ),
      editCell: (_, form) => (
        <select
          {...form.register("department")}
          className="rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      sortable: true,
      cell: (member) => (
        <span className="text-gray-700">{member.designation}</span>
      ),
      editCell: (_, form) => (
        <select
          {...form.register("designation")}
          className="rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
        >
          {DESIGNATIONS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (member) => (
        <span className="text-gray-600">{member.phone || "—"}</span>
      ),
      editCell: (_, form) => (
        <input
          {...form.register("phone")}
          className="rounded border border-gray-200 px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-400"
          placeholder="Phone"
        />
      ),
    },
  ];

  // ── Bulk actions ────────────────────────────────────────────────────────────
  const bulkActions: BulkAction[] = allowDelete && onBulkDelete
    ? [
        {
          label: "Delete",
          icon: <Trash2 size={13} />,
          colorClass: "bg-red-600 hover:bg-red-700 text-white",
          onClick: async (ids) => {
            const ok = await confirm({
              title: `Delete ${ids.length} Faculty`,
              message: `All ${ids.length} selected members will be permanently removed.`,
              confirmLabel: "Delete All",
              confirmColor: "red",
            });
            if (ok) await onBulkDelete(ids);
          },
        },
      ]
    : [];

  // ── Toolbar actions ─────────────────────────────────────────────────────────
  const toolbarActions: ToolbarAction[] = showAddButton && onAdd
    ? [
        {
          label: "Add Faculty",
          icon: <Plus size={14} />,
          onClick: onAdd,
          colorClass: "bg-blue-600 hover:bg-blue-700 text-white",
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

      <DataTable<UserProfile>
        data={faculty}
        columns={columns}
        rowIdKey="uid"
        countLabel="member"
        searchPlaceholder="Search faculty…"
        searchFields={["name", "email", "department", "designation"]}
        selectable={allowDelete}
        bulkActions={bulkActions}
        toolbarActions={toolbarActions}
        allowInlineEdit={allowInlineEdit}
        onSaveRow={async (id, values) => {
          await onUpdate?.(id, values as Partial<UserProfile>);
        }}
        editDefaultValues={(member) => ({
          name: member.name,
          department: member.department,
          designation: member.designation,
          phone: member.phone,
        })}
        emptyMessage="No faculty found."
        renderRowActions={(member, { isEditing, startEdit }) => {
          if (isEditing) return null; // Save/Cancel already rendered by DataTable
          return (
            <>
              <button
                onClick={() => router.push(`/admin/faculty/${member.uid}`)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="View"
              >
                <Eye size={15} />
              </button>
              {allowInlineEdit && (
                <button
                  onClick={startEdit}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
              )}
              {allowDelete && onDelete && (
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete Faculty",
                      message: `"${member.name}" will be permanently removed. This cannot be undone.`,
                      confirmLabel: "Delete",
                      confirmColor: "red",
                    });
                    if (ok) await onDelete(member.uid);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </>
          );
        }}
      />
    </>
  );
}
