import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EvalPhase } from "@/types";

const COL = "evaluations";

// Shape of what's stored per student per phase
type StudentAnswers = Record<string, string | number>;
type PhaseData = Record<string, StudentAnswers>; // studentName → answers
type EvalData = Partial<Record<EvalPhase, PhaseData>>;

// ─── Get evaluation for a project ────────────────────────────────────────────
export async function getEvaluation(
  projectId: string
): Promise<(EvalData & { projectId: string; facultyId: string }) | null> {
  const snap = await getDoc(doc(db, COL, projectId));
  if (!snap.exists()) return null;
  return snap.data() as EvalData & { projectId: string; facultyId: string };
}

// ─── Get all evaluations (for faculty projects list) ──────────────────────────
export async function getAllEvaluations(): Promise<
  Record<string, EvalData & { projectId: string; facultyId: string }>
> {
  const snap = await getDocs(collection(db, COL));
  const map: Record<string, EvalData & { projectId: string; facultyId: string }> = {};
  snap.docs.forEach((d) => {
    map[d.id] = d.data() as EvalData & { projectId: string; facultyId: string };
  });
  return map;
}

// ─── Save evaluation ──────────────────────────────────────────────────────────
// IMPORTANT: only projectId and facultyId are stored.
// projectTitle and facultyName are intentionally NOT stored —
// they are resolved at read time from /projects and /users collections.
export async function saveEvaluation(
  projectId: string,
  facultyId: string,
  phaseData: EvalData
): Promise<void> {
  await setDoc(
    doc(db, COL, projectId),
    {
      ...phaseData,
      projectId,
      facultyId,
      updatedAt: Timestamp.now(),
      // ← NO projectTitle here
      // ← NO facultyName here
    },
    { merge: true }
  );
}