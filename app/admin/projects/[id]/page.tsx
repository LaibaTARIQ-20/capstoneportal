"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ArrowLeft, Trash2, User, Building2, Globe, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/ui";
import toast from "react-hot-toast";
import type { Project } from "@/types";

export default function AdminProjectDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { confirm, options, handleConfirm, handleCancel } = useConfirm();

  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, "projects", id));
        if (snap.exists())
          setProject({ id: snap.id, ...snap.data() } as Project);
        else router.push("/admin/projects");
      } catch {
        router.push("/admin/projects");
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, [id, router]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete Project",
      message: `Delete "${project?.title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      confirmColor: "red",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "projects", id));
      toast.success("Project deleted");
      router.push("/admin/projects");
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  if (fetching) return <LoadingSpinner />;
  if (!project) return null;

  const students = Array.isArray(project.students) ? project.students : [];

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

      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => router.push("/admin/projects")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{" "}
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={15} /> Delete Project
            </>
          )}
        </button>
      </div>

      <p className="mb-2 text-xs font-mono text-gray-400">ID: {project.id}</p>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{project.title}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            <User size={13} /> Supervisor
          </div>
          <p className="text-base font-bold text-gray-900">
            {project.supervisor || "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            <User size={13} /> Co-Supervisor
          </div>
          <p className="text-base font-bold text-gray-900">
            {project.coSupervisor && project.coSupervisor !== "None"
              ? project.coSupervisor
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            <Building2 size={13} /> Industrial Partner
          </div>
          <p className="text-base font-bold text-gray-900">
            {project.industrialPartner && project.industrialPartner !== "None"
              ? project.industrialPartner
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            <Globe size={13} /> SDG
          </div>
          <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
            {project.sdg || "—"}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            <Users size={13} /> Group Members ({students.length})
          </div>
          {students.length === 0 ? (
            <p className="text-sm text-gray-400">No students listed.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {students.map((student, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {student}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
