/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { getAllEvaluations } from "@/services/evaluations/evaluations.service";
import { useRouter } from "next/navigation";
import {
  Eye,
  ClipboardList,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import { LoadingSpinner, DataTable } from "@/components/ui";
import type { ColumnDef } from "@/components/ui";
import type { Project } from "@/types";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEvalStatus(evalData: any, students: string[]): EvalStatus {
  if (!evalData || students.length === 0) return "not_started";
  let totalAnswered = 0,
    totalRequired = 0;
  for (const phase of PHASE_ORDER) {
    for (const student of students) {
      const questions = PHASE_QUESTIONS[phase];
      totalRequired += questions.length;
      const answers = evalData[phase]?.[student] || {};
      totalAnswered += questions.filter(
        (q) => answers[q] !== undefined && answers[q] !== "",
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
        <CheckCircle2 size={11} /> Evaluated
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />{" "}
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
  const { user } = useAuth();
  const { projects, loading } = useProjects();
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [evalMap, setEvalMap] = useState<Record<string, any>>({});
  const [evalsLoading, setEvalsLoading] = useState(true);

  useEffect(() => {
    getAllEvaluations()
      .then(setEvalMap)
      .finally(() => setEvalsLoading(false));
  }, []);

  // Build eval status map for all projects
  const evalStatuses = Object.fromEntries(
    projects.map((p) => [
      p.id,
      getEvalStatus(evalMap[p.id], Array.isArray(p.students) ? p.students : []),
    ]),
  );

  const completedCount = Object.values(evalStatuses).filter(
    (s) => s === "complete",
  ).length;

  // ── Column definitions ──────────────────────────────────────────────────────
  const columns: ColumnDef<Project>[] = [
    {
      key: "index",
      header: "#",
      className: "w-10 text-xs font-medium text-gray-400",
      cell: (_, index) => index + 1,
    },
    {
      key: "title",
      header: "Project Title",
      sortable: true,
      cell: (project) => {
        const isComplete = evalStatuses[project.id] === "complete";
        return (
          <div className="flex items-start gap-2">
            {isComplete && (
              <CheckCircle2 size={15} className="text-green-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold truncate max-w-[200px] ${isComplete ? "text-green-900" : "text-gray-900"}`}>
                {project.title}
              </p>
              {project.sdg && (
                <p className="text-xs text-green-600 mt-0.5">{project.sdg}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "supervisor",
      header: "Supervisor",
      sortable: true,
      cell: (project) => (
        <span className="text-gray-700">{project.supervisor || "—"}</span>
      ),
    },
    {
      key: "students",
      header: "Members",
      cell: (project) => {
        const count = Array.isArray(project.students)
          ? project.students.length
          : (project.studentCount ?? 0);
        return (
          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {count} Members
          </span>
        );
      },
    },
    {
      key: "evaluation",
      header: "Evaluation",
      cell: (project) => (
        <EvalBadge status={evalStatuses[project.id] ?? "not_started"} />
      ),
    },
  ];

  if (loading || evalsLoading) return <LoadingSpinner />;

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            All final year projects — view or evaluate.
          </p>
        </div>
        {completedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 border border-green-200">
            <CheckCircle2 size={12} /> {completedCount} Evaluated
          </span>
        )}
      </div>

      <DataTable<Project>
        data={projects}
        columns={columns}
        rowIdKey="id"
        countLabel="project"
        searchPlaceholder="Search by title, supervisor, SDG…"
        searchFields={["title", "supervisor", "sdg"]}
        emptyMessage="No projects found."
        emptyIcon={<FolderOpen size={40} />}
        renderRowActions={(project) => {
          const isComplete = evalStatuses[project.id] === "complete";
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/faculty/projects/${project.id}`)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Eye size={12} /> View
              </button>
              <button
                onClick={() =>
                  router.push(`/faculty/projects/${project.id}/evaluate`)
                }
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
              >
                <ClipboardList size={12} />
                {isComplete ? "Re-evaluate" : "Evaluate"}
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
