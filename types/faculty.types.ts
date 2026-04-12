import { Timestamp } from "firebase/firestore";

export const EVAL_PHASES = ["synopsis", "progress", "demo", "final"] as const;
export type EvalPhase = typeof EVAL_PHASES[number];

export interface EvaluationRecord {
  id?: string;
  projectId: string;   // ← only ID, name is resolved at read time
  facultyId: string;   // ← only ID, name is resolved at read time
  phase: EvalPhase;
  scores: Record<string, number>;
  grade: string;
  submittedAt?: Timestamp;
}