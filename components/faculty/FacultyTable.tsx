/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Plus, Pencil, Check, X, Search } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
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

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = faculty.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.name?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.department?.toLowerCase().includes(q) ||
      f.designation?.toLowerCase().includes(q)
    );
  });

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleAll = () =>
    setSelected(
      selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map((f) => f.uid)),
    );

  const toggleOne = (uid: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(uid) ? n.delete(uid) : n.add(uid);
      return n;
    });

  // ── Inline edit ────────────────────────────────────────────────────────────
  const startEdit = (member: UserProfile) => {
    setEditingId(member.uid);
    setEditData({
      name: member.name,
      department: member.department,
      designation: member.designation,
      phone: member.phone,
    });
  };

  const saveEdit = async (uid: string) => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(uid, editData);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (uid: string, name: string) => {
    const ok = await confirm({
      title: "Delete Faculty",
      message: `"${name}" will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      confirmColor: "red",
    });
    if (!ok || !onDelete) return;
    await onDelete(uid);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    const ok = await confirm({
      title: `Delete ${ids.length} Faculty`,
      message: `All ${ids.length} selected members will be permanently removed.`,
      confirmLabel: "Delete All",
      confirmColor: "red",
    });
    if (!ok || !onBulkDelete) return;
    await onBulkDelete(ids);
    setSelected(new Set());
  };

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

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Toolbar */}
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
          {/* Search - takes available space */}
          <div className="relative min-w-50 flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Right side actions — always together */}
          <div className="flex items-center gap-3 ml-auto">
            {selected.size > 0 && allowDelete && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <Trash2 size={14} /> Delete ({selected.size})
              </button>
            )}
            {showAddButton && (
              <button
                onClick={onAdd}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} /> Add Faculty
              </button>
            )}
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {filtered.length} members
            </span>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {allowDelete && (
                  <th className="px-5 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selected.size === filtered.length && filtered.length > 0
                      }
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Department</th>
                <th className="px-5 py-3 text-left">Designation</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={allowDelete ? 6 : 5}
                    className="px-5 py-12 text-center text-sm text-gray-400"
                  >
                    No faculty found.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => {
                  const isEditing = editingId === member.uid;
                  return (
                    <tr
                      key={member.uid}
                      className={`transition-colors ${
                        selected.has(member.uid)
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {allowDelete && (
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(member.uid)}
                            onChange={() => toggleOne(member.uid)}
                            className="rounded"
                          />
                        </td>
                      )}

                      {/* Name */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            {isEditing ? (
                              <input
                                className="rounded border border-gray-200 px-2 py-1 text-sm w-36"
                                value={editData.name ?? ""}
                                onChange={(e) =>
                                  setEditData((d) => ({
                                    ...d,
                                    name: e.target.value,
                                  }))
                                }
                              />
                            ) : (
                              <p className="font-medium text-gray-900">
                                {member.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <select
                            className="rounded border border-gray-200 px-2 py-1 text-sm"
                            value={editData.department ?? ""}
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                department: e.target.value,
                              }))
                            }
                          >
                            {DEPARTMENTS.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-700">
                            {member.department}
                          </span>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <select
                            className="rounded border border-gray-200 px-2 py-1 text-sm"
                            value={editData.designation ?? ""}
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                designation: e.target.value,
                              }))
                            }
                          >
                            {DESIGNATIONS.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-700">
                            {member.designation}
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input
                            className="rounded border border-gray-200 px-2 py-1 text-sm w-32"
                            value={editData.phone ?? ""}
                            onChange={(e) =>
                              setEditData((d) => ({
                                ...d,
                                phone: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <span className="text-gray-600">{member.phone}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(member.uid)}
                                disabled={saving}
                                className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                              >
                                <X size={15} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  router.push(`/admin/faculty/${member.uid}`)
                                }
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <Eye size={15} />
                              </button>
                              {allowInlineEdit && (
                                <button
                                  onClick={() => startEdit(member)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                              )}
                              {allowDelete && onDelete && (
                                <button
                                  onClick={() =>
                                    handleDelete(member.uid, member.name)
                                  }
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
