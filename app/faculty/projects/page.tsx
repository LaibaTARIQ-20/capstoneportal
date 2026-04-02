/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Eye,
  Search,
  ClipboardList,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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

type EvalStatus = "not_started" | "in_progress" | "complete";

const PHASE_ORDER = ["synopsis", "progress", "demo", "final"];

const PHASE_QUESTIONS: Record<string, string[]> = {
  synopsis: [
    "problem_statement",
    "objectives",
    "literature_review",
    "methodology",
    "feasibility",
    "presentation",
    "overall_synopsis",
  ],
  progress: [
    "timeline_adherence",
    "implementation",
    "problem_solving",
    "technical_skills",
    "teamwork",
    "documentation",
    "progress_status",
  ],
  demo: [
    "functionality",
    "ui_ux",
    "performance",
    "demo_clarity",
    "qa_response",
    "innovation",
    "demo_result",
  ],
  final: [
    "project_completion",
    "report_quality",
    "technical_depth",
    "sdg_alignment",
    "industry_relevance",
    "viva_performance",
    "final_grade",
  ],
};

function getEvalStatus(evalData: any, students: string[]): EvalStatus {
  if (!evalData || students.length === 0) return "not_started";

  let totalAnswered = 0;
  let totalRequired = 0;

  for (const phase of PHASE_ORDER) {
    for (const student of students) {
      const questions = PHASE_QUESTIONS[phase];
      totalRequired += questions.length;
      const studentAnswers = evalData[phase]?.[student] || {};
      totalAnswered += questions.filter(
        (q) => studentAnswers[q] !== undefined && studentAnswers[q] !== "",
      ).length;
    }
  }

  if (totalAnswered === 0) return "not_started";
  if (totalAnswered >= totalRequired) return "complete";
  return "in_progress";
}

function EvalBadge({ status }: { status: EvalStatus }) {
  if (status === "complete")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700 border border-green-200">
        <CheckCircle2 size={11} />
        Evaluated
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        In Progress
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 border border-gray-200">
      Not Started
    </span>
  );
}

export default function FacultyProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [evalStatuses, setEvalStatuses] = useState<Record<string, EvalStatus>>(
    {},
  );
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        // Fetch projects and evaluations in parallel
        const [projectsSnap, evalsSnap] = await Promise.all([
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "evaluations")),
        ]);

        const all = projectsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Project[];

        // Build eval map: projectId -> eval data
        const evalMap: Record<string, any> = {};
        evalsSnap.docs.forEach((d) => {
          evalMap[d.id] = d.data();
        });

        // Compute status for each project
        const statuses: Record<string, EvalStatus> = {};
        all.forEach((p) => {
          const students = Array.isArray(p.students) ? p.students : [];
          statuses[p.id] = getEvalStatus(evalMap[p.id], students);
        });

        setProjects(all);
        setFiltered(all);
        setEvalStatuses(statuses);
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

  const completedCount = Object.values(evalStatuses).filter(
    (s) => s === "complete",
  ).length;
  const inProgressCount = Object.values(evalStatuses).filter(
    (s) => s === "in_progress",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 md:px-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            All final year projects — view or evaluate.
          </p>
        </div>
        {/* Summary badges */}
        {!pageLoading && projects.length > 0 && (
          <div className="flex items-center gap-2">
            {completedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 border border-green-200">
                <CheckCircle2 size={12} />
                {completedCount} Evaluated
              </span>
            )}
         
          </div>
        )}
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
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Project Title</th>
                  <th className="px-4 py-3 text-left">Supervisor</th>
                  <th className="px-4 py-3 text-left">Members</th>
                  <th className="px-4 py-3 text-left">Evaluation</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((project, index) => {
                  const status = evalStatuses[project.id] || "not_started";
                  const isComplete = status === "complete";
                  return (
                    <tr
                      key={project.id}
                      className={`transition-colors ${
                        isComplete
                          ? "bg-green-50/40 hover:bg-green-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3.5 text-xs font-medium text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 max-w-[260px]">
                        <div className="flex items-start gap-2">
                          {isComplete && (
                            <CheckCircle2
                              size={15}
                              className="text-green-500 shrink-0 mt-0.5"
                            />
                          )}
                          <div>
                            <p
                              className={`font-semibold truncate ${isComplete ? "text-green-900" : "text-gray-900"}`}
                            >
                              {project.title}
                            </p>
                            {project.sdg && (
                              <p className="text-xs text-green-600 mt-0.5 truncate">
                                {project.sdg}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-gray-700 truncate max-w-[180px]">
                          {project.supervisor || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {getStudentCount(project)} Members
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <EvalBadge status={status} />
                      </td>
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
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
                              isComplete
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            <ClipboardList size={12} />
                            {isComplete ? "Re-evaluate" : "Evaluate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
