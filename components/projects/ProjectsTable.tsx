/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Eye, Search } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
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

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.supervisor?.toLowerCase().includes(q) ||
      p.industrialPartner?.toLowerCase().includes(q)
    );
  });

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelectAll = () =>
    setSelected(
      selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map((p) => p.id)),
    );

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // ── Delete single ──────────────────────────────────────────────────────────
  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: "Delete Project",
      message: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      confirmColor: "red",
    });
    if (!ok || !onDelete) return;
    setDeleting(id);
    try {
      await onDelete(id);
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    } finally {
      setDeleting(null);
    }
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    const ok = await confirm({
      title: "Delete Selected Projects",
      message: `Are you sure you want to delete ${ids.length} project${ids.length > 1 ? "s" : ""}? This cannot be undone.`,
      confirmLabel: "Delete All",
      confirmColor: "red",
    });
    if (!ok || !onBulkDelete) return;
    setBulkDeleting(true);
    try {
      await onBulkDelete(ids);
      setSelected(new Set());
    } finally {
      setBulkDeleting(false);
    }
  };

  const getStudentCount = (p: Project) =>
    Array.isArray(p.students) && p.students.length > 0
      ? p.students.length
      : (p.studentCount ?? 0);

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

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative flex-1 min-w-50 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          </p>
          {isAdmin && selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 ml-auto"
            >
              {bulkDeleting ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Trash2 size={13} />
              )}
              Delete {selected.size} Selected
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No projects found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selected.size === filtered.length &&
                          filtered.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Project Title</th>
                  <th className="px-5 py-3 text-left">Supervisor</th>
                  <th className="px-5 py-3 text-left">Members</th>
                  <th className="px-5 py-3 text-left">Industrial Partner</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((project, index) => (
                  <tr
                    key={project.id}
                    className={`transition-colors ${
                      selected.has(project.id)
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {isAdmin && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected.has(project.id)}
                          onChange={() => toggleSelect(project.id)}
                          className="rounded border-gray-300 cursor-pointer"
                        />
                      </td>
                    )}

                    <td className="px-5 py-4 text-gray-400 text-xs font-medium">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 max-w-50 truncate">
                        {project.title}
                      </p>
                      {project.sdg && (
                        <p className="text-xs text-green-600 mt-0.5">
                          {project.sdg}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-700 font-medium">
                      {project.supervisor || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {getStudentCount(project)} Members
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {!project.industrialPartner ||
                      project.industrialPartner === "None"
                        ? "—"
                        : project.industrialPartner}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              isAdmin
                                ? `/admin/projects/${project.id}`
                                : `/faculty/projects/${project.id}`,
                            )
                          }
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          <Eye size={13} /> View
                        </button>
                        {isAdmin && onDelete && (
                          <button
                            onClick={() =>
                              handleDelete(project.id, project.title)
                            }
                            disabled={deleting === project.id}
                            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deleting === project.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
