"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Trash2, Pencil, X, Check } from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import Link from "next/link";

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

// ─────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
// Gender Badge
// ─────────────────────────────────────────────
function GenderBadge({ gender }: { gender: "Male" | "Female" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${gender === "Female"
          ? "bg-pink-50 text-pink-700"
          : "bg-blue-50 text-blue-700"
        }`}
    >
      {gender}
    </span>
  );
}

// ─────────────────────────────────────────────
// Designation Badge Colors
// ─────────────────────────────────────────────
function DesignationBadge({ designation }: { designation: string }) {
  const colorMap: Record<string, string> = {
    "Professor": "bg-purple-50 text-purple-700",
    "Associate Professor": "bg-blue-50 text-blue-700",
    "Assistant Professor": "bg-cyan-50 text-cyan-700",
    "Lecturer": "bg-green-50 text-green-700",
  };
  const style = colorMap[designation] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {designation}
    </span>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function FacultyTable() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Faculty>>({});

  // ─────────────────────────────────────────────
  // Fetch from Firestore
  // ─────────────────────────────────────────────
  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((u: any) => u.role === "faculty") as Faculty[];
      setFaculty(data);
    } catch {
      toast.error("Failed to load faculty");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  // ─────────────────────────────────────────────
  // Search Filter
  // ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return faculty;
    return faculty.filter(
      (f) =>
        f.name?.toLowerCase().includes(term) ||
        f.email?.toLowerCase().includes(term) ||
        f.department?.toLowerCase().includes(term) ||
        f.designation?.toLowerCase().includes(term)
    );
  }, [search, faculty]);

  // ─────────────────────────────────────────────
  // Start Edit
  // ─────────────────────────────────────────────
  const startEdit = (f: Faculty) => {
    setEditingId(f.id);
    setEditForm({
      name: f.name,
      department: f.department,
      designation: f.designation,
      phone: f.phone,
    });
  };

  // ─────────────────────────────────────────────
  // Save Edit
  // ─────────────────────────────────────────────
  const saveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, "users", id), editForm);
      setFaculty((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...editForm } : f))
      );
      setEditingId(null);
      toast.success("Faculty updated");
    } catch {
      toast.error("Failed to update faculty");
    }
  };

  // ─────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this faculty member?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setFaculty((prev) => prev.filter((f) => f.id !== id));
      toast.success("Faculty deleted");
    } catch {
      toast.error("Failed to delete faculty");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* Search + Count */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search faculty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <span className="shrink-0 text-xs text-gray-400">
          {filtered.length} of {faculty.length} faculty
        </span>
      </div>

      {/* Empty */}
      {filtered.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <p className="text-sm text-gray-400">No faculty found</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Gender</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Designation</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((f, index) => (
                <tr key={f.id} className="transition-colors hover:bg-gray-50">

                  {/* # */}
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {index + 1}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    {editingId === f.id ? (
                      <input
                        value={editForm.name || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    ) : (
                      <Link
                        href={`/admin/faculty/${f.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar name={f.name} />
                        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {f.name}
                        </span>
                      </Link>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {f.email}
                  </td>

                  {/* Gender */}
                  <td className="px-4 py-3">
                    <GenderBadge gender={f.gender} />
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3">
                    {editingId === f.id ? (
                      <input
                        value={editForm.department || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, department: e.target.value })
                        }
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    ) : (
                      <span className="text-gray-700">{f.department}</span>
                    )}
                  </td>

                  {/* Designation */}
                  <td className="px-4 py-3">
                    {editingId === f.id ? (
                      <select
                        value={editForm.designation || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, designation: e.target.value })
                        }
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Lecturer">Lecturer</option>
                      </select>
                    ) : (
                      <DesignationBadge designation={f.designation} />
                    )}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3">
                    {editingId === f.id ? (
                      <input
                        value={editForm.phone || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    ) : (
                      <span className="text-gray-500">{f.phone}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {editingId === f.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveEdit(f.id)}
                          className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-100 transition-colors"
                        >
                          <Check size={12} />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <X size={12} />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(f)}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

