"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap, FolderOpen, Users, LogOut,
  LayoutDashboard, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { secondaryAuth, db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function AddFacultyPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [gender, setGender]           = useState("Male");
  const [department, setDepartment]   = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone]             = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/faculty/dashboard"); return; }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !department || !designation || !phone) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth, email, password
      );
      const newUid = credential.user.uid;
      await secondaryAuth.signOut();
      await setDoc(doc(db, "users", newUid), {
        name, email, role: "faculty",
        gender, department, designation, phone,
        joinedAt: Timestamp.now(),
        profileComplete: true,
      });
      toast.success(`${name} added successfully`);
      router.push("/admin/faculty");
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

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const inputClass = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";
  const labelClass = "block mb-2 text-xs font-bold uppercase tracking-wide text-gray-600";

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6 z-30">
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
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">Admin</span>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50">
            <LogOut size={17} />{loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main — full page */}
      <main className="ml-60 flex-1 flex flex-col px-8 py-8">

        {/* Back */}
        <button onClick={() => router.push("/admin/faculty")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors w-fit">
          <ArrowLeft size={16} />Back to Faculty
        </button>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Add New Faculty</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new faculty account with login access.
          </p>
        </div>

        {/* Full width form card */}
        <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="border-b border-gray-100 px-8 py-5 bg-gray-50">
            <p className="text-base font-bold text-gray-800">Faculty Information</p>
            <p className="text-sm text-gray-500 mt-0.5">All fields are required</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {/* Full Name — spans full row */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. John Smith"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@university.edu"
                  className={inputClass}
                />
              </div>

              {/* Password */}
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className={inputClass}
                />
              </div>

              {/* Department */}
              <div>
                <label className={labelClass}>Department</label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className={inputClass}
                />
              </div>

              {/* Designation */}
              <div>
                <label className={labelClass}>Designation</label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select designation</option>
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={inputClass}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className={inputClass}
                />
              </div>

            </div>

            {/* Divider */}
            <div className="my-8 border-t border-gray-100" />

            {/* Buttons */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/admin/faculty")}
                className="rounded-xl border-2 border-gray-200 px-8 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding...
                  </span>
                ) : "Add Faculty"}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}