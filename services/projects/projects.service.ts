import {
  collection,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Project, ProjectStatus } from "@/types";

const COL = "projects";

// ─── Get all projects ─────────────────────────────────────────────────────────
export async function getAllProjects(): Promise<Project[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
}

// ─── Get single project ───────────────────────────────────────────────────────
export async function getProjectById(id: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Project;
}

// ─── Update status ────────────────────────────────────────────────────────────
export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status,
    updatedAt: Timestamp.now(),
  });
}

// ─── Delete single ────────────────────────────────────────────────────────────
export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

// ─── Bulk delete ──────────────────────────────────────────────────────────────
export async function bulkDeleteProjects(ids: string[]): Promise<void> {
  // Firestore batch limit is 500 — split into chunks of 490 to be safe
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 490) {
    chunks.push(ids.slice(i, i + 490));
  }
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((id) => batch.delete(doc(db, COL, id)));
    await batch.commit();
  }
}