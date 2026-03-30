"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Save,
  ChevronDown,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────
interface Project {
  id: string;
  title: string;
  students: string[];
  studentCount: number;
}

type Phase = "synopsis" | "progress" | "demo" | "final";

interface Question {
  id: string;
  text: string;
  type: "rating" | "grade";
  options?: string[];
}

interface EvaluationData {
  [phase: string]: {
    [student: string]: { [questionId: string]: string | number };
  };
}

// ─── Phase config ─────────────────────────────
const PHASES: Record<
  Phase,
  { label: string; color: string; description: string; questions: Question[] }
> = {
  synopsis: {
    label: "Synopsis",
    color: "#3B82F6",
    description:
      "Evaluate the initial project proposal and research objectives.",
    questions: [
      {
        id: "problem_statement",
        text: "Clarity of problem statement",
        type: "rating",
      },
      {
        id: "objectives",
        text: "Clarity and relevance of objectives",
        type: "rating",
      },
      {
        id: "literature_review",
        text: "Depth of literature review",
        type: "rating",
      },
      {
        id: "methodology",
        text: "Proposed methodology appropriateness",
        type: "rating",
      },
      {
        id: "feasibility",
        text: "Project feasibility and scope",
        type: "rating",
      },
      {
        id: "presentation",
        text: "Synopsis presentation quality",
        type: "grade",
        options: ["Excellent", "Good", "Average", "Redo"],
      },
      {
        id: "overall_synopsis",
        text: "Overall synopsis evaluation",
        type: "grade",
        options: ["Approved", "Approved with Changes", "Redo"],
      },
    ],
  },
  progress: {
    label: "Progress",
    color: "#F59E0B",
    description: "Evaluate mid-project progress and implementation status.",
    questions: [
      {
        id: "timeline_adherence",
        text: "Adherence to project timeline",
        type: "rating",
      },
      {
        id: "implementation",
        text: "Quality of implementation so far",
        type: "rating",
      },
      {
        id: "problem_solving",
        text: "Problem-solving ability",
        type: "rating",
      },
      {
        id: "technical_skills",
        text: "Technical skills demonstrated",
        type: "rating",
      },
      { id: "teamwork", text: "Teamwork and collaboration", type: "rating" },
      { id: "documentation", text: "Documentation quality", type: "rating" },
      {
        id: "progress_status",
        text: "Overall progress status",
        type: "grade",
        options: ["On Track", "Slightly Behind", "At Risk", "Critical"],
      },
    ],
  },
  demo: {
    label: "Demo",
    color: "#8B5CF6",
    description: "Evaluate the project demonstration and functionality.",
    questions: [
      {
        id: "functionality",
        text: "System functionality and completeness",
        type: "rating",
      },
      { id: "ui_ux", text: "UI/UX design and usability", type: "rating" },
      { id: "performance", text: "System performance", type: "rating" },
      { id: "demo_clarity", text: "Clarity of demonstration", type: "rating" },
      { id: "qa_response", text: "Response to Q&A", type: "rating" },
      { id: "innovation", text: "Innovation and creativity", type: "rating" },
      {
        id: "demo_result",
        text: "Demo overall result",
        type: "grade",
        options: [
          "Excellent",
          "Good",
          "Satisfactory",
          "Needs Improvement",
          "Fail",
        ],
      },
    ],
  },
  final: {
    label: "Final",
    color: "#10B981",
    description: "Final comprehensive evaluation of the completed project.",
    questions: [
      {
        id: "project_completion",
        text: "Project completion and deliverables",
        type: "rating",
      },
      { id: "report_quality", text: "Final report quality", type: "rating" },
      {
        id: "technical_depth",
        text: "Technical depth and complexity",
        type: "rating",
      },
      { id: "sdg_alignment", text: "Alignment with SDG goals", type: "rating" },
      {
        id: "industry_relevance",
        text: "Industry relevance and impact",
        type: "rating",
      },
      {
        id: "viva_performance",
        text: "Viva/defense performance",
        type: "rating",
      },
      {
        id: "final_grade",
        text: "Final project grade",
        type: "grade",
        options: ["A+", "A", "B+", "B", "C+", "C", "D", "F"],
      },
    ],
  },
};

const PHASE_ORDER: Phase[] = ["synopsis", "progress", "demo", "final"];

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

// ─── Rating component ─────────────────────────
function RatingInput({
  value,
  onChange,
}: {
  value: number | string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition-all duration-150 ${
            Number(value) >= n
              ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          }`}
        >
          {n}
        </button>
      ))}
      {value ? (
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
          {RATING_LABELS[Number(value)]}
        </span>
      ) : (
        <span className="text-xs text-gray-400 italic">Not rated yet</span>
      )}
    </div>
  );
}

// ─── Grade select ─────────────────────────────
function GradeSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const colors: Record<string, string> = {
    Excellent: "bg-green-600 text-white",
    "A+": "bg-green-600 text-white",
    A: "bg-green-500 text-white",
    Good: "bg-blue-600 text-white",
    "B+": "bg-blue-600 text-white",
    B: "bg-blue-500 text-white",
    Average: "bg-yellow-500 text-white",
    Satisfactory: "bg-yellow-500 text-white",
    "C+": "bg-yellow-500 text-white",
    C: "bg-yellow-400 text-white",
    Approved: "bg-green-600 text-white",
    "Approved with Changes": "bg-yellow-500 text-white",
    "On Track": "bg-green-600 text-white",
    "Slightly Behind": "bg-yellow-500 text-white",
    Redo: "bg-red-600 text-white",
    Fail: "bg-red-600 text-white",
    F: "bg-red-600 text-white",
    "At Risk": "bg-orange-600 text-white",
    Critical: "bg-red-700 text-white",
    "Needs Improvement": "bg-orange-500 text-white",
    D: "bg-orange-500 text-white",
  };
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-150 ${
            value === opt
              ? (colors[opt] || "bg-blue-600 text-white") +
                " shadow-sm scale-105"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────
export default function EvaluatePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, loading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePhase, setActivePhase] = useState<Phase>("synopsis");
  const [activeStudent, setActiveStudent] = useState<string>("");
  const [evaluations, setEvaluations] = useState<EvaluationData>({});
  const [savedPhases, setSavedPhases] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id || loading || !user) return;
    const fetchProject = async () => {
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, "projects", id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Project;
          setProject(data);
          const students =
            Array.isArray(data.students) && data.students.length > 0
              ? data.students
              : [];
          if (students.length > 0) setActiveStudent(students[0]);

          const evalSnap = await getDoc(doc(db, "evaluations", id));
          if (evalSnap.exists()) {
            setEvaluations(evalSnap.data() as EvaluationData);
            const saved = new Set<string>();
            Object.keys(evalSnap.data()).forEach((k) => {
              if (PHASE_ORDER.includes(k as Phase)) saved.add(k);
            });
            setSavedPhases(saved);
          }
        } else {
          router.push("/faculty/projects");
        }
      } catch {
        router.push("/faculty/projects");
      } finally {
        setFetching(false);
      }
    };
    fetchProject();
  }, [id, user, loading, router]);

  const students =
    Array.isArray(project?.students) && project!.students.length > 0
      ? project!.students
      : [];

  const getValue = (qId: string): string | number =>
    evaluations?.[activePhase]?.[activeStudent]?.[qId] ?? "";

  const setValue = (qId: string, val: string | number) => {
    setEvaluations((prev) => ({
      ...prev,
      [activePhase]: {
        ...(prev[activePhase] || {}),
        [activeStudent]: {
          ...(prev[activePhase]?.[activeStudent] || {}),
          [qId]: val,
        },
      },
    }));
  };

  const getPhaseProgress = (phase: Phase) => {
    const total = students.length * PHASES[phase].questions.length;
    if (total === 0) return 0;
    const filled = students.reduce(
      (acc, s) =>
        acc +
        Object.values(evaluations?.[phase]?.[s] || {}).filter(
          (v) => v !== "" && v !== undefined,
        ).length,
      0,
    );
    return Math.round((filled / total) * 100);
  };

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "evaluations", id),
        {
          ...evaluations,
          projectId: id,
          projectTitle: project.title,
          facultyId: user?.uid,
          facultyName: user?.name,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );
      setSavedPhases((prev) => new Set([...prev, activePhase]));
      toast.success(`${PHASES[activePhase].label} evaluation saved`);
    } catch {
      toast.error("Failed to save evaluation");
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );

  if (!project) return null;

  const phase = PHASES[activePhase];
  const phaseColor = phase.color;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/faculty/projects")}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={15} />
              Projects
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <p className="text-sm font-bold text-gray-900 truncate max-w-xs">
                {project.title}
              </p>
              <p className="text-xs text-gray-400">Evaluation Form</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save {phase.label}
              </>
            )}
          </button>
        </div>

        {/* Phase tabs */}
        <div className="flex items-center gap-0.5 px-6 border-t border-gray-100 overflow-x-auto">
          {PHASE_ORDER.map((p, i) => {
            const pct = getPhaseProgress(p);
            const saved = savedPhases.has(p);
            const active = activePhase === p;
            return (
              <button
                key={p}
                onClick={() => setActivePhase(p)}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? "border-current"
                    : saved
                      ? "border-transparent text-green-600 hover:text-green-700"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
                style={
                  active ? { color: phaseColor, borderColor: phaseColor } : {}
                }
              >
                {saved && !active && (
                  <CheckCircle size={13} className="text-green-500" />
                )}
                <span>
                  {i + 1}. {PHASES[p].label}
                </span>
                {pct > 0 && pct < 100 && !saved && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                    {pct}%
                  </span>
                )}
                {pct === 100 && !saved && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: students + progress */}
        <div className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
              Group Members
            </p>
            <div className="space-y-1">
              {students.length === 0 ? (
                <p className="text-xs text-gray-400">No students listed</p>
              ) : (
                students.map((s, i) => {
                  const hasAny =
                    Object.keys(evaluations?.[activePhase]?.[s] || {}).length >
                    0;
                  const allDone = PHASES[activePhase].questions.every((q) => {
                    const v = evaluations?.[activePhase]?.[s]?.[q.id];
                    return v !== undefined && v !== "";
                  });
                  return (
                    <button
                      key={s}
                      onClick={() => setActiveStudent(s)}
                      className={`w-full text-left flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all ${
                        activeStudent === s
                          ? "text-white shadow-sm"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      style={
                        activeStudent === s
                          ? { backgroundColor: phaseColor }
                          : {}
                      }
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          activeStudent === s
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{s}</p>
                        {allDone ? (
                          <p
                            className={`text-xs flex items-center gap-1 mt-0.5 ${activeStudent === s ? "text-white/80" : "text-green-600"}`}
                          >
                            <CheckCircle2 size={10} />
                            Complete
                          </p>
                        ) : hasAny ? (
                          <p
                            className={`text-xs mt-0.5 ${activeStudent === s ? "text-white/70" : "text-amber-600"}`}
                          >
                            In progress
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
              Phase Progress
            </p>
            <div className="space-y-3">
              {PHASE_ORDER.map((p) => {
                const pct = getPhaseProgress(p);
                return (
                  <div key={p}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-600">
                        {PHASES[p].label}
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: PHASES[p].color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: questions */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            {/* Phase header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold" style={{ color: phaseColor }}>
                  {phase.label} Evaluation
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {phase.description}
                </p>
              </div>

              {/* Student dropdown */}
              {students.length > 0 && (
                <div className="relative">
                  <select
                    value={activeStudent}
                    onChange={(e) => setActiveStudent(e.target.value)}
                    className="appearance-none rounded-xl border-2 border-gray-200 bg-white pl-4 pr-9 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    {students.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              )}
            </div>

            {!activeStudent ? (
              <div className="py-16 text-center text-gray-400">
                Select a student to evaluate
              </div>
            ) : (
              <div className="space-y-4">
                {phase.questions.map((q, qi) => {
                  const val = getValue(q.id);
                  const answered = val !== "" && val !== undefined;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl border p-6 transition-all bg-white ${
                        answered
                          ? "border-gray-200"
                          : "border-dashed border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: answered ? phaseColor : "#D1D5DB",
                          }}
                        >
                          {answered ? <CheckCircle2 size={14} /> : qi + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {q.text}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {q.type === "rating"
                              ? "Rate from 1 (Poor) to 5 (Excellent)"
                              : "Select one option"}
                          </p>
                        </div>
                      </div>
                      <div className="pl-10">
                        {q.type === "rating" ? (
                          <RatingInput
                            value={val}
                            onChange={(v) => setValue(q.id, v)}
                          />
                        ) : (
                          <GradeSelect
                            options={q.options || []}
                            value={String(val)}
                            onChange={(v) => setValue(q.id, v)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Save button at bottom */}
                <div className="pt-2 pb-10">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50 shadow-sm"
                    style={{ backgroundColor: phaseColor }}
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save {phase.label} Evaluation
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
