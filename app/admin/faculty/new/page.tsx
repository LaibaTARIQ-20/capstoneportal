"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { addFaculty } from "@/services/faculty/faculty.service";
import { DESIGNATIONS, DEPARTMENTS } from "@/constants";
import toast from "react-hot-toast";
import type { FacultyFormData } from "@/types";

export default function AddFacultyPage() {
  const router = useRouter();

  const [form, setForm] = useState<FacultyFormData>({
    name: "",
    email: "",
    password: "",
    gender: "Male",
    department: "",
    designation: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof FacultyFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.department ||
      !form.designation ||
      !form.phone
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await addFaculty(form);
      toast.success(`${form.name} added successfully`);
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

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";
  const labelCls =
    "block mb-2 text-xs font-bold uppercase tracking-wide text-gray-600";

  return (
    <>
      <button
        onClick={() => router.push("/admin/faculty")}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Faculty
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Faculty</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new faculty account with login access.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-sm font-bold text-gray-800">Faculty Information</p>
          <p className="text-xs text-gray-500 mt-0.5">
            All fields are required
          </p>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <label className={labelCls}>Full Name</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Dr. John Smith"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="john@university.edu"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min. 6 characters"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Department</label>
              <select
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                className={inputCls}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Designation</label>
              <select
                value={form.designation}
                onChange={(e) => set("designation", e.target.value)}
                className={inputCls}
              >
                <option value="">Select designation</option>
                {DESIGNATIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Gender</label>
              <select
                value={form.gender}
                onChange={(e) =>
                  set("gender", e.target.value as "Male" | "Female")
                }
                className={inputCls}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. 03001234567"
                className={inputCls}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6 flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/faculty")}
              className="rounded-xl border-2 border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
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
        </div>
      </div>
    </>
  );
}
