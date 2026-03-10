import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";

const googleProvider = new GoogleAuthProvider();

export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  
  console.log("Auth UID:", credential.user.uid); // DEBUG
  
  const profile = await getUserProfile(credential.user.uid);
  if (!profile) throw new Error("Profile not found. Contact admin.");
  return profile;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const credential = await signInWithPopup(auth, googleProvider);
  const firebaseUser = credential.user;

  console.log("Google Auth UID:", firebaseUser.uid); // DEBUG

  let profile = await getUserProfile(firebaseUser.uid);
  if (!profile) {
    profile = await createUserProfile(firebaseUser.uid, {
      name: firebaseUser.displayName || "No Name",
      email: firebaseUser.email || "",
      role: "faculty",
      gender: "Male",
      department: "Not Set",
      designation: "Not Set",
      phone: "Not Set",
    });
  }
  return profile;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  console.log("Fetching profile for UID:", uid); // DEBUG
  const snapshot = await getDoc(doc(db, "users", uid));
  console.log("Document exists:", snapshot.exists()); // DEBUG
  if (!snapshot.exists()) return null;
  return { uid, ...snapshot.data() } as UserProfile;
}

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, "uid" | "joinedAt" | "profileComplete">
): Promise<UserProfile> {
  const profile = {
    ...data,
    joinedAt: Timestamp.now(),
    profileComplete: false,
  };
  await setDoc(doc(db, "users", uid), profile);
  return { uid, ...profile };
}

export function onAuthChange(
  callback: (user: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    const profile = await getUserProfile(firebaseUser.uid);
    callback(profile);
  });
}
