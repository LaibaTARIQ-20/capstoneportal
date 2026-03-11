"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Trash2 } from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ProjectStatus = "pending" | "under_review" | "accepted" | "rejected";

interface Project {
  id: string;
  title: string;
  supervisor: string;
  supervisorId: string;
  students: string[];
  studentCount: number;
  coSupervisor: string | null;
  industrialPartner: string;
  sdg: string;
  status: ProjectStatus;
}

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    pending: "bg-gray-100 text-gray-700",
    under_review: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  const labels: Record<ProjectStatus, string> = {
    pending: "Pending",
    under_review: "Under Review",
    accepted: "Accepted",
    rejected: "Rejected",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─────────────────────────────────────────────
// Status Select Colors
// ─────────────────────────────────────────────
function statusSelectClass(status: ProjectStatus): string {
  const map: Record<ProjectStatus, string> = {
    pending: "border-gray-200 bg-gray-100 text-gray-700",
    under_review: "border-yellow-200 bg-yellow-50 text-yellow-700",
    accepted: "border-green-200 bg-green-50 text-green-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
  };
  return map[status] || "border-gray-200 bg-gray-100 text-gray-700";
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface ProjectsTableProps {
  isAdmin: boolean;
  supervisorId?: string;
}

export default function ProjectsTable({ isAdmin, supervisorId }: ProjectsTableProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ─────────────────────────────────────────────
  // Fetch from Firestore
  // ─────────────────────────────────────────────
const fetchProjects = async () => {
  setLoading(true);
  try {
    const snap = await getDocs(collection(db, "projects"));
    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Project[];
    
  
    setProjects(data);
  } catch {
    toast.error("Failed to load projects");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchProjects();
  }, []);

  // ─────────────────────────────────────────────
  // Filter — uses supervisorId (UID) not name
  // ─────────────────────────────────────────────
  const visibleProjects = useMemo(() => {
    let list = projects;
    if (!isAdmin && supervisorId) {
      list = list.filter((p) => p.supervisorId === supervisorId); // ← FIXED
    }
    const term = search.toLowerCase().trim();
    if (!term) return list;
    return list.filter(
      (p) =>
        p.title?.toLowerCase().includes(term) ||
        p.supervisor?.toLowerCase().includes(term) ||
        p.sdg?.toLowerCase().includes(term) ||
        p.status?.toLowerCase().includes(term)
    );
  }, [projects, search, isAdmin, supervisorId]);

  // ─────────────────────────────────────────────
  // Update Status
  // ─────────────────────────────────────────────
  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      await updateDoc(doc(db, "projects", projectId), { status: newStatus });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ─────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────
  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
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
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <span className="shrink-0 text-xs text-gray-400">
          {visibleProjects.length} of {projects.length} projects
        </span>
      </div>

      {/* Empty */}
      {visibleProjects.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <p className="text-sm text-gray-400">No projects found</p>
        </div>
      )}

      {/* Table */}
      {visibleProjects.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Supervisor</th>
                <th className="px-4 py-3 text-left">Students</th>
                <th className="px-4 py-3 text-left">SDG</th>
                <th className="px-4 py-3 text-left">Status</th>
                {isAdmin && <th className="px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {visibleProjects.map((project, index) => (
                <tr key={project.id} className="transition-colors hover:bg-gray-50">

                  {/* # */}
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {index + 1}
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                    {project.title || "—"}
                  </td>

                  {/* Supervisor */}
                  <td className="px-4 py-3 text-gray-600">
                    {project.supervisor || "—"}
                  </td>

                  {/* Students */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {project.students?.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* SDG */}
                  <td className="px-4 py-3">
                    {project.sdg ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        {project.sdg}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <select
                        value={project.status}
                        onChange={(e) =>
                          handleStatusChange(project.id, e.target.value as ProjectStatus)
                        }
                        className={`rounded-lg border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 ${statusSelectClass(project.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <StatusBadge status={project.status} />
                    )}
                  </td>

                  {/* Actions */}
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </td>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}