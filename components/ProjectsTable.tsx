/* eslint-disable @typescript-eslint/no-unused-expressions */

"use client";

import { useEffect, useState } from "react";
import {
  collection, getDocs, deleteDoc, doc,
  query, where, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trash2, Eye, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Project {
  id: string;
  title: string;
  supervisor: string;
  supervisorId: string;
  coSupervisor: string;
  students: string[];
  studentCount: number;
  industrialPartner: string;
  sdg: string;
  status: string;
}

interface ProjectsTableProps {
  isAdmin: boolean;
  supervisorId?: string;
}

export default function ProjectsTable({ isAdmin, supervisorId }: ProjectsTableProps) {
  const router = useRouter();
  const [projects, setProjects]     = useState<Project[]>([]);
  const [filtered, setFiltered]     = useState<Project[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        let snap;
        if (!isAdmin && supervisorId) {
          snap = await getDocs(
            query(collection(db, "projects"), where("supervisorId", "==", supervisorId))
          );
        } else {
          snap = await getDocs(collection(db, "projects"));
        }
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Project[];
        setProjects(data);
        setFiltered(data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchProjects();
  }, [isAdmin, supervisorId]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      projects.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.supervisor?.toLowerCase().includes(q) ||
          p.industrialPartner?.toLowerCase().includes(q)
      )
    );
  }, [search, projects]);

  const confirmDelete = (id: string, title: string) => {
    setDialog({
      open: true,
      title: "Delete Project",
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      onConfirm: async () => {
        closeDialog();
        setDeleting(id);
        try {
          await deleteDoc(doc(db, "projects", id));
          setProjects((prev) => prev.filter((p) => p.id !== id));
          setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
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
    if (selected.size === 0) return;
    setDialog({
      open: true,
      title: "Delete Selected Projects",
      message: `Are you sure you want to delete ${selected.size} selected project${selected.size > 1 ? "s" : ""}? This action cannot be undone.`,
      onConfirm: async () => {
        closeDialog();
        setBulkDeleting(true);
        try {
          const batch = writeBatch(db);
          selected.forEach((id) => batch.delete(doc(db, "projects", id)));
          await batch.commit();
          setProjects((prev) => prev.filter((p) => !selected.has(p.id)));
          setSelected(new Set());
          toast.success(`${selected.size} project${selected.size > 1 ? "s" : ""} deleted`);
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
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const getStudentCount = (project: Project): number => {
    if (Array.isArray(project.students) && project.students.length > 0) return project.students.length;
    if (typeof project.studentCount === "number") return project.studentCount;
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-gray-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        Loading projects...
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

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative flex-1 min-w-50 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

        {/* Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No projects found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-400 cursor-pointer"
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
                  <tr key={project.id}
                    className={`transition-colors ${selected.has(project.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}>

                    {isAdmin && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected.has(project.id)}
                          onChange={() => toggleSelect(project.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-400 cursor-pointer"
                        />
                      </td>
                    )}

                    <td className="px-5 py-4 text-gray-400 text-xs font-medium">{index + 1}</td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 max-w-50 truncate">{project.title}</p>
                      {project.sdg && (
                        <p className="text-xs text-green-600 mt-0.5">{project.sdg}</p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-700 font-medium">{project.supervisor || "—"}</td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {getStudentCount(project)} Members
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {!project.industrialPartner || project.industrialPartner === "None"
                        ? "—" : project.industrialPartner}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(isAdmin
                            ? `/admin/projects/${project.id}`
                            : `/faculty/projects/${project.id}`)}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          <Eye size={13} />View
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => confirmDelete(project.id, project.title)}
                            disabled={deleting === project.id}
                            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deleting === project.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                            ) : <Trash2 size={13} />}
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