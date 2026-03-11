"use client";

import { useState } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import { GraduationCap, Database, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────
// Dummy Faculty
// ─────────────────────────────────────────────
const DUMMY_FACULTY = [
  {
    email: "ayesha.malik@university.edu",
    password: "University@123",
    name: "Dr. Ayesha Malik",
    gender: "Female",
    department: "Software Engineering",
    designation: "Associate Professor",
    phone: "03001234567",
    role: "faculty",
    profileComplete: true,
  },
  {
    email: "imran.khalid@university.edu",
    password: "University@123",
    name: "Dr. Imran Khalid",
    gender: "Male",
    department: "Computer Science",
    designation: "Assistant Professor",
    phone: "03011234567",
    role: "faculty",
    profileComplete: true,
  },
  {
    email: "khalid.mehmood@university.edu",
    password: "University@123",
    name: "Dr. Khalid Mehmood",
    gender: "Male",
    department: "Information Technology",
    designation: "Professor",
    phone: "03021234567",
    role: "faculty",
    profileComplete: true,
  },
  {
    email: "sana.javed@university.edu",
    password: "University@123",
    name: "Dr. Sana Javed",
    gender: "Female",
    department: "Software Engineering",
    designation: "Lecturer",
    phone: "03031234567",
    role: "faculty",
    profileComplete: true,
  },
];

// ─────────────────────────────────────────────
// Dummy Projects (will be linked after faculty seeded)
// ─────────────────────────────────────────────
const DUMMY_PROJECTS = [
  {
    title: "AI-Based Smart Attendance System",
    supervisorName: "Dr. Ayesha Malik",
    coSupervisor: "None",
    students: ["Ali Hassan", "Sara Khan", "Umar Farooq"],
    industrialPartner: "TechCorp",
    sdg: "SDG 4",
    status: "pending",
  },
  {
    title: "Food Waste Reduction App",
    supervisorName: "Dr. Imran Khalid",
    coSupervisor: "None",
    students: ["Fatima Zahra", "Bilal Ahmed"],
    industrialPartner: "GreenEarth",
    sdg: "SDG 2",
    status: "under_review",
  },
  {
    title: "Blockchain Voting System",
    supervisorName: "Dr. Ayesha Malik",
    coSupervisor: "None",
    students: ["Hassan Ali", "Zainab Noor", "Ahmed Raza"],
    industrialPartner: "None",
    sdg: "SDG 16",
    status: "accepted",
  },
  {
    title: "Smart Traffic Management System",
    supervisorName: "Dr. Khalid Mehmood",
    coSupervisor: "None",
    students: ["Sana Mirza", "Tariq Jameel"],
    industrialPartner: "CityTech",
    sdg: "SDG 11",
    status: "rejected",
  },
  {
    title: "AI Resume Analyzer",
    supervisorName: "Dr. Imran Khalid",
    coSupervisor: "None",
    students: ["Nadia Khan", "Omer Sheikh", "Hira Baig"],
    industrialPartner: "HireX",
    sdg: "SDG 8",
    status: "pending",
  },
  {
    title: "E-Learning Recommendation System",
    supervisorName: "Dr. Ayesha Malik",
    coSupervisor: "Dr. Sana Javed",
    students: ["Raza Ali", "Maria Qureshi"],
    industrialPartner: "EduTech",
    sdg: "SDG 4",
    status: "accepted",
  },
  {
    title: "Health Monitoring IoT System",
    supervisorName: "Dr. Khalid Mehmood",
    coSupervisor: "None",
    students: ["Kamran Yousuf", "Amna Butt", "Zain Malik"],
    industrialPartner: "MedCorp",
    sdg: "SDG 3",
    status: "under_review",
  },
  {
    title: "Smart Parking System",
    supervisorName: "Dr. Imran Khalid",
    coSupervisor: "None",
    students: ["Laiba Tariq", "Faisal Rao"],
    industrialPartner: "ParkEasy",
    sdg: "SDG 11",
    status: "pending",
  },
  {
    title: "Online Thesis Repository",
    supervisorName: "Dr. Ayesha Malik",
    coSupervisor: "None",
    students: ["Mahnoor Asif", "Talha Mehmood", "Sobia Rani"],
    industrialPartner: "None",
    sdg: "SDG 4",
    status: "accepted",
  },
  {
    title: "AI Chatbot for Student Support",
    supervisorName: "Dr. Khalid Mehmood",
    coSupervisor: "Dr. Imran Khalid",
    students: ["Waqas Javed", "Iqra Saleem"],
    industrialPartner: "BotLabs",
    sdg: "SDG 4",
    status: "pending",
  },
];

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog((prev) => [...prev, msg]);
  };

  // ─────────────────────────────────────────────
  // Clear all projects
  // ─────────────────────────────────────────────
  const clearProjects = async () => {
    setClearing(true);
    try {
      const snap = await getDocs(collection(db, "projects"));
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "projects", d.id))));
      toast.success("All projects cleared");
      addLog("✅ Cleared all projects");
    } catch {
      toast.error("Failed to clear projects");
    } finally {
      setClearing(false);
    }
  };

  // ─────────────────────────────────────────────
  // Seed everything
  // ─────────────────────────────────────────────
  const handleSeed = async () => {
    setSeeding(true);
    setLog([]);

    try {
      // Save current admin
      const currentAdmin = auth.currentUser;
      addLog("🔐 Saved admin session");

      // ── Step 1: Seed Faculty ──
      addLog("👥 Seeding faculty...");
      const facultyMap: Record<string, string> = {};

      for (const f of DUMMY_FACULTY) {
        try {
          // Check if already exists in users collection
          const snap = await getDocs(collection(db, "users"));
          const existing = snap.docs.find((d) => d.data().email === f.email);

          if (existing) {
            facultyMap[f.name] = existing.id;
            addLog(`⏭️ Skipped ${f.name} (already exists)`);
            continue;
          }

          // Create auth account
          const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);

          // Create Firestore profile
          await setDoc(doc(db, "users", cred.user.uid), {
            name: f.name,
            email: f.email,
            role: f.role,
            gender: f.gender,
            department: f.department,
            designation: f.designation,
            phone: f.phone,
            joinedAt: Timestamp.now(),
            profileComplete: f.profileComplete,
          });

          facultyMap[f.name] = cred.user.uid;
          addLog(`✅ Created faculty: ${f.name}`);

          // Restore admin session after each faculty creation
          if (currentAdmin) {
            await auth.updateCurrentUser(currentAdmin);
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes("email-already-in-use")) {
            const snap = await getDocs(collection(db, "users"));
            const existing = snap.docs.find((d) => d.data().email === f.email);
            if (existing) {
              facultyMap[f.name] = existing.id;
            }
            addLog(`⏭️ Skipped ${f.name} (auth already exists)`);
          } else {
            addLog(`❌ Failed to create ${f.name}`);
          }
        }
      }

      // Restore admin session
      if (currentAdmin) {
        await auth.updateCurrentUser(currentAdmin);
        addLog("🔐 Restored admin session");
      }

      // ── Step 2: Clear existing projects ──
      addLog("🗑️ Clearing old projects...");
      const oldProjects = await getDocs(collection(db, "projects"));
      await Promise.all(
        oldProjects.docs.map((d) => deleteDoc(doc(db, "projects", d.id)))
      );
      addLog("✅ Old projects cleared");

      // ── Step 3: Seed Projects ──
      addLog("📁 Seeding projects...");
      for (const p of DUMMY_PROJECTS) {
        const supervisorId = facultyMap[p.supervisorName] || "";
        await addDoc(collection(db, "projects"), {
          title: p.title,
          supervisor: p.supervisorName,
          supervisorId,
          coSupervisor: p.coSupervisor,
          students: p.students,
          studentCount: p.students.length,
          industrialPartner: p.industrialPartner,
          sdg: p.sdg,
          status: p.status,
          uploadedBy: supervisorId,
          uploadedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        addLog(`✅ Added project: ${p.title}`);
      }

      addLog("🎉 All done! Go to admin dashboard.");
      toast.success("Database seeded successfully!");

    } catch (err) {
      console.error(err);
      toast.error("Seeding failed — check logs");
      addLog("❌ Seeding failed");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Database Seeder</h1>
            <p className="text-sm text-gray-500">
              Populate Firestore with dummy faculty and projects
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4">
          <p className="text-sm font-medium text-yellow-800">⚠️ Important</p>
          <p className="mt-1 text-sm text-yellow-700">
            Run this only once. It will create 4 faculty accounts and 10 projects in Firebase.
            Running again will skip existing faculty and replace all projects.
          </p>
        </div>

        {/* Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding || clearing}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seeding ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Seeding...
              </>
            ) : (
              <>
                <RefreshCw size={15} />
                Seed Database
              </>
            )}
          </button>

          <button
            onClick={clearProjects}
            disabled={seeding || clearing}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Clear Projects Only
              </>
            )}
          </button>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Seed Log
            </p>
            <div className="flex flex-col gap-1.5">
              {log.map((line, i) => (
                <p key={i} className="text-sm text-gray-700 font-mono">
                  {line}
                </p>
              ))}
            </div>

            {/* Go to dashboard after seeding */}
            {log.includes("🎉 All done! Go to admin dashboard.") && (
              <Link
                href="/admin/dashboard"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <GraduationCap size={15} />
                Go to Dashboard
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
