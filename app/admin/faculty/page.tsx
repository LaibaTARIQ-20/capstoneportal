"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FacultyTable from "@/components/FacultyTable";
import {
  GraduationCap, FolderOpen, Users, LogOut,
  LayoutDashboard, UserPlus, X,
} from "lucide-react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface FacultyForm {
  name: string;
  email: string;
  password: string;
  gender: "Male" | "Female";
  department: string;
  designation: string;
  phone: string;
}

const EMPTY_FORM: FacultyForm = {
  name: "", email: "", password: "",
  gender: "Male", department: "", designation: "", phone: "",
};

export default function AdminFacultyPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FacultyForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ─── Route protection ───────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") router.push("/faculty/dashboard");
  }, [user, loading, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = "/login";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.department || !form.designation || !form.phone) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const currentAdmin = auth.currentUser;
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const newUid = credential.user.uid;

      await setDoc(doc(db, "users", newUid), {
        name: form.name,
        email: form.email,
        role: "faculty",
        gender: form.gender,
        department: form.department,
        designation: form.designation,
        phone: form.phone,
        joinedAt: Timestamp.now(),
        profileComplete: true,
      });

      if (currentAdmin) await auth.updateCurrentUser(currentAdmin);

      toast.success(`${form.name} added successfully`);
      setForm(EMPTY_FORM);
      setShowModal(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("email-already-in-use")) {
          toast.error("This email is already registered");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to add faculty");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <GraduationCap size={22} className="text-blue-400" />
          <span className="text-base font-bold text-white">Capstone Portal</span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <LayoutDashboard size={17} />Dashboard
          </Link>
          <Link href="/admin/projects"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <FolderOpen size={17} />Projects
          </Link>
          <Link href="/admin/faculty"
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white">
            <Users size={17} />Faculty
          </Link>
        </nav>
        <div className="mt-auto">
          <div className="mb-3 rounded-lg bg-zinc-800 px-3 py-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-400">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">Admin</span>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50">
            <LogOut size={17} />{loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
            <p className="mt-1 text-sm text-gray-500">Manage faculty members — view details, edit info, or add new members.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
            <UserPlus size={15} />Add Faculty
          </button>
        </div>
        <FacultyTable key={refreshKey} />
      </main>

      {/* Add Faculty Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Add New Faculty</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Dr. John Smith"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@university.edu"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Department</label>
                <input name="department" value={form.department} onChange={handleChange} placeholder="Software Engineering"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Designation</label>
                <select name="designation" value={form.designation} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="">Select designation</option>
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="03001234567"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Adding...
                    </span>
                  ) : "Add Faculty"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}