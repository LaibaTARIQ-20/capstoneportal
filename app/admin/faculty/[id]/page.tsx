"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { ArrowLeft, Save, Mail } from "lucide-react";
import toast from "react-hot-toast";

interface Faculty {
  id: string;
  name: string;
  email: string;
  gender: string;
  department: string;
  designation: string;
  phone: string;
  joinedAt?: { seconds: number };
}

function DesignationBadge({ designation }: { designation: string }) {
  const map: Record<string, string> = {
    "Professor":           "bg-purple-100 text-purple-700",
    "Associate Professor": "bg-blue-100 text-blue-700",
    "Assistant Professor": "bg-cyan-100 text-cyan-700",
    "Lecturer":            "bg-green-100 text-green-700",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${map[designation] || "bg-gray-100 text-gray-600"}`}>
      {designation || "—"}
    </span>
  );
}

export default function AdminFacultyDetailPage() {
  const params  = useParams();
  const id      = params?.id as string;
  const router  = useRouter();
  const { user, loading } = useAuth();

  const [faculty, setFaculty]   = useState<Faculty | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving]     = useState(false);

  const [name, setName]               = useState("");
  const [gender, setGender]           = useState("Male");
  const [department, setDepartment]   = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone]             = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/faculty/dashboard"); return; }
  }, [user, loading, router]);

  useEffect(() => {
    if (!id || loading || !user) return;
    const fetchData = async () => {
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (!snap.exists()) { router.push("/admin/faculty"); return; }
        const data = { id: snap.id, ...snap.data() } as Faculty;
        setFaculty(data);
        setName(data.name || "");
        setGender(data.gender || "Male");
        setDepartment(data.department || "");
        setDesignation(data.designation || "");
        setPhone(data.phone || "");
      } catch {
        toast.error("Failed to load faculty");
        router.push("/admin/faculty");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id, user, loading, router]);

  const handleSave = async () => {
    if (!name || !department || !designation || !phone) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", id), {
        name, gender, department, designation, phone,
        updatedAt: Timestamp.now(),
      });
      toast.success("Faculty updated successfully");
      setFaculty((prev) =>
        prev ? { ...prev, name, gender, department, designation, phone } : prev
      );
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (ts?: { seconds: number }) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-PK", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  if (loading || fetching) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );

  if (!user || !faculty) return null;

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";
  const labelCls = "block mb-2 text-xs font-bold uppercase tracking-wide text-gray-600";

  return (
    <>
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => router.push("/admin/faculty")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />Back to Faculty
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>
          ) : (
            <><Save size={15} />Save Changes</>
          )}
        </button>
      </div>

      {/* Profile banner */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow">
            {name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h1 className="text-lg font-bold text-gray-900">{name || faculty.name}</h1>
              <DesignationBadge designation={designation || faculty.designation} />
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                (gender || faculty.gender) === "Female"
                  ? "bg-pink-100 text-pink-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {gender || faculty.gender}
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <Mail size={13} className="text-gray-400" />{faculty.email}
              </span>
              <span className="text-sm text-gray-500">
                Joined: {formatDate(faculty.joinedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-sm font-bold text-gray-800">Edit Faculty Details</p>
          <p className="text-xs text-gray-500 mt-0.5">Update the faculty member information below</p>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* Full Name — full width */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <label className={labelCls}>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
