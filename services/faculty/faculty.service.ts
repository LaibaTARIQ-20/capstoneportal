import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, secondaryAuth } from "@/lib/firebase";
import type { UserProfile, FacultyFormData } from "@/types";

const COL = "users";

// ─── Get all faculty ──────────────────────────────────────────────────────────
export async function getAllFaculty(): Promise<UserProfile[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("role", "==", "faculty"))
  );
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

// ─── Get single faculty member ────────────────────────────────────────────────
export async function getFacultyById(id: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

// ─── Add new faculty ──────────────────────────────────────────────────────────
// Uses secondaryAuth so the admin session is never lost
export async function addFaculty(data: FacultyFormData): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    data.email,
    data.password
  );
  const uid = cred.user.uid;

  const profile: Omit<UserProfile, "uid"> = {
    name: data.name,
    email: data.email,
    role: "faculty",
    gender: data.gender,
    department: data.department,
    designation: data.designation,
    phone: data.phone,
    joinedAt: Timestamp.now(),
    profileComplete: true,
  };

  await setDoc(doc(db, COL, uid), profile);
  await secondaryAuth.signOut();

  return { uid, ...profile };
}

// ─── Update faculty ───────────────────────────────────────────────────────────
export async function updateFaculty(
  id: string,
  data: Partial<Pick<UserProfile, "name" | "gender" | "department" | "designation" | "phone">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ─── Delete single faculty ────────────────────────────────────────────────────
export async function deleteFaculty(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

// ─── Bulk delete faculty ──────────────────────────────────────────────────────
export async function bulkDeleteFaculty(ids: string[]): Promise<void> {
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