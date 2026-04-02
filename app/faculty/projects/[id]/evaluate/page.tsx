"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

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
interface EvalData {
  [phase: string]: { [student: string]: { [qId: string]: string | number } };
}

const PHASES: Record<
  Phase,
  {
    label: string;
    emoji: string;
    color: string;
    light: string;
    mid: string;
    description: string;
    questions: Question[];
  }
> = {
  synopsis: {
    label: "Synopsis",
    emoji: "📋",
    color: "#2563EB",
    light: "#EFF6FF",
    mid: "#BFDBFE",
    description: "Evaluate the project proposal and research objectives.",
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
    emoji: "⚡",
    color: "#D97706",
    light: "#FFFBEB",
    mid: "#FDE68A",
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
    emoji: "🎯",
    color: "#7C3AED",
    light: "#F5F3FF",
    mid: "#DDD6FE",
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
    emoji: "🏆",
    color: "#059669",
    light: "#ECFDF5",
    mid: "#A7F3D0",
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

const STARS = [
  { n: 1, label: "Poor", color: "#EF4444", fill: "#FEE2E2" },
  { n: 2, label: "Fair", color: "#F97316", fill: "#FFEDD5" },
  { n: 3, label: "Good", color: "#F59E0B", fill: "#FEF3C7" },
  { n: 4, label: "Very Good", color: "#3B82F6", fill: "#DBEAFE" },
  { n: 5, label: "Excellent", color: "#10B981", fill: "#D1FAE5" },
];

const GRADE_STYLE: Record<string, { bg: string; fg: string; border: string }> =
  {
    Excellent: { bg: "#D1FAE5", fg: "#065F46", border: "#34D399" },
    "A+": { bg: "#D1FAE5", fg: "#065F46", border: "#34D399" },
    A: { bg: "#D1FAE5", fg: "#065F46", border: "#6EE7B7" },
    Good: { bg: "#DBEAFE", fg: "#1E3A8A", border: "#60A5FA" },
    "B+": { bg: "#DBEAFE", fg: "#1E3A8A", border: "#60A5FA" },
    B: { bg: "#EFF6FF", fg: "#1E3A8A", border: "#93C5FD" },
    Average: { bg: "#FEF3C7", fg: "#78350F", border: "#FCD34D" },
    Satisfactory: { bg: "#FEF3C7", fg: "#78350F", border: "#FCD34D" },
    "C+": { bg: "#FEF3C7", fg: "#78350F", border: "#FCD34D" },
    C: { bg: "#FEF9C3", fg: "#78350F", border: "#FDE047" },
    Approved: { bg: "#D1FAE5", fg: "#065F46", border: "#34D399" },
    "Approved with Changes": {
      bg: "#FEF3C7",
      fg: "#78350F",
      border: "#FCD34D",
    },
    "On Track": { bg: "#D1FAE5", fg: "#065F46", border: "#34D399" },
    "Slightly Behind": { bg: "#FEF3C7", fg: "#78350F", border: "#FCD34D" },
    Redo: { bg: "#FEE2E2", fg: "#991B1B", border: "#F87171" },
    Fail: { bg: "#FEE2E2", fg: "#991B1B", border: "#F87171" },
    F: { bg: "#FEE2E2", fg: "#991B1B", border: "#F87171" },
    "At Risk": { bg: "#FFEDD5", fg: "#9A3412", border: "#FB923C" },
    Critical: { bg: "#FEE2E2", fg: "#991B1B", border: "#F87171" },
    "Needs Improvement": { bg: "#FFEDD5", fg: "#9A3412", border: "#FB923C" },
    D: { bg: "#FFEDD5", fg: "#9A3412", border: "#FB923C" },
  };

// ── Option B: inline stars, right of text ─────
function StarRowInline({
  value,
  onChange,
}: {
  value: number | string;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const num = Number(value);
  const display = hovered || num;
  const info = display > 0 ? STARS[display - 1] : null;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {STARS.map(({ n, color }) => {
        const lit = display >= n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            className="transition-transform duration-100 hover:scale-125 active:scale-95 p-0.5 rounded"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={lit ? color : "none"}
                stroke={lit ? color : "#D1D5DB"}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
      {info ? (
        <span
          className="ml-2 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0"
          style={{
            backgroundColor: info.fill,
            color: info.color,
            border: `1px solid ${info.color}30`,
          }}
        >
          {info.label}
        </span>
      ) : (
        <span className="ml-2 text-xs text-gray-300 italic">Not rated</span>
      )}
    </div>
  );
}

// ── Grade pills ───────────────────────────────
function GradeRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-5 justify-center">
      {options.map((opt) => {
        const sel = value === opt;
        const s = GRADE_STYLE[opt] || {
          bg: "#EFF6FF",
          fg: "#1E3A8A",
          border: "#93C5FD",
        };
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border-2 transition-all duration-150 ${
              sel
                ? "scale-105 shadow-sm"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:scale-105"
            }`}
            style={
              sel
                ? { backgroundColor: s.bg, color: s.fg, borderColor: s.border }
                : {}
            }
          >
            {sel ? `✓ ${opt}` : opt}
          </button>
        );
      })}
    </div>
  );
}

export default function EvaluatePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, loading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePhase, setActivePhase] = useState<Phase>("synopsis");
  const [activeStudent, setActiveStudent] = useState("");
  const [evals, setEvals] = useState<EvalData>({});

  useEffect(() => {
    if (!id || loading || !user) return;
    (async () => {
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, "projects", id));
        if (!snap.exists()) {
          router.push("/faculty/projects");
          return;
        }
        const data = { id: snap.id, ...snap.data() } as Project;
        setProject(data);
        const sts = Array.isArray(data.students) ? data.students : [];
        if (sts.length) setActiveStudent(sts[0]);
        const ev = await getDoc(doc(db, "evaluations", id));
        if (ev.exists()) setEvals(ev.data() as EvalData);
      } catch {
        router.push("/faculty/projects");
      } finally {
        setFetching(false);
      }
    })();
  }, [id, user, loading, router]);

  useEffect(() => {
    if (!activeStudent) return;
    for (const p of PHASE_ORDER) {
      if (!phaseDone(p, activeStudent)) {
        setActivePhase(p);
        return;
      }
    }
    setActivePhase("final");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStudent, evals]);

  const students = Array.isArray(project?.students) ? project!.students : [];
  const getVal = (qId: string) =>
    evals?.[activePhase]?.[activeStudent]?.[qId] ?? "";
  const setVal = (qId: string, v: string | number) =>
    setEvals((prev) => ({
      ...prev,
      [activePhase]: {
        ...(prev[activePhase] || {}),
        [activeStudent]: {
          ...(prev[activePhase]?.[activeStudent] || {}),
          [qId]: v,
        },
      },
    }));

  const phaseDone = (ph: Phase, st: string) =>
    PHASES[ph].questions.every((q) => {
      const v = evals?.[ph]?.[st]?.[q.id];
      return v !== undefined && v !== "";
    });

  const phaseUnlocked = (ph: Phase) => {
    const idx = PHASE_ORDER.indexOf(ph);
    return (
      idx === 0 ||
      PHASE_ORDER.slice(0, idx).every((p) => phaseDone(p, activeStudent))
    );
  };

  const phasePct = (ph: Phase, st: string) => {
    const total = PHASES[ph].questions.length;
    const filled = Object.values(evals?.[ph]?.[st] || {}).filter(
      (v) => v !== "" && v !== undefined,
    ).length;
    return total ? Math.round((filled / total) * 100) : 0;
  };

  const overallPct = (st: string) => {
    const total = PHASE_ORDER.reduce(
      (a, p) => a + PHASES[p].questions.length,
      0,
    );
    const filled = PHASE_ORDER.reduce(
      (a, p) =>
        a +
        Object.values(evals?.[p]?.[st] || {}).filter(
          (v) => v !== "" && v !== undefined,
        ).length,
      0,
    );
    return total ? Math.round((filled / total) * 100) : 0;
  };

  const allDone = (st: string) => PHASE_ORDER.every((p) => phaseDone(p, st));
  const curUnlocked = phaseUnlocked(activePhase);
  const curDone = phaseDone(activePhase, activeStudent);
  const phase = PHASES[activePhase];
  const answeredNow = phase.questions.filter((q) => {
    const v = getVal(q.id);
    return v !== "" && v !== undefined;
  }).length;

  const save = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "evaluations", id),
        {
          ...evals,
          projectId: id,
          projectTitle: project.title,
          facultyId: user?.uid,
          facultyName: user?.name,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );
      toast.success(`${phase.label} saved!`);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  if (!project) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* ── Topbar ── */}
      <header className="shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-2.5 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/faculty/projects")}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100 px-2 py-1.5 shrink-0"
            >
              <ArrowLeft size={13} />
              Projects
            </button>
            <div className="h-4 w-px bg-gray-200 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {project.title}
              </p>
              <p className="text-xs text-gray-400">Evaluation Form</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: phase.light, color: phase.color }}
            >
              {answeredNow}/{phase.questions.length} done
            </div>
            <button
              onClick={save}
              disabled={saving || !curUnlocked}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-40 shadow hover:shadow-md active:scale-95"
              style={{ backgroundColor: phase.color }}
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={12} />
                  Save {phase.label}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Phase tabs */}
        <div className="flex border-t border-gray-100 overflow-x-auto">
          {PHASE_ORDER.map((p, i) => {
            const un = phaseUnlocked(p);
            const done = phaseDone(p, activeStudent);
            const active = activePhase === p;
            const pct = phasePct(p, activeStudent);
            return (
              <button
                key={p}
                onClick={() => {
                  if (!un) {
                    toast.error(
                      `Complete ${PHASES[PHASE_ORDER[i - 1]].label} first`,
                    );
                    return;
                  }
                  setActivePhase(p);
                }}
                className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                  active
                    ? ""
                    : !un
                      ? "text-gray-300 cursor-not-allowed border-transparent"
                      : done
                        ? "text-green-600 border-transparent hover:bg-green-50"
                        : "text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700"
                }`}
                style={
                  active
                    ? {
                        color: phase.color,
                        borderColor: phase.color,
                        backgroundColor: phase.light,
                      }
                    : {}
                }
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-black ${
                    done && !active
                      ? "bg-green-500 text-white"
                      : active
                        ? "text-white"
                        : !un
                          ? "bg-gray-100 text-gray-300"
                          : "bg-gray-100 text-gray-500"
                  }`}
                  style={active ? { backgroundColor: phase.color } : {}}
                >
                  {done && !active ? "✓" : i + 1}
                </span>
                {PHASES[p].emoji} {PHASES[p].label}
                {active && pct > 0 && (
                  <span
                    className="ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: phase.color + "20",
                      color: phase.color,
                    }}
                  >
                    {pct}%
                  </span>
                )}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-500"
                    style={{ backgroundColor: phase.color, width: `${pct}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-gray-200 bg-white overflow-y-auto flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2.5">
              Members
            </p>
            <div className="space-y-2">
              {students.map((s, i) => {
                const prog = overallPct(s);
                const done = allDone(s);
                const isAct = activeStudent === s;
                const curP =
                  PHASE_ORDER.find((p) => !phaseDone(p, s)) || "final";
                return (
                  <button
                    key={s}
                    onClick={() => setActiveStudent(s)}
                    className={`w-full text-left rounded-xl p-2.5 transition-all border-2 ${
                      isAct
                        ? "border-transparent shadow-lg"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                    style={isAct ? { backgroundColor: phase.color } : {}}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          isAct
                            ? "bg-white/25 text-white"
                            : done
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {done && !isAct ? "✓" : i + 1}
                      </div>
                      <p
                        className={`text-xs font-bold truncate flex-1 ${isAct ? "text-white" : "text-gray-800"}`}
                      >
                        {s}
                      </p>
                    </div>
                    <div
                      className={`h-1.5 rounded-full overflow-hidden ${isAct ? "bg-white/25" : "bg-gray-100"}`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${prog}%`,
                          backgroundColor: isAct
                            ? "rgba(255,255,255,0.9)"
                            : phase.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span
                        className={`text-xs font-semibold ${isAct ? "text-white/75" : done ? "text-green-600" : "text-gray-400"}`}
                      >
                        {done ? "All done" : PHASES[curP].label}
                      </span>
                      <span
                        className={`text-xs font-bold ${isAct ? "text-white/90" : "text-gray-500"}`}
                      >
                        {prog}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2.5">
              {activeStudent
                ? `${activeStudent.split(" ")[0]}'s Phases`
                : "Phases"}
            </p>
            <div className="space-y-2.5">
              {PHASE_ORDER.map((p) => {
                const pct = activeStudent ? phasePct(p, activeStudent) : 0;
                const un = phaseUnlocked(p);
                const done = pct === 100;
                const active = activePhase === p;
                return (
                  <div
                    key={p}
                    className={`transition-all ${!un ? "opacity-30" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {!un ? (
                          <Lock size={9} className="text-gray-400" />
                        ) : done ? (
                          <CheckCircle2
                            size={10}
                            style={{ color: PHASES[p].color }}
                          />
                        ) : null}
                        <span
                          className={`text-xs font-bold ${active ? "" : "text-gray-600"}`}
                          style={active ? { color: PHASES[p].color } : {}}
                        >
                          {PHASES[p].emoji} {PHASES[p].label}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold ${done ? "text-green-600" : "text-gray-400"}`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: PHASES[p].color + "20" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
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
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Phase header */}
            <div
              className="rounded-2xl mb-4 p-4 flex items-center justify-between gap-4"
              style={{
                backgroundColor: phase.light,
                border: `1.5px solid ${phase.mid}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shadow-sm"
                  style={{ backgroundColor: phase.color }}
                >
                  {phase.emoji}
                </div>
                <div>
                  <p
                    className="text-sm font-black"
                    style={{ color: phase.color }}
                  >
                    {phase.label} Evaluation
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: phase.color + "99" }}
                  >
                    {phase.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Progress ring */}
                <div className="relative h-11 w-11">
                  <svg className="h-11 w-11 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={phase.mid}
                      strokeWidth="3.5"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={phase.color}
                      strokeWidth="3.5"
                      strokeDasharray={`${(answeredNow / phase.questions.length) * 87.96} 87.96`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center text-xs font-black"
                    style={{ color: phase.color }}
                  >
                    {answeredNow}
                  </span>
                </div>
                {/* Student picker */}
                <div className="relative">
                  <select
                    value={activeStudent}
                    onChange={(e) => setActiveStudent(e.target.value)}
                    className="appearance-none rounded-xl pl-3 pr-8 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                    style={{
                      backgroundColor: phase.color + "15",
                      color: phase.color,
                      border: `1.5px solid ${phase.color}40`,
                    }}
                  >
                    {students.map((s) => (
                      <option
                        key={s}
                        value={s}
                        className="text-gray-900 bg-white"
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={11}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: phase.color }}
                  />
                </div>
              </div>
            </div>

            {/* Locked */}
            {!curUnlocked ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-4 text-2xl">
                  🔒
                </div>
                <p className="text-base font-bold text-gray-700">
                  Phase Locked
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Complete{" "}
                  <strong className="text-gray-600">
                    {
                      PHASES[PHASE_ORDER[PHASE_ORDER.indexOf(activePhase) - 1]]
                        ?.label
                    }
                  </strong>{" "}
                  for <strong className="text-gray-600">{activeStudent}</strong>{" "}
                  first.
                </p>
              </div>
            ) : !activeStudent ? (
              <div className="py-16 text-center text-sm text-gray-400">
                Select a student to begin
              </div>
            ) : (
              <div className="space-y-2 ">
                {phase.questions.map((q, qi) => {
                  const val = getVal(q.id);
                  const answered = val !== "" && val !== undefined;
                  const starInfo =
                    q.type === "rating" && answered
                      ? STARS[Number(val) - 1]
                      : null;
                  const gradeInfo =
                    q.type === "grade" && answered
                      ? GRADE_STYLE[String(val)]
                      : null;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl bg-white transition-all duration-200 ${
                        answered ? "shadow-sm" : ""
                      }`}
                      style={{
                        border: `2px solid ${answered ? phase.mid : "#E5E7EB"}`,
                      }}
                    >
                      {answered && (
                        <div
                          className="h-0.5 rounded-t-xl"
                          style={{ backgroundColor: phase.color }}
                        />
                      )}

                      <div className="px-4 py-4">
                        {q.type === "rating" ? (
                          /* ── OPTION B: text left, stars right, all on one row ── */
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                                style={{
                                  backgroundColor: answered
                                    ? phase.color
                                    : "#E5E7EB",
                                  color: answered ? "white" : "#9CA3AF",
                                }}
                              >
                                {answered ? <CheckCircle2 size={13} /> : qi + 1}
                              </div>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {q.text}
                              </p>
                              {starInfo && (
                                <span
                                  className="hidden sm:inline shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                                  style={{
                                    backgroundColor: starInfo.fill,
                                    color: starInfo.color,
                                  }}
                                >
                                  {starInfo.label}
                                </span>
                              )}
                            </div>
                            <div className="shrink-0">
                              <StarRowInline
                                value={val}
                                onChange={(v) => setVal(q.id, v)}
                              />
                            </div>
                          </div>
                        ) : (
                          /* ── Grade questions stay stacked (need more space) ── */
                          <div>
                            <div className="flex items-center gap-2.5 mb-4">
                              <div
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                                style={{
                                  backgroundColor: answered
                                    ? phase.color
                                    : "#E5E7EB",
                                  color: answered ? "white" : "#9CA3AF",
                                }}
                              >
                                {answered ? <CheckCircle2 size={13} /> : qi + 1}
                              </div>
                              <p className="text-sm font-semibold text-gray-900 flex-1">
                                {q.text}
                              </p>
                              {gradeInfo && (
                                <span
                                  className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold border"
                                  style={{
                                    backgroundColor: gradeInfo.bg,
                                    color: gradeInfo.fg,
                                    borderColor: gradeInfo.border,
                                  }}
                                >
                                  {String(val)}
                                </span>
                              )}
                            </div>
                            <div className="pl-8">
                              <GradeRow
                                options={q.options || []}
                                value={String(val)}
                                onChange={(v) => setVal(q.id, v)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Save footer */}
                <div className="flex items-center gap-3 pt-2 pb-10 flex-wrap">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-40"
                    style={{ backgroundColor: phase.color }}
                  >
                    {saving ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        Save {phase.label} Evaluation
                      </>
                    )}
                  </button>

                  {curDone && (
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold border-2 border-green-200 bg-green-50 text-green-700">
                      <CheckCircle2 size={14} className="text-green-500" />
                      {activePhase !== "final" ? (
                        <span>
                          Phase done! Next:{" "}
                          <strong>
                            {
                              PHASES[
                                PHASE_ORDER[
                                  PHASE_ORDER.indexOf(activePhase) + 1
                                ]
                              ].label
                            }
                          </strong>{" "}
                          <ChevronRight size={12} className="inline" />
                        </span>
                      ) : (
                        <span>
                          🎉 All complete for <strong>{activeStudent}</strong>!
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
