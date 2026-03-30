/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db, secondaryAuth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  CheckCircle2,
  Loader2,
  Users,
  Link2,
  Wrench,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nameToEmail(name: string): string {
  const cleaned = normalizeName(name).replace(/[^a-z\s]/g, "");
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[parts.length - 1]}@university.edu`;
  }
  return `${cleaned.replace(/\s+/g, ".")}@university.edu`;
}

function guessDesignation(name: string): string {
  if (/^prof\./i.test(name.trim())) return "Professor";
  if (/^dr\./i.test(name.trim())) return "Assistant Professor";
  return "Lecturer";
}

const DELAY = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface LogEntry {
  type: "success" | "error" | "info" | "warn";
  message: string;
}

export default function AdminFixPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [supervisorNames, setSupervisorNames] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") router.push("/login");
  }, [user, loading, router]);

  const addLog = (type: LogEntry["type"], msg: string) =>
    setLogs((p) => [...p, { type, message: msg }]);

  // ── STEP 1 ────────────────────────────────────
  const runStep1 = async () => {
    setRunning(true);
    setLogs([]);
    setSupervisorNames([]);
    try {
      addLog("info", "Scanning all projects...");
      const snap = await getDocs(collection(db, "projects"));
      addLog("info", `Found ${snap.docs.length} projects`);

      const names = new Set<string>();
      snap.docs.forEach((d) => {
        const sup = (d.data().supervisor || "").trim();
        if (sup) names.add(sup);
      });

      const nameList = Array.from(names);
      setSupervisorNames(nameList);
      addLog("success", `Found ${nameList.length} unique supervisor names`);
      nameList.forEach((n) =>
        addLog("info", `  → ${n}  |  email: ${nameToEmail(n)}`),
      );
      addLog("success", "Scan complete. Proceed to Step 2.");
      setStep(2);
    } catch (e: any) {
      addLog("error", `Scan failed: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  // ── STEP 2 ────────────────────────────────────
  const runStep2 = async () => {
    setRunning(true);
    setProgress({ current: 0, total: supervisorNames.length });

    let created = 0;
    let fixedOrphan = 0;
    let alreadyExists = 0;
    let failed = 0;

    for (let i = 0; i < supervisorNames.length; i++) {
      const rawName = supervisorNames[i];
      const email = nameToEmail(rawName);
      setProgress({ current: i + 1, total: supervisorNames.length });

      // Rate-limit pause every 5 accounts
      if (i > 0 && i % 5 === 0) {
        addLog(
          "info",
          `⏸ Pausing 2s to avoid rate limits... (${i}/${supervisorNames.length})`,
        );
        await DELAY(2000);
      }

      try {
        // 1. Check if Firestore profile already exists by email
        const existingSnap = await getDocs(
          query(collection(db, "users"), where("email", "==", email)),
        );
        if (!existingSnap.empty) {
          addLog("success", `  ✅ Already has profile: ${email}`);
          alreadyExists++;
          continue;
        }

        // 2. Try to sign in (handles orphan accounts — Auth exists but no Firestore doc)
        let uid: string | null = null;
        let method = "";

        try {
          const cred = await signInWithEmailAndPassword(
            secondaryAuth,
            email,
            "University@123",
          );
          uid = cred.user.uid;
          method = "orphan-signin";
        } catch (signInErr: any) {
          if (
            signInErr.code === "auth/user-not-found" ||
            signInErr.code === "auth/invalid-credential" ||
            signInErr.code === "auth/invalid-login-credentials"
          ) {
            // Truly doesn't exist — create it
            try {
              const newCred = await createUserWithEmailAndPassword(
                secondaryAuth,
                email,
                "University@123",
              );
              uid = newCred.user.uid;
              method = "created-new";
            } catch (createErr: any) {
              if (createErr.code === "auth/too-many-requests") {
                addLog(
                  "warn",
                  `  ⏳ Rate limited. Waiting 15s then retrying ${email}...`,
                );
                await DELAY(15000);
                i--; // retry same index
                continue;
              }
              if (createErr.code === "auth/email-already-in-use") {
                // Race condition: exists but wrong password or sign-in failed for other reason
                addLog(
                  "warn",
                  `  ⚠️  ${email} exists in Auth but sign-in failed. Skip for now.`,
                );
                failed++;
                continue;
              }
              addLog(
                "error",
                `  ❌ Create failed for ${email}: ${createErr.message}`,
              );
              failed++;
              continue;
            }
          } else if (signInErr.code === "auth/too-many-requests") {
            addLog(
              "warn",
              `  ⏳ Rate limited. Waiting 15s then retrying ${email}...`,
            );
            await DELAY(15000);
            i--;
            continue;
          } else {
            addLog(
              "error",
              `  ❌ Sign-in error for ${email}: ${signInErr.message}`,
            );
            failed++;
            continue;
          }
        }

        if (!uid) {
          addLog("error", `  ❌ No UID obtained for ${email}`);
          failed++;
          continue;
        }

        // 3. Create Firestore profile
        await setDoc(doc(db, "users", uid), {
          name: rawName,
          email,
          role: "faculty",
          gender: "Male",
          department: "Engineering",
          designation: guessDesignation(rawName),
          phone: "0000000000",
          joinedAt: Timestamp.now(),
          profileComplete: false,
        });

        if (method === "orphan-signin") {
          addLog(
            "success",
            `  🔧 Fixed orphan: "${rawName}" → profile created`,
          );
          fixedOrphan++;
        } else {
          addLog("success", `  ✨ Created: "${rawName}" → ${email}`);
          created++;
        }
      } catch (e: any) {
        addLog("error", `  ❌ Failed "${rawName}": ${e.message}`);
        failed++;
      }
    }

    addLog(
      failed > 0 ? "warn" : "success",
      `\nStep 2 Summary:\n  ✅ Already existed: ${alreadyExists}\n  🔧 Fixed orphans: ${fixedOrphan}\n  ✨ Newly created: ${created}\n  ❌ Failed: ${failed}`,
    );

    if (failed > 0) {
      addLog("warn", `${failed} failed — click "Create / Fix" again to retry.`);
    } else {
      setStep(3);
      addLog("success", "All accounts ready! Proceed to Step 3.");
    }

    setRunning(false);
  };

  // ── STEP 3 ────────────────────────────────────
  const runStep3 = async () => {
    setRunning(true);
    try {
      addLog("info", "Loading faculty from Firestore...");

      const usersSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "faculty")),
      );

      if (usersSnap.empty) {
        addLog("error", "❌ No faculty in Firestore! Run Step 2 first.");
        setRunning(false);
        return;
      }

      addLog("success", `Loaded ${usersSnap.docs.length} faculty members`);

      const nameToUid: Record<string, string> = {};
      const emailToUid: Record<string, string> = {};

      usersSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.name) {
          nameToUid[data.name.toLowerCase().trim()] = d.id;
          nameToUid[normalizeName(data.name)] = d.id;
        }
        if (data.email) emailToUid[data.email.toLowerCase()] = d.id;
      });

      const projectsSnap = await getDocs(collection(db, "projects"));
      addLog("info", `Processing ${projectsSnap.docs.length} projects...`);

      let linked = 0;
      let alreadyDone = 0;
      let noMatch = 0;

      const batches: ReturnType<typeof writeBatch>[] = [];
      let currentBatch = writeBatch(db);
      let batchOps = 0;

      projectsSnap.docs.forEach((d) => {
        const data = d.data();

        if (data.supervisorId && data.supervisorId.trim() !== "") {
          alreadyDone++;
          return;
        }

        const supName = (data.supervisor || "").trim();
        const supEmail = nameToEmail(supName);

        const uid =
          nameToUid[supName.toLowerCase().trim()] ||
          nameToUid[normalizeName(supName)] ||
          emailToUid[supEmail.toLowerCase()];

        if (uid) {
          currentBatch.update(doc(db, "projects", d.id), { supervisorId: uid });
          batchOps++;
          linked++;

          if (batchOps >= 499) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            batchOps = 0;
          }
          addLog("success", `  ✅ "${supName}"`);
        } else {
          noMatch++;
          addLog("warn", `  ⚠️  No match: "${supName}"`);
        }
      });

      if (batchOps > 0) batches.push(currentBatch);

      addLog("info", `Committing ${batches.length} batch(es) to Firestore...`);
      for (const b of batches) await b.commit();

      addLog(
        noMatch === 0 ? "success" : "warn",
        `\n════════════════════\n✅ DONE!\n  Linked now:    ${linked}\n  Already linked: ${alreadyDone}\n  No match:      ${noMatch}\n════════════════════`,
      );

      if (noMatch === 0) setDone(true);
      else
        addLog(
          "warn",
          `${noMatch} unmatched — re-run Step 2 to create missing faculty.`,
        );
    } catch (e: any) {
      addLog("error", `Step 3 failed: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  const logColor: Record<string, string> = {
    success: "text-green-400",
    error: "text-red-400",
    warn: "text-yellow-400",
    info: "text-blue-300",
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="animate-spin text-blue-500" size={28} />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Wrench size={22} className="text-orange-400" />
          <div>
            <h1 className="text-xl font-bold">Faculty & Project Fix Utility</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Signs into orphan accounts to recover UIDs → creates Firestore
              profiles → links all projects
            </p>
          </div>
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { n: 1 as const, label: "Scan", icon: AlertCircle },
            { n: 2 as const, label: "Create / Fix Accounts", icon: Users },
            { n: 3 as const, label: "Link Projects", icon: Link2 },
          ].map(({ n, label, icon: Icon }, i) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
                  step === n
                    ? "bg-blue-600 text-white"
                    : step > n
                      ? "bg-green-900/60 text-green-400 border border-green-800"
                      : "bg-gray-800 text-gray-500"
                }`}
              >
                {step > n ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                Step {n}: {label}
              </div>
              {i < 2 && <ChevronRight size={14} className="text-gray-600" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Controls */}
          <div className="space-y-4">
            {/* S1 */}
            <div
              className={`rounded-2xl border p-5 ${step === 1 ? "border-blue-700 bg-blue-950/30" : "border-gray-800 bg-gray-900/40"}`}
            >
              <h2 className="font-bold text-sm flex items-center gap-2 mb-1">
                <AlertCircle size={15} className="text-blue-400" /> Step 1 —
                Scan Projects
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                Finds all unique supervisor names in your database
              </p>
              <button
                onClick={runStep1}
                disabled={running}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {running && step === 1 && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {supervisorNames.length > 0
                  ? `Re-scan (${supervisorNames.length} found)`
                  : "Run Scan"}
              </button>
            </div>

            {/* S2 */}
            <div
              className={`rounded-2xl border p-5 ${step === 2 ? "border-orange-700 bg-orange-950/30" : "border-gray-800 bg-gray-900/40"}`}
            >
              <h2 className="font-bold text-sm flex items-center gap-2 mb-1">
                <Users size={15} className="text-orange-400" /> Step 2 — Create
                / Fix Faculty
              </h2>
              <p className="text-xs text-gray-500 mb-1">
                Signs into orphan Auth accounts to get UIDs, then creates their
                missing Firestore profiles.
              </p>
              <p className="text-xs text-yellow-600 mb-3">
                ⚡ Auto-pauses every 5 accounts to avoid Firebase rate limits
              </p>
              {running && step === 2 && progress.total > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Processing...</span>
                    <span>
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                      style={{
                        width: `${Math.round((progress.current / progress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={runStep2}
                disabled={running || step < 2}
                className="w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {running && step === 2 && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {step >= 2
                  ? `Create / Fix ${supervisorNames.length} Faculty`
                  : "Waiting for Step 1"}
              </button>
            </div>

            {/* S3 */}
            <div
              className={`rounded-2xl border p-5 ${step === 3 ? "border-green-700 bg-green-950/30" : "border-gray-800 bg-gray-900/40"}`}
            >
              <h2 className="font-bold text-sm flex items-center gap-2 mb-1">
                <Link2 size={15} className="text-green-400" /> Step 3 — Link
                Projects
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                Writes supervisorId into every project by matching supervisor
                name to faculty UID
              </p>
              <button
                onClick={runStep3}
                disabled={running || step < 3}
                className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {running && step === 3 && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Link All Projects
              </button>
            </div>

            {/* Credentials */}
            <div className="rounded-2xl border border-yellow-800 bg-yellow-950/20 p-4">
              <p className="text-yellow-400 text-xs font-bold mb-2">
                🔑 Faculty Login Credentials
              </p>
              <p className="text-xs text-gray-400">
                Email:{" "}
                <code className="text-yellow-300">
                  firstname.lastname@university.edu
                </code>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Password:{" "}
                <code className="text-yellow-300">University@123</code>
              </p>
            </div>

            {done && (
              <div className="rounded-2xl border border-green-700 bg-green-950/40 p-5 text-center">
                <CheckCircle2
                  size={28}
                  className="text-green-400 mx-auto mb-2"
                />
                <p className="text-green-300 font-bold">All done!</p>
                <p className="text-xs text-gray-400 mt-1 mb-3">
                  Faculty can now log in and see their projects.
                </p>
                <button
                  onClick={() => router.push("/admin/faculty")}
                  className="rounded-xl bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700 transition-colors"
                >
                  View Faculty List →
                </button>
              </div>
            )}
          </div>

          {/* Logs */}
          <div
            className="rounded-2xl border border-gray-800 bg-gray-900 flex flex-col"
            style={{ minHeight: 520 }}
          >
            <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Log Output
              </p>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-gray-600 hover:text-gray-400"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <p className="text-gray-600">Run Step 1 to begin...</p>
              ) : (
                logs.map((l, i) => (
                  <p
                    key={i}
                    className={`${logColor[l.type]} whitespace-pre-wrap leading-relaxed`}
                  >
                    {l.message}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
