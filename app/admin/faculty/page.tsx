/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  UserPlus, Pencil, Trash2, Search,
} from "lucide-react";
import {
  doc, deleteDoc, collection, getDocs,
  query, where, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Faculty {
  id: string;
  name: string;
  email: string;
  gender: string;
  department: string;
  designation: string;
  phone: string;
}

function DesignationBadge({ designation }: { designation: string }) {
  const map: Record<string, string> = {
    "Professor":           "bg-purple-100 text-purple-700",
    "Associate Professor": "bg-blue-100 text-blue-700",
    "Assistant Professor": "bg-cyan-100 text-cyan-700",
    "Lecturer":            "bg-green-100 text-green-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[designation] || "bg-gray-100 text-gray-700"}`}>
      {designation || "—"}
    </span>
  );
}

export default function AdminFacultyPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [facultyList, setFacultyList]   = useState<Faculty[]>([]);
  const [filtered, setFiltered]         = useState<Faculty[]>([]);
  const [search, setSearch]             = useState("");
  const [pageLoading, setPageLoading]   = useState(true);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ── Dialog state ────────────────────────────
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const fetchFaculty = async () => {
      setPageLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("role", "==", "faculty"))
        );
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Faculty[];
        setFacultyList(data);
        setFiltered(data);
      } catch {
        toast.error("Failed to load faculty");
      } finally {
        setPageLoading(false);
      }
    };
    fetchFaculty();
  }, [user]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      facultyList.filter(
        (f) =>
          f.name?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q) ||
          f.department?.toLowerCase().includes(q)
      )
    );
  }, [search, facultyList]);

  const confirmDelete = (id: string, name: string) => {
    setDialog({
      open: true,
      title: "Delete Faculty Member",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      onConfirm: async () => {
        closeDialog();
        setDeletingId(id);
        try {
          await deleteDoc(doc(db, "users", id));
          setFacultyList((prev) => prev.filter((f) => f.id !== id));
          setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
          toast.success(`${name} deleted`);
        } catch {
          toast.error("Failed to delete");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const confirmBulkDelete = () => {
    if (selected.size === 0) return;
    setDialog({
      open: true,
      title: "Delete Selected Faculty",
      message: `Are you sure you want to delete ${selected.size} faculty member${selected.size > 1 ? "s" : ""}? This action cannot be undone.`,
      onConfirm: async () => {
        closeDialog();
        setBulkDeleting(true);
        try {
          const batch = writeBatch(db);
          selected.forEach((id) => batch.delete(doc(db, "users", id)));
          await batch.commit();
          setFacultyList((prev) => prev.filter((f) => !selected.has(f.id)));
          setSelected(new Set());
          toast.success(`${selected.size} faculty member${selected.size > 1 ? "s" : ""} deleted`);
        } catch {
          toast.error("Bulk delete failed");
        } finally {
          setBulkDeleting(false);
        }
      },
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((f) => f.id)));
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={dialog.open}
        title={dialog.title}
        message={dialog.message}
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={dialog.onConfirm}
        onCancel={closeDialog}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
          <p className="mt-1 text-sm text-gray-600">Manage faculty members.</p>
        </div>
        <button
          onClick={() => router.push("/admin/faculty/new")}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={15} />Add Faculty
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative flex-1 min-w-50 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
          </p>
          {selected.size > 0 && (
            <button
              onClick={confirmBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 ml-auto"
            >
              {bulkDeleting ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : <Trash2 size={13} />}
              Delete {selected.size} Selected
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            No faculty members found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-400 cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Department</th>
                  <th className="px-5 py-3 text-left">Designation</th>
                  <th className="px-5 py-3 text-left">Gender</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((faculty, index) => (
                  <tr key={faculty.id}
                    className={`transition-colors ${selected.has(faculty.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}>

                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(faculty.id)}
                        onChange={() => toggleSelect(faculty.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-400 cursor-pointer"
                      />
                    </td>

                    <td className="px-5 py-4 text-xs font-medium text-gray-400">{index + 1}</td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {faculty.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")}
                        </div>
                        <span className="font-semibold text-gray-900">{faculty.name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-700">{faculty.email}</td>
                    <td className="px-5 py-4 text-gray-700">{faculty.department || "—"}</td>

                    <td className="px-5 py-4">
                      <DesignationBadge designation={faculty.designation} />
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        faculty.gender === "Female" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {faculty.gender || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/faculty/${faculty.id}`)}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          <Pencil size={12} />Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(faculty.id, faculty.name)}
                          disabled={deletingId === faculty.id}
                          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {deletingId === faculty.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                          ) : <Trash2 size={12} />}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}