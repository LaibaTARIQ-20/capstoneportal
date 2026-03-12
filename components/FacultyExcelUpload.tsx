"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";
import {
  Upload, X, FileSpreadsheet,
  AlertCircle, CheckCircle,
  University
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface FacultyRow {
  rowNumber: number;
  name: string;
  email: string;
  gender: string;
  department: string;
  designation: string;
  phone: string;
  errors: string[];
  valid: boolean;
}

interface FacultyExcelUploadProps {
  onImportComplete: () => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const DEFAULT_PASSWORD = "University@123";

const VALID_DESIGNATIONS = [
  "professor",
  "associate professor",
  "assistant professor",
  "lecturer",
];

// ─────────────────────────────────────────────
// Designation badge color
// ─────────────────────────────────────────────
function designationColor(d: string): string {
  const map: Record<string, string> = {
    "Professor":           "bg-purple-50 text-purple-700",
    "Associate Professor": "bg-blue-50 text-blue-700",
    "Assistant Professor": "bg-cyan-50 text-cyan-700",
    "Lecturer":            "bg-green-50 text-green-700",
  };
  return map[d] || "bg-gray-100 text-gray-600";
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function FacultyExcelUpload({
  onImportComplete,
  onClose,
}: FacultyExcelUploadProps) {
  const [rows, setRows]           = useState<FacultyRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep]           = useState<"upload" | "preview">("upload");
  const [fileName, setFileName]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Parse Excel file ────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data     = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const raw      = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

        // Skip header row
        const dataRows = raw.slice(1).filter((row) => row && row.length > 0);

        const parsed: FacultyRow[] = dataRows.map((row, index) => {
          const name        = String(row[0] || "").trim();
          const email       = String(row[1] || "").trim();
          const gender      = String(row[2] || "Male").trim();
          const department  = String(row[3] || "").trim();
          const designation = String(row[4] || "").trim();
          const phone       = String(row[5] || "").trim();

          // Validate required fields
          const errors: string[] = [];
          if (!name)  errors.push("Name is required");
          if (!email) errors.push("Email is required");
          if (email && !email.includes("@")) errors.push("Invalid email format");
          if (!department)  errors.push("Department is required");
          if (!designation) errors.push("Designation is required");
          if (
            designation &&
            !VALID_DESIGNATIONS.includes(designation.toLowerCase())
          ) {
            errors.push(
              "Designation must be: Professor, Associate Professor, Assistant Professor, or Lecturer"
            );
          }

          // Normalize values
          const normalizedGender = gender.toLowerCase() === "female" ? "Female" : "Male";
          const normalizedDesignation = designation
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");

          return {
            rowNumber: index + 2,
            name,
            email,
            gender:      normalizedGender,
            department,
            designation: normalizedDesignation,
            phone:       phone || "Not Set",
            errors,
            valid:       errors.length === 0,
          };
        });

        setRows(parsed);
        setStep("preview");
      } catch {
        toast.error("Failed to parse Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ─── Import to Firebase Auth + Firestore ─────
  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    let successCount = 0;
    let skipCount    = 0;
    let failCount    = 0;

    // Save current admin session before creating faculty accounts
    const currentAdmin = auth.currentUser;

    for (const row of validRows) {
      try {
        // Create Firebase Auth account
        const credential = await createUserWithEmailAndPassword(
          auth,
          row.email,
          DEFAULT_PASSWORD
        );

        const newUid = credential.user.uid;

        // Save Firestore profile — document ID = Auth UID
        await setDoc(doc(db, "users", newUid), {
          name:            row.name,
          email:           row.email,
          role:            "faculty",
          gender:          row.gender,
          department:      row.department,
          designation:     row.designation,
          phone:           row.phone,
          joinedAt:        Timestamp.now(),
          profileComplete: true,
        });

        successCount++;
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message.includes("email-already-in-use")
        ) {
          // Skip already existing accounts silently
          skipCount++;
        } else {
          failCount++;
        }
      }
    }

    // Restore admin session after creating all faculty accounts
    if (currentAdmin) {
      await auth.updateCurrentUser(currentAdmin);
    }

    setImporting(false);

    if (successCount > 0) {
      toast.success(
        `${successCount} faculty member${successCount > 1 ? "s" : ""} imported — default password: ${DEFAULT_PASSWORD}`
      );
      onImportComplete();
      onClose();
    }
    if (skipCount > 0) {
      toast.error(`${skipCount} email${skipCount > 1 ? "s" : ""} already exist — skipped`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} row${failCount > 1 ? "s" : ""} failed to import`);
    }
  };

  const validCount   = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">
              {step === "upload"
                ? "Upload Faculty Excel File"
                : `Preview — ${rows.length} rows found`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ══════════════════════════════════════
            STEP 1 — Upload
        ══════════════════════════════════════ */}
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center gap-6 px-6 py-12">

            {/* Column format guide */}
            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-700">
                Required Excel Column Order:
              </p>
              <div className="grid grid-cols-6 gap-2 text-xs">
                {[
                  ["A", "Name",        true],
                  ["B", "Email",       true],
                  ["C", "Gender",      false],
                  ["D", "Department",  true],
                  ["E", "Designation", true],
                  ["F", "Phone",       false],
                ].map(([col, label, required]) => (
                  <div
                    key={String(col)}
                    className={`rounded-lg px-2 py-1.5 text-center ${
                      required
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <p className="font-bold text-gray-800">{String(col)}</p>
                    <p className={`text-xs ${required ? "text-blue-700" : "text-gray-500"}`}>
                      {String(label)}
                    </p>
                    {required && (
                      <p className="text-red-500 text-xs">required</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Designation values */}
              <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2">
                <p className="text-xs font-medium text-yellow-800">
                  Designation must be one of:
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {[
                    "Professor",
                    "Associate Professor",
                    "Assistant Professor",
                    "Lecturer",
                  ].map((d) => (
                    <span
                      key={d}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${designationColor(d)}`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Default password notice */}
              <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <p className="text-xs font-medium text-green-800">
                  🔑 Default login password for all imported faculty:
                  <span className="ml-2 font-bold tracking-widest">
                    {DEFAULT_PASSWORD}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-green-600">
                  Faculty can login with their email and this password immediately after import.
                </p>
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Gender defaults to Male if empty. Phone defaults to Not Set.
              </p>
            </div>

            {/* Upload button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 rounded-xl border-2 border-dashed border-green-300 bg-green-50 px-8 py-6 text-green-600 hover:bg-green-100 transition-colors"
            >
              <Upload size={24} />
              <div className="text-left">
                <p className="font-semibold">Click to select Excel file</p>
                <p className="text-sm text-green-400">.xlsx files only</p>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        )}

        {/* ══════════════════════════════════════
            STEP 2 — Preview
        ══════════════════════════════════════ */}
        {step === "preview" && (
          <>
            {/* Stats bar */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">
                  {validCount} valid
                </span>
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1">
                  <AlertCircle size={14} className="text-red-600" />
                  <span className="text-xs font-medium text-red-700">
                    {invalidCount} errors
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-400 ml-auto">File: {fileName}</p>
            </div>

            {/* Preview table */}
            <div className="overflow-auto flex-1 px-6 py-4">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Row</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Gender</th>
                    <th className="px-3 py-2 text-left">Department</th>
                    <th className="px-3 py-2 text-left">Designation</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.valid
                          ? "bg-white hover:bg-gray-50"
                          : "bg-red-50"
                      }
                    >
                      <td className="px-3 py-2 text-gray-400">
                        {row.rowNumber}
                      </td>

                      {/* Name with avatar */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                            {row.name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((w) => w[0].toUpperCase())
                              .join("")}
                          </div>
                          <span className="font-medium text-gray-900">
                            {row.name || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2 text-gray-600">
                        {row.email || "—"}
                      </td>

                      {/* Gender badge */}
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            row.gender === "Female"
                              ? "bg-pink-50 text-pink-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {row.gender}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-gray-600">
                        {row.department || "—"}
                      </td>

                      {/* Designation badge */}
                      <td className="px-3 py-2">
                        {row.designation ? (
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium ${designationColor(row.designation)}`}
                          >
                            {row.designation}
                          </span>
                        ) : (
                          <span className="text-red-500">—</span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-gray-500">
                        {row.phone}
                      </td>

                      {/* Result */}
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <span className="text-green-600 font-medium">
                            ✓ Ready
                          </span>
                        ) : (
                          <div className="text-red-600">
                            {row.errors.map((err, i) => (
                              <div key={i} className="text-xs">
                                • {err}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Default password reminder */}
            <div className="mx-6 mb-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 shrink-0">
              <p className="text-sm font-medium text-green-800">
                🔑 All imported faculty will login with:
              </p>
              <div className="mt-1 flex items-center gap-4">
                <div>
                  <p className="text-xs text-green-600">Email</p>
                  <p className="text-sm font-medium text-green-900">
                    Their email from Excel
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">Password</p>
                  <p className="text-sm font-bold tracking-widest text-green-900">
                    {DEFAULT_PASSWORD}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 shrink-0">
              <button
                onClick={() => {
                  setStep("upload");
                  setRows([]);
                  setFileName("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Upload Different File
              </button>
              <button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating accounts...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={15} />
                    Import {validCount} Faculty Member{validCount !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
