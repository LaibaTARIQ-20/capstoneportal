"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useConfirm } from "@/hooks/useConfirm";
import { Trash2, User, Building2, Globe, Users } from "lucide-react";
import { LoadingSpinner, PageHeader, Button, InfoCard, Badge, ConfirmDialog } from "@/components/ui";
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

      <PageHeader
        title={project.title}
        subtitle={`ID: ${project.id}`}
        onBack={() => router.push("/admin/projects")}
        backLabel="Back to Projects"
        action={
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
            loadingLabel="Deleting..."
            icon={<Trash2 />}
          >
            Delete Project
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard
          icon={<User />}
          label="Supervisor"
          value={project.supervisor || "—"}
        />
        <InfoCard
          icon={<User />}
          label="Co-Supervisor"
          value={project.coSupervisor && project.coSupervisor !== "None" ? project.coSupervisor : "—"}
        />
        <InfoCard
          icon={<Building2 />}
          label="Industrial Partner"
          value={project.industrialPartner && project.industrialPartner !== "None" ? project.industrialPartner : "—"}
        />
        <InfoCard
          icon={<Globe />}
          label="SDG"
          value={project.sdg ? <Badge color="green">{project.sdg}</Badge> : "—"}
        />

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
