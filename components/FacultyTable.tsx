/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Pencil, Trash2, UserPlus, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Faculty {
  id: string;
  name: string;
  email: string;
  gender: "Male" | "Female";
  department: string;
  designation: string;
  phone: string;
}

export interface FacultyTableProps {
  /** Show the Add Faculty button in the header */
  showAddButton?: boolean;
  /** Show checkboxes and bulk-delete */
  allowDelete?: boolean;
  /** Allow inline row editing */
  allowInlineEdit?: boolean;
  /** Called after any mutation so parent can re-fetch counters */
  onMutation?: () => void;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
      {initials}
    </div>
  );
}

function GenderBadge({ gender }: { gender: "Male" | "Female" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        gender === "Female"
          ? "bg-pink-100 text-pink-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {gender}
    </span>
  );
}

function DesignationBadge({ designation }: { designation: string }) {
  const map: Record<string, string> = {
    Professor: "bg-purple-100 text-purple-700",
    "Associate Professor": "bg-blue-100 text-blue-700",
    "Assistant Professor": "bg-cyan-100 text-cyan-700",
    Lecturer: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[designation] ?? "bg-gray-100 text-gray-700"}`}
    >
      {designation || "—"}
    </span>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function FacultyTable({
  showAddButton = true,
  allowDelete = true,
  allowInlineEdit = true,
  onMutation,
}: FacultyTableProps) {
  const router = useRouter();

  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Faculty>>({});
  const [editSaving, setEditSaving] = useState(false);

  // Dialog state
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    detail?: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Delete",
    onConfirm: () => {},
  });
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  // ── Fetch ───────────────────────────────────
  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("role", "==", "faculty")),
      );
      setFacultyList(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Faculty[],
      );
    } catch {
      toast.error("Failed to load faculty");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  // ── Filtered list ────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return facultyList;
    return facultyList.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q) ||
        f.department?.toLowerCase().includes(q) ||
        f.designation?.toLowerCase().includes(q),
    );
  }, [search, facultyList]);

  // ── Inline edit ──────────────────────────────
  const startEdit = (f: Faculty) => {
    setEditingId(f.id);
    setEditForm({
      name: f.name,
      department: f.department,
      designation: f.designation,
      phone: f.phone,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    setEditSaving(true);
    try {
      await updateDoc(doc(db, "users", id), editForm);
      setFacultyList((prev) =>
        prev.map((f) => (f.id === id ? ({ ...f, ...editForm } as Faculty) : f)),
      );
      setEditingId(null);
      toast.success("Faculty updated");
      onMutation?.();
    } catch {
      toast.error("Failed to update faculty");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete single ────────────────────────────
  const confirmDelete = (id: string, name: string) => {
    setDialog({
      open: true,
      title: "Delete Faculty Member",
      message: `Are you sure you want to delete "${name}"?`,
      detail: "This permanently removes their account and cannot be undone.",
      confirmLabel: "Yes, Delete",
      onConfirm: async () => {
        closeDialog();
        setDeletingId(id);
        try {
          await deleteDoc(doc(db, "users", id));
          setFacultyList((prev) => prev.filter((f) => f.id !== id));
          setSelected((prev) => {
            const n = new Set(prev);
            n.delete(id);
            return n;
          });
          toast.success(`${name} deleted`);
          onMutation?.();
        } catch {
          toast.error("Failed to delete");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // ── Bulk delete ──────────────────────────────
  const confirmBulkDelete = () => {
    if (!selected.size) return;
    setDialog({
      open: true,
      title: "Delete Selected Faculty",
      message: `Delete ${selected.size} faculty member${selected.size > 1 ? "s" : ""}?`,
      detail:
        "Their accounts will be permanently removed. This cannot be undone.",
      confirmLabel: `Delete ${selected.size} Member${selected.size > 1 ? "s" : ""}`,
      onConfirm: async () => {
        closeDialog();
        setBulkDeleting(true);
        try {
          const batch = writeBatch(db);
          selected.forEach((id) => batch.delete(doc(db, "users", id)));
          await batch.commit();
          setFacultyList((prev) => prev.filter((f) => !selected.has(f.id)));
          setSelected(new Set());
          toast.success(
            `${selected.size} member${selected.size > 1 ? "s" : ""} deleted`,
          );
          onMutation?.();
        } catch {
          toast.error("Bulk delete failed");
        } finally {
          setBulkDeleting(false);
        }
      },
    });
  };

  // ── Selection ────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    setSelected(
      selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map((f) => f.id)),
    );
  };

  const inputCls =
    "w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400";

  const dialogMessage = dialog.detail
    ? `${dialog.message}\n\n${dialog.detail}`
    : dialog.message;

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );

  return (
    <>
      <ConfirmDialog
        isOpen={dialog.open}
        title={dialog.title}
        message={dialogMessage}
        confirmLabel={dialog.confirmLabel}
        onConfirm={dialog.onConfirm}
        onCancel={closeDialog}
      />

      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
          <p className="mt-1 text-sm text-gray-600">Manage faculty members.</p>
        </div>
        {showAddButton && (
          <button
            onClick={() => router.push("/admin/faculty/new")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={15} />
            Add Faculty
          </button>
        )}
      </div>

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
              placeholder="Search faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {filtered.length} of {facultyList.length} member
            {facultyList.length !== 1 ? "s" : ""}
          </p>
          {allowDelete && selected.size > 0 && (
            <button
              onClick={confirmBulkDelete}
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

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            {search
              ? `No results for "${search}"`
              : "No faculty members found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {allowDelete && (
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={
                          selected.size === filtered.length &&
                          filtered.length > 0
                        }
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Gender</th>
                  <th className="px-5 py-3 text-left">Department</th>
                  <th className="px-5 py-3 text-left">Designation</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((f, index) => {
                  const isEditing = editingId === f.id;
                  return (
                    <tr
                      key={f.id}
                      className={`transition-colors ${
                        selected.has(f.id)
                          ? "bg-blue-50"
                          : isEditing
                            ? "bg-amber-50/40"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      {allowDelete && (
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selected.has(f.id)}
                            onChange={() => toggleSelect(f.id)}
                            className="rounded border-gray-300 text-blue-600 cursor-pointer"
                          />
                        </td>
                      )}

                      <td className="px-5 py-3.5 text-xs font-medium text-gray-400">
                        {index + 1}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <input
                            value={editForm.name ?? ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className={inputCls}
                          />
                        ) : (
                          <button
                            onClick={() =>
                              router.push(`/admin/faculty/${f.id}`)
                            }
                            className="flex items-center gap-3 group text-left"
                          >
                            <Avatar name={f.name} />
                            <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {f.name}
                            </span>
                          </button>
                        )}
                      </td>

                      {/* Email — never editable */}
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {f.email}
                      </td>

                      {/* Gender — never editable */}
                      <td className="px-5 py-3.5">
                        <GenderBadge gender={f.gender} />
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <input
                            value={editForm.department ?? ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                department: e.target.value,
                              })
                            }
                            className={inputCls}
                            placeholder="Department"
                          />
                        ) : (
                          <span className="text-gray-700">
                            {f.department || "—"}
                          </span>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <select
                            value={editForm.designation ?? ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                designation: e.target.value,
                              })
                            }
                            className={inputCls}
                          >
                            <option value="Professor">Professor</option>
                            <option value="Associate Professor">
                              Associate Professor
                            </option>
                            <option value="Assistant Professor">
                              Assistant Professor
                            </option>
                            <option value="Lecturer">Lecturer</option>
                          </select>
                        ) : (
                          <DesignationBadge designation={f.designation} />
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <input
                            value={editForm.phone ?? ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                phone: e.target.value,
                              })
                            }
                            className={inputCls}
                            placeholder="Phone"
                          />
                        ) : (
                          <span className="text-gray-500 text-xs">
                            {f.phone || "—"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(f.id)}
                              disabled={editSaving}
                              className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              {editSaving ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                              ) : (
                                <Check size={12} />
                              )}
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              <X size={12} />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {allowInlineEdit && (
                              <button
                                onClick={() => startEdit(f)}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                              >
                                <Pencil size={12} />
                                Edit
                              </button>
                            )}
                            {allowDelete && (
                              <button
                                onClick={() => confirmDelete(f.id, f.name)}
                                disabled={deletingId === f.id}
                                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {deletingId === f.id ? (
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
