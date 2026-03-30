"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { secondaryAuth, db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function AddFacultyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      router.push("/faculty/dashboard");
      return;
    }
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
        secondaryAuth,
        email,
        password,
      );
      const newUid = credential.user.uid;
      await secondaryAuth.signOut();
      await setDoc(doc(db, "users", newUid), {
        name,
        email,
        role: "faculty",
        gender,
        department,
        designation,
        phone,
        joinedAt: Timestamp.now(),
        profileComplete: true,
      });
      toast.success(`${name} added successfully`);
      router.push("/admin/faculty");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(
          error.message.includes("email-already-in-use")
            ? "This email is already registered"
            : error.message,
        );
      } else {
        toast.error("Failed to add faculty");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );

  if (!user) return null;

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";
  const labelCls =
    "block mb-2 text-xs font-bold uppercase tracking-wide text-gray-600";

  return (
    <>
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/faculty")}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Faculty
      </button>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Faculty</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new faculty account with login access.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-sm font-bold text-gray-800">Faculty Information</p>
          <p className="text-xs text-gray-500 mt-0.5">
            All fields are required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Full Name — full width */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <label className={labelCls}>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. John Smith"
                className={inputCls}
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@university.edu"
                className={inputCls}
              />
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputCls}
              />
            </div>

            {/* Department */}
            <div>
              <label className={labelCls}>Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Software Engineering"
                className={inputCls}
              />
            </div>

            {/* Designation */}
            <div>
              <label className={labelCls}>Designation</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className={inputCls}
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
              <label className={labelCls}>Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputCls}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className={labelCls}>Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 03001234567"
                className={inputCls}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/faculty")}
              className="rounded-xl border-2 border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Adding...
                </span>
              ) : (
                "Add Faculty"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
