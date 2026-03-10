"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import ProjectsTable from "./ProjectsTable";

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

// ─────────────────────────────────────────────
// Dummy Data
// ─────────────────────────────────────────────
const DUMMY_FACULTY: Faculty[] = [
  {
    id: "FAC001",
    name: "Dr. Ayesha Malik",
    email: "ayesha.malik@university.edu",
    gender: "Female",
    department: "Software Engineering",
    designation: "Associate Professor",
    phone: "03001234567",
  },
  {
    id: "FAC002",
    name: "Dr. Imran Khalid",
    email: "imran.khalid@university.edu",
    gender: "Male",
    department: "Computer Science",
    designation: "Assistant Professor",
    phone: "03011234567",
  },
  {
    id: "FAC003",
    name: "Dr. Khalid Mehmood",
    email: "khalid.mehmood@university.edu",
    gender: "Male",
    department: "Information Technology",
    designation: "Professor",
    phone: "03021234567",
  },
  {
    id: "FAC004",
    name: "Dr. Sana Javed",
    email: "sana.javed@university.edu",
    gender: "Female",
    department: "Software Engineering",
    designation: "Lecturer",
    phone: "03031234567",
  },
];

// ─────────────────────────────────────────────
// Gender Badge
// ─────────────────────────────────────────────
function GenderBadge({ gender }: { gender: "Male" | "Female" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${gender === "Female"
          ? "bg-pink-50 text-pink-700"
          : "bg-blue-50 text-blue-700"
        }`}
    >
      {gender}
    </span>
  );
}

// ─────────────────────────────────────────────
// Avatar — initials based
// ─────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function FacultyTable() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return DUMMY_FACULTY;
    return DUMMY_FACULTY.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.email.toLowerCase().includes(term) ||
        f.department.toLowerCase().includes(term) ||
        f.designation.toLowerCase().includes(term)
    );
  }, [search]);

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
            placeholder="Search faculty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <span className="shrink-0 text-xs text-gray-400">
          {filtered.length} of {DUMMY_FACULTY.length} faculty
        </span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <p className="text-sm text-gray-400">No faculty found</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">

            {/* Head */}
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Gender</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Designation</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((faculty, index) => (
                <tr
                  key={faculty.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  {/* Number */}
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {index + 1}
                  </td>

                  {/* Name — clickable → detail page */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/faculty/${faculty.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar name={faculty.name} />
                      <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {faculty.name}
                      </span>
                    </Link>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-gray-500">
                    {faculty.email}
                  </td>

                  {/* Gender */}
                  <td className="px-4 py-3">
                    <GenderBadge gender={faculty.gender} />
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3 text-gray-700">
                    {faculty.department}
                  </td>

                  {/* Designation */}
                  <td className="px-4 py-3 text-gray-700">
                    {faculty.designation}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 text-gray-500">
                    {faculty.phone}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/faculty/${faculty.id}`}
                        className="rounded-lg bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        View
                      </Link>
                      <button className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors">
                        Edit
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
