/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Eye, Trash2, Search, ClipboardList, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Project {
  id: string;
  title: string;
  supervisor: string;
  supervisorId: string;
  students: string[];
  studentCount: number;
  sdg: string;
  industrialPartner: string;
  coSupervisor: string;
}

export default function FacultyProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "faculty") {
      router.push("/admin/dashboard");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setPageLoading(true);
      try {
        const snap = await getDocs(collection(db, "projects"));
        const all = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Project[];
        setProjects(all);
        setFiltered(all);
      } catch (err: any) {
        toast.error("Failed to load projects");
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      projects.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.supervisor?.toLowerCase().includes(q) ||
          p.sdg?.toLowerCase().includes(q) ||
          p.industrialPartner?.toLowerCase().includes(q),
      ),
    );
  }, [search, projects]);

  const confirmDelete = (id: string, title: string) => {
    setDialog({
      open: true,
      title: "Delete Project",
      message: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      onConfirm: async () => {
        closeDialog();
        setDeleting(id);
        try {
          await deleteDoc(doc(db, "projects", id));
          setProjects((prev) => prev.filter((p) => p.id !== id));
          toast.success("Project deleted");
        } catch {
          toast.error("Failed to delete project");
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  const confirmBulkDelete = () => {
    if (!selected.size) return;
    setDialog({
      open: true,
      title: "Delete Selected Projects",
      message: `Delete ${selected.size} selected project${selected.size > 1 ? "s" : ""}? This cannot be undone.`,
      onConfirm: async () => {
        closeDialog();
        setBulkDeleting(true);
        try {
          const batch = writeBatch(db);
          selected.forEach((id) => batch.delete(doc(db, "projects", id)));
          await batch.commit();
          setProjects((prev) => prev.filter((p) => !selected.has(p.id)));
          setSelected(new Set());
          toast.success(`${selected.size} projects deleted`);
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

  const toggleAll = () => {
    setSelected(
      selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map((p) => p.id)),
    );
  };

  const getStudentCount = (p: Project) => {
    if (Array.isArray(p.students) && p.students.length > 0)
      return p.students.length;
    return typeof p.studentCount === "number" ? p.studentCount : 0;
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 md:px-8">
      <ConfirmDialog
        isOpen={dialog.open}
        title={dialog.title}
        message={dialog.message}
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={dialog.onConfirm}
        onCancel={closeDialog}
      />

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="mt-1 text-sm text-gray-500">
          All final year projects — view, evaluate, or manage.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by title, supervisor, SDG..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <p className="text-sm font-medium text-gray-500">
            {pageLoading
              ? "Loading..."
              : `${filtered.length} project${filtered.length !== 1 ? "s" : ""}`}
          </p>

          {selected.size > 0 && (
            <button
              onClick={confirmBulkDelete}
              disabled={bulkDeleting}
              className="ml-auto flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
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
        {pageLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FolderOpen size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-semibold text-gray-500">
              No projects found
            </p>
            {search && (
              <p className="text-xs text-gray-400 mt-1">
                No results for &quot;{search}&quot;
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={
                        selected.size === filtered.length && filtered.length > 0
                      }
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Project Title</th>
                  <th className="px-4 py-3 text-left">Supervisor</th>
                  <th className="px-4 py-3 text-left">Members</th>
                  <th className="px-4 py-3 text-left">Actions</th>
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
                    {/* Checkbox */}
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(project.id)}
                        onChange={() => toggleSelect(project.id)}
                        className="rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                    </td>

                    {/* # */}
                    <td className="px-4 py-3.5 text-xs font-medium text-gray-400">
                      {index + 1}
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3.5 max-w-[260px]">
                      <p className="font-semibold text-gray-900 truncate">
                        {project.title}
                      </p>
                      {project.sdg && (
                        <p className="text-xs text-green-600 mt-0.5 truncate">
                          {project.sdg}
                        </p>
                      )}
                    </td>

                    {/* Supervisor */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-700 truncate max-w-[180px]">
                        {project.supervisor || "—"}
                      </p>
                    </td>

                    {/* Members */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {getStudentCount(project)} Members
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/faculty/projects/${project.id}`)
                          }
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          <Eye size={12} />
                          View
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/faculty/projects/${project.id}/evaluate`,
                            )
                          }
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                        >
                          <ClipboardList size={12} />
                          Evaluate
                        </button>
                        <button
                          onClick={() =>
                            confirmDelete(project.id, project.title)
                          }
                          disabled={deleting === project.id}
                          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {deleting === project.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                          ) : (
                            <Trash2 size={12} />
                          )}
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
    </div>
  );
}
