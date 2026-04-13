/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Building2,
  Globe,
  Users,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { PageHeader, Button, InfoCard, Badge, PageSpinner } from "@/components/ui";

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
  description: string;
  createdAt?: any;
}

export default function FacultyProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, loading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id || loading || !user) return;
    const fetch = async () => {
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, "projects", id));
        if (snap.exists()) {
          setProject({ id: snap.id, ...snap.data() } as Project);
        } else {
          router.push("/faculty/projects");
        }
      } catch {
        router.push("/faculty/projects");
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, [id, user, loading, router]);

  if (loading || fetching) return <PageSpinner />;

  if (!project) return null;

  const students = Array.isArray(project.students) ? project.students : [];

  const sdgNum = parseInt(project.sdg?.match(/\d+/)?.[0] || "0");
  const sdgColors = [
    "#E5243B",
    "#DDA63A",
    "#4C9F38",
    "#C5192D",
    "#FF3A21",
    "#26BDE2",
    "#FCC30B",
    "#A21942",
    "#FD6925",
    "#DD1367",
    "#FD9D24",
    "#BF8B2E",
    "#3F7E44",
    "#0A97D9",
    "#56C02B",
    "#00689D",
    "#19486A",
  ];
  const sdgColor = sdgColors[(sdgNum - 1) % sdgColors.length] || "#3B82F6";

  const formatDate = (ts: any) => {
    if (!ts) return null;
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const uploadDate = formatDate(project.createdAt);

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8">
      <PageHeader
        title=""
        onBack={() => router.push("/faculty/projects")}
        backLabel="Back to Projects"
        action={
          <Button
            variant="success"
            onClick={() => router.push(`/faculty/projects/${id}/evaluate`)}
            icon={<ClipboardList />}
          >
            Evaluate Project
          </Button>
        }
      />

      {/* Hero card */}
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-gray-400 mb-1.5">
              ID: {project.id}
            </p>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {project.description}
              </p>
            )}
            {uploadDate && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar size={12} />
                <span>Uploaded {uploadDate}</span>
              </div>
            )}
          </div>
          {project.sdg && (
            <div
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: sdgColor }}
            >
              {project.sdg}
            </div>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-5">
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
          label="SDG Goal"
          value={
            project.sdg ? (
              <span
                className="inline-block rounded-lg px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: sdgColor }}
              >
                {project.sdg}
              </span>
            ) : "—"
          }
        />
      </div>

      {/* Group Members */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="rounded-lg bg-blue-50 p-1.5">
            <Users size={14} className="text-blue-600" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Group Members ({students.length})
          </p>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-gray-400">No students listed.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {students.map((student, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 hover:border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {student}
                </span>
              </div>
            ))}
          </div>
        )}

        {students.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <Button
              variant="success"
              icon={<ClipboardList />}
              onClick={() => router.push(`/faculty/projects/${id}/evaluate`)}
            >
              Start Evaluation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
