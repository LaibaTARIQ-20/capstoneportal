"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  GraduationCap,
  FolderOpen,
  Users,
  LogOut,
  LayoutDashboard,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  Venus,
  Mars,
} from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Faculty {
  id: string;
  name: string;
  email: string;
  gender: "Male" | "Female";
  department: string;
  designation: string;
  phone: string;
}

interface FacultyProject {
  id: string;
  title: string;
  status: string;
  studentCount: number;
  sdg: string;
}

type ProjectStatus = "pending" | "under_review" | "accepted" | "rejected";

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<ProjectStatus, string> = {
    pending: "bg-gray-100 text-gray-600",
    under_review: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  const labels: Record<ProjectStatus, string> = {
    pending: "Pending",
    under_review: "Under Review",
    accepted: "Accepted",
    rejected: "Rejected",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status as ProjectStatus] || "bg-gray-100 text-gray-600"}`}
    >
      {labels[status as ProjectStatus] || status}
    </span>
  );
}

// ─────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-semibold text-white">
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
// Designation Badge
// ─────────────────────────────────────────────
function DesignationBadge({ designation }: { designation: string }) {
  const colorMap: Record<string, string> = {
    "Professor": "bg-purple-50 text-purple-700",
    "Associate Professor": "bg-blue-50 text-blue-700",
    "Assistant Professor": "bg-cyan-50 text-cyan-700",
    "Lecturer": "bg-green-50 text-green-700",
  };
  const style = colorMap[designation] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {designation}
    </span>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function FacultyDetailPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [loggingOut, setLoggingOut] = useState(false);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [projects, setProjects] = useState<FacultyProject[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const facultyId = params.id as string;

  // ─────────────────────────────────────────────
  // Route protection
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "admin") {
      router.push("/faculty/dashboard");
    }
  }, [user, loading, router]);

  // ─────────────────────────────────────────────
  // Fetch faculty + their projects from Firestore
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!facultyId) return;

    const fetchData = async () => {
      setPageLoading(true);
      try {
        // Fetch faculty profile
        const facultyDoc = await getDoc(doc(db, "users", facultyId));
        if (facultyDoc.exists()) {
          setFaculty({ id: facultyDoc.id, ...facultyDoc.data() } as Faculty);
        }

        // Fetch their projects
        const projectsQuery = query(
          collection(db, "projects"),
          where("supervisorId", "==", facultyId)
        );
        const projectsSnap = await getDocs(projectsQuery);
        const projectsData = projectsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FacultyProject[];
        setProjects(projectsData);

      } catch (err) {
        console.error("Failed to load faculty details:", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [facultyId]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push("/login");
  };

  // ─────────────────────────────────────────────
  // Loading states
  // ─────────────────────────────────────────────
  if (loading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  // Faculty not found
  if (!faculty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Faculty not found</p>
          <Link
            href="/admin/faculty"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            ← Back to faculty list
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────────
  const accepted = projects.filter((p) => p.status === "accepted").length;
  const pending = projects.filter((p) => p.status === "pending").length;
  const underReview = projects.filter((p) => p.status === "under_review").length;
  const rejected = projects.filter((p) => p.status === "rejected").length;

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-zinc-900 px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <GraduationCap size={22} className="text-blue-400" />
          <span className="text-base font-bold text-white">Capstone Portal</span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LayoutDashboard size={17} />
            Dashboard
          </Link>
          <Link
            href="/admin/projects"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <FolderOpen size={17} />
            Projects
          </Link>
          <Link
            href="/admin/faculty"
            className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm font-medium text-white"
          >
            <Users size={17} />
            Faculty
          </Link>
        </nav>
        <div className="mt-auto">
          <div className="mb-3 rounded-lg bg-zinc-800 px-3 py-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-400">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <LogOut size={17} />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 flex-1 px-8 py-8">

        {/* Back */}
        <Link
          href="/admin/faculty"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Faculty
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Left: Profile Card ── */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              {/* Avatar + Name */}
              <div className="mb-6 flex flex-col items-center text-center">
                <Avatar name={faculty.name} />
                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  {faculty.name}
                </h2>
                <div className="mt-1.5">
                  <DesignationBadge designation={faculty.designation} />
                </div>
              </div>

              <div className="mb-5 h-px bg-gray-100" />

              {/* Info Rows */}
              <div className="flex flex-col gap-4">

                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Email</p>
                    <p className="text-sm text-gray-700 break-all">{faculty.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Phone</p>
                    <p className="text-sm text-gray-700">{faculty.phone || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Department</p>
                    <p className="text-sm text-gray-700">{faculty.department || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BadgeCheck size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Designation</p>
                    <p className="text-sm text-gray-700">{faculty.designation || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {faculty.gender === "Female" ? (
                    <Venus size={16} className="mt-0.5 shrink-0 text-pink-400" />
                  ) : (
                    <Mars size={16} className="mt-0.5 shrink-0 text-blue-400" />
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Gender</p>
                    <p className="text-sm text-gray-700">{faculty.gender || "—"}</p>
                  </div>
                </div>

              </div>

              <div className="my-5 h-px bg-gray-100" />

              {/* Mini Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-gray-900">{projects.length}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="rounded-lg bg-green-50 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-green-700">{accepted}</p>
                  <p className="text-xs text-green-600">Accepted</p>
                </div>
                <div className="rounded-lg bg-yellow-50 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-yellow-700">{underReview}</p>
                  <p className="text-xs text-yellow-600">In Review</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-gray-700">{pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>

            </div>
          </div>

          {/* ── Right: Projects ── */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-gray-800">
                  Supervised Projects
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {projects.length} projects
                </span>
              </div>

              {/* Empty */}
              {projects.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400">No projects assigned yet</p>
                </div>
              )}

              {/* Projects Table */}
              {projects.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left">#</th>
                      <th className="px-6 py-3 text-left">Project Title</th>
                      <th className="px-6 py-3 text-left">SDG</th>
                      <th className="px-6 py-3 text-left">Students</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map((project, index) => (
                      <tr
                        key={project.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-3 text-xs text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {project.title}
                        </td>
                        <td className="px-6 py-3">
                          {project.sdg ? (
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                              {project.sdg}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {project.studentCount} students
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={project.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>

            {/* Rejected projects note */}
            {rejected > 0 && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-5 py-3">
                <p className="text-sm text-red-600">
                  {rejected} project{rejected > 1 ? "s" : ""} rejected — faculty may need to revise and resubmit.
                </p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
