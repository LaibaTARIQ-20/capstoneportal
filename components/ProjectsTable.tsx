"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ProjectStatus = "pending" | "under_review" | "accepted" | "rejected";

interface Project {
  id: string;
  title: string;
  description: string;
  students: string[];
  studentCount: number;
  supervisor: string;
  coSupervisor: string | null;
  industrialPartner: string;
  sdg: string;
  status: ProjectStatus;
}

// ─────────────────────────────────────────────
// Dummy Data
// ─────────────────────────────────────────────
const DUMMY_PROJECTS: Project[] = [
  {
    id: "1",
    title: "AI-Based Smart Attendance System",
    description: "Facial recognition based attendance system for universities",
    students: ["Ali Raza", "Ahmed Khan", "Sara Noor"],
    studentCount: 3,
    supervisor: "Dr. Ayesha Malik",
    coSupervisor: "Dr. Hamza Tariq",
    industrialPartner: "TechSoft Solutions",
    sdg: "SDG 4 - Quality Education",
    status: "pending",
  },
  {
    id: "2",
    title: "Food Waste Reduction App",
    description: "Mobile app to reduce food waste by connecting donors and NGOs",
    students: ["Fatima Zahra", "Bilal Hussain"],
    studentCount: 2,
    supervisor: "Dr. Imran Khalid",
    coSupervisor: null,
    industrialPartner: "GreenTech Pvt Ltd",
    sdg: "SDG 12 - Responsible Consumption",
    status: "under_review",
  },
  {
    id: "3",
    title: "Blockchain Voting System",
    description: "Secure digital voting system using blockchain technology",
    students: ["Usman Tariq", "Sana Ahmed", "Hira Shah"],
    studentCount: 3,
    supervisor: "Dr. Ayesha Malik",
    coSupervisor: "Dr. Saad Khan",
    industrialPartner: "SecureVote Labs",
    sdg: "SDG 16 - Peace & Justice",
    status: "accepted",
  },
  {
    id: "4",
    title: "Smart Traffic Management System",
    description: "AI-based traffic monitoring and signal optimization",
    students: ["Ahmed Ali", "Zainab Noor"],
    studentCount: 2,
    supervisor: "Dr. Khalid Mehmood",
    coSupervisor: null,
    industrialPartner: "SmartCity Solutions",
    sdg: "SDG 11 - Sustainable Cities",
    status: "rejected",
  },
  {
    id: "5",
    title: "AI Resume Analyzer",
    description: "System that analyzes resumes using NLP",
    students: ["Maryam Tariq", "Hassan Raza", "Daniyal Khan"],
    studentCount: 3,
    supervisor: "Dr. Imran Khalid",
    coSupervisor: "Dr. Sana Javed",
    industrialPartner: "HR Tech Labs",
    sdg: "SDG 8 - Decent Work",
    status: "pending",
  },
  {
    id: "6",
    title: "E-Learning Recommendation System",
    description: "Personalized course recommendation using machine learning",
    students: ["Areeba Khan", "Noor Fatima"],
    studentCount: 2,
    supervisor: "Dr. Ayesha Malik",
    coSupervisor: null,
    industrialPartner: "EduSmart",
    sdg: "SDG 4 - Quality Education",
    status: "accepted",
  },
  {
    id: "7",
    title: "Health Monitoring IoT System",
    description: "Wearable device to monitor heart rate and body temperature",
    students: ["Hamza Ali", "Fahad Shah", "Ayesha Tariq"],
    studentCount: 3,
    supervisor: "Dr. Khalid Mehmood",
    coSupervisor: "Dr. Saad Khan",
    industrialPartner: "MedTech Solutions",
    sdg: "SDG 3 - Good Health",
    status: "under_review",
  },
  {
    id: "8",
    title: "Smart Parking System",
    description: "IoT based parking availability detection for smart cities",
    students: ["Abdullah Khan", "Usama Ali"],
    studentCount: 2,
    supervisor: "Dr. Imran Khalid",
    coSupervisor: null,
    industrialPartner: "ParkTech Systems",
    sdg: "SDG 11 - Sustainable Cities",
    status: "pending",
  },
  {
    id: "9",
    title: "Online Thesis Repository",
    description: "Digital repository for storing and searching university theses",
    students: ["Sana Raza", "Ahmed Bilal", "Hiba Noor"],
    studentCount: 3,
    supervisor: "Dr. Ayesha Malik",
    coSupervisor: "Dr. Sana Javed",
    industrialPartner: "UniTech",
    sdg: "SDG 9 - Industry Innovation",
    status: "accepted",
  },
  {
    id: "10",
    title: "AI Chatbot for Student Support",
    description: "AI chatbot to answer student queries about courses",
    students: ["Zoya Khan", "Daniyal Raza"],
    studentCount: 2,
    supervisor: "Dr. Khalid Mehmood",
    coSupervisor: null,
    industrialPartner: "CampusTech",
    sdg: "SDG 4 - Quality Education",
    status: "pending",
  },
];

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: ProjectStatus }) {
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface ProjectsTableProps {
  isAdmin?: boolean;
  supervisorId?: string;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ProjectsTable({
  isAdmin = false,
  supervisorId,
}: ProjectsTableProps) {
  const [search, setSearch] = useState("");

  // Filter by supervisor if faculty view
  const roleFiltered = useMemo(() => {
    if (isAdmin) return DUMMY_PROJECTS;
    return DUMMY_PROJECTS.filter((p) => p.supervisor === supervisorId);
  }, [isAdmin, supervisorId]);

  // Filter by search
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return roleFiltered;
    return roleFiltered.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.supervisor.toLowerCase().includes(term) ||
        p.sdg.toLowerCase().includes(term) ||
        p.students.some((s) => s.toLowerCase().includes(term))
    );
  }, [search, roleFiltered]);

  return (
    <div className="w-full">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <span className="shrink-0 text-xs text-gray-400">
          {filtered.length} of {roleFiltered.length} projects
        </span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <p className="text-sm text-gray-400">No projects found</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Project Title</th>
                <th className="px-4 py-3 text-left">Students</th>
                <th className="px-4 py-3 text-left">Supervisor</th>
                <th className="px-4 py-3 text-left">Co-Supervisor</th>
                <th className="px-4 py-3 text-left">SDG</th>
                <th className="px-4 py-3 text-left">Status</th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((project, index) => (
                <tr
                  key={project.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  {/* Number */}
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {index + 1}
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="font-medium text-gray-900">{project.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {project.description}
                    </p>
                  </td>

                  {/* Students */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {project.students.map((student, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                        >
                          {student}
                        </span>
                      ))}
                    </div>
                    <span className="mt-1 block text-xs text-gray-400">
                      {project.studentCount} students
                    </span>
                  </td>

                  {/* Supervisor */}
                  <td className="px-4 py-3 text-gray-700">
                    {project.supervisor}
                  </td>

                  {/* Co-Supervisor */}
                  <td className="px-4 py-3">
                    {project.coSupervisor ? (
                      <span className="text-gray-700">
                        {project.coSupervisor}
                      </span>
                    ) : (
                      <span className="text-xs italic text-gray-400">
                        None
                      </span>
                    )}
                  </td>

                  {/* SDG */}
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      {project.sdg}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={project.status} />
                  </td>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={project.status}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}