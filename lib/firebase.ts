import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Primary app
const app = getApps().find((a) => a.name === "[DEFAULT]") || initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ✅ Safe Firestore init — avoids double-init error
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, { experimentalForceLongPolling: true });
} catch {
  db = getFirestore(app);
}
export { db };

// Secondary app (for creating faculty without losing admin session)
const secondaryApp =
  getApps().find((a) => a.name === "secondary") ||
  initializeApp(firebaseConfig, "secondary");
export const secondaryAuth = getAuth(secondaryApp);
