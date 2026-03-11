"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProjectsTable from "@/components/ProjectsTable";
import {
  GraduationCap,
  FolderOpen,
  Users,
  LogOut,
  LayoutDashboard,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface ProjectForm {
  title: string;
  supervisorId: string;
  coSupervisor: string;
  studentsRaw: string;
  industrialPartner: string;
  sdg: string;
  status: "pending" | "under_review" | "accepted" | "rejected";
}

interface FacultyOption {
  id: string;
  name: string;
}

const EMPTY_FORM: ProjectForm = {
  title: "",
  supervisorId: "",
  coSupervisor: "",
  studentsRaw: "",
  industrialPartner: "",
  sdg: "",
  status: "pending",
};

export default function AdminProjectsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [facultyList, setFacultyList] = useState<FacultyOption[]>([]);

  // ─── Route protection ───────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") router.push("/faculty/dashboard");
  }, [user, loading, router]);

  // ─── Load faculty for supervisor dropdown ───
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as { role: string; name: string }) }))
          .filter((u) => u.role === "faculty")
          .map((u) => ({ id: u.id, name: u.name }));
        setFacultyList(list);
      } catch {
        console.error("Failed to load faculty");
      }
    };
    fetchFaculty();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = "/login";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.supervisorId || !form.studentsRaw || !form.sdg) {
      toast.error("Please fill in all required fields");
      return;
    }

    const students = form.studentsRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (students.length < 2 || students.length > 4) {
      toast.error("Please enter 2 to 4 student names separated by commas");
      return;
    }

    const supervisorName = facultyList.find((f) => f.id === form.supervisorId)?.name || "";

    setSubmitting(true);
    try {
      await addDoc(collection(db, "projects"), {
        title: form.title,
        supervisor: supervisorName,
        supervisorId: form.supervisorId,
        coSupervisor: form.coSupervisor || "None",
        students,
        studentCount: students.length,
        industrialPartner: form.industrialPartner || "None",
        sdg: form.sdg,
        status: form.status,
        uploadedBy: user?.uid || "",
        uploadedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success("Project added successfully");
      setForm(EMPTY_FORM);
      setShowModal(false);
      setRefreshKey((prev) => prev + 1);
    } catch {
      toast.error("Failed to add project");
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
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white">
            <FolderOpen size={17} />Projects
          </Link>
          <Link href="/admin/faculty"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
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

      {/* Main Content */}
      <main className="ml-60 flex-1 px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">Manage all capstone projects — update status or remove entries.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
            <Plus size={15} />Add Project
          </button>
        </div>
        <ProjectsTable key={refreshKey} isAdmin={true} />
      </main>

      {/* Add Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Add New Project</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Project Title <span className="text-red-500">*</span></label>
                <input name="title" value={form.title} onChange={handleChange}
                  placeholder="AI-Based Smart Attendance System"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Supervisor <span className="text-red-500">*</span></label>
                <select name="supervisorId" value={form.supervisorId} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="">Select supervisor</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Co-Supervisor <span className="text-xs text-gray-400">(optional)</span></label>
                <input name="coSupervisor" value={form.coSupervisor} onChange={handleChange}
                  placeholder="Dr. John Smith"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Students <span className="text-red-500">*</span></label>
                <input name="studentsRaw" value={form.studentsRaw} onChange={handleChange}
                  placeholder="Ali Hassan, Sara Khan, Umar Farooq"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <p className="text-xs text-gray-400">Enter 2 to 4 names separated by commas</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Industrial Partner <span className="text-xs text-gray-400">(optional)</span></label>
                <input name="industrialPartner" value={form.industrialPartner} onChange={handleChange}
                  placeholder="TechCorp"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">SDG <span className="text-red-500">*</span></label>
                <select name="sdg" value={form.sdg} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="">Select SDG</option>
                  <option value="SDG 1">SDG 1 - No Poverty</option>
                  <option value="SDG 2">SDG 2 - Zero Hunger</option>
                  <option value="SDG 3">SDG 3 - Good Health</option>
                  <option value="SDG 4">SDG 4 - Quality Education</option>
                  <option value="SDG 5">SDG 5 - Gender Equality</option>
                  <option value="SDG 6">SDG 6 - Clean Water</option>
                  <option value="SDG 7">SDG 7 - Clean Energy</option>
                  <option value="SDG 8">SDG 8 - Decent Work</option>
                  <option value="SDG 9">SDG 9 - Industry & Innovation</option>
                  <option value="SDG 10">SDG 10 - Reduced Inequalities</option>
                  <option value="SDG 11">SDG 11 - Sustainable Cities</option>
                  <option value="SDG 12">SDG 12 - Responsible Consumption</option>
                  <option value="SDG 13">SDG 13 - Climate Action</option>
                  <option value="SDG 14">SDG 14 - Life Below Water</option>
                  <option value="SDG 15">SDG 15 - Life on Land</option>
                  <option value="SDG 16">SDG 16 - Peace & Justice</option>
                  <option value="SDG 17">SDG 17 - Partnerships</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
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
                  ) : "Add Project"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}