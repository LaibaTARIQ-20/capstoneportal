/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  collection, addDoc, getDocs, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import {
  Upload, X, FileSpreadsheet,
  AlertCircle, CheckCircle, AlertTriangle,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ExcelRow {
  rowNumber: number;
  title: string;
  student1: string;
  student2: string;
  student3: string;
  student4: string;
  students: string[];
  supervisorName: string;
  supervisorId: string;
  coSupervisor: string;
  industrialPartner: string;
  sdg: string;
  errors: string[];
  valid: boolean;
  isDuplicate: boolean;
}

interface FacultyMap {
  [name: string]: string;
}

interface ExcelUploadProps {
  onImportComplete: () => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ExcelUpload({
  onImportComplete,
  onClose,
}: ExcelUploadProps) {
  const [rows, setRows]           = useState<ExcelRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep]           = useState<"upload" | "preview">("upload");
  const [fileName, setFileName]   = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Load faculty map ────────────────────────
  const loadFacultyMap = async (): Promise<FacultyMap> => {
    const snap = await getDocs(collection(db, "users"));
    const map: FacultyMap = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.role === "faculty" && data.name) {
        map[data.name.trim().toLowerCase()] = d.id;
      }
    });
    return map;
  };

  // ─── Load existing project titles ────────────
  const loadExistingTitles = async (): Promise<Set<string>> => {
    const snap = await getDocs(collection(db, "projects"));
    const titles = new Set<string>();
    snap.docs.forEach((d) => {
      const title = d.data().title?.trim().toLowerCase();
      if (title) titles.add(title);
    });
    return titles;
  };

  // ─── Parse Excel ─────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const [facultyMap, existingTitles] = await Promise.all([
      loadFacultyMap(),
      loadExistingTitles(),
    ]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data     = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const raw      = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

        const dataRows = raw.slice(1).filter((row) => row && row.length > 0);

        const parsed: ExcelRow[] = dataRows.map((row, index) => {
          // ── COLUMN ORDER ──────────────────────
          // A = Project Title
          // B = Student 1
          // C = Student 2
          // D = Student 3
          // E = Student 4
          // F = Supervisor Name
          // G = Co-Supervisor
          // H = Industrial Partner
          // I = SDG
          const title             = String(row[0] || "").trim();
          const student1          = String(row[1] || "").trim();
          const student2          = String(row[2] || "").trim();
          const student3          = String(row[3] || "").trim();
          const student4          = String(row[4] || "").trim();
          const supervisorName    = String(row[5] || "").trim();
          const coSupervisor      = String(row[6] || "").trim();
          const industrialPartner = String(row[7] || "").trim();
          const sdg               = String(row[8] || "").trim();

          const students = [student1, student2, student3, student4].filter(
            (s) => s.length > 0
          );

          // Validate
          const errors: string[] = [];
          if (!title)          errors.push("Project title is required");
          if (!supervisorName) errors.push("Supervisor name is required");
          if (students.length < 1) errors.push("At least 1 student is required");
          if (!sdg)            errors.push("SDG is required");

          // Duplicate check
          const isDuplicate = title
            ? existingTitles.has(title.toLowerCase())
            : false;

          // Supervisor match
          const supervisorId = supervisorName
            ? (facultyMap[supervisorName.toLowerCase()] || "")
            : "";

          return {
            rowNumber: index + 2,
            title,
            student1, student2, student3, student4,
            students,
            supervisorName,
            supervisorId,
            coSupervisor:      coSupervisor || "None",
            industrialPartner: industrialPartner || "None",
            sdg,
            errors,
            valid:       errors.length === 0,
            isDuplicate,
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

  // ─── Import ──────────────────────────────────
  const handleImport = async () => {
    const toImport = rows.filter((r) => r.valid && !r.isDuplicate);
    if (toImport.length === 0) {
      toast.error("No new projects to import");
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount    = 0;

    for (const row of toImport) {
      try {
        await addDoc(collection(db, "projects"), {
          title:             row.title,
          supervisor:        row.supervisorName,
          supervisorId:      row.supervisorId,
          coSupervisor:      row.coSupervisor,
          students:          row.students,
          studentCount:      row.students.length,
          industrialPartner: row.industrialPartner,
          sdg:               row.sdg,
          status:            "pending",
          uploadedBy:        "excel_import",
          uploadedAt:        Timestamp.now(),
          updatedAt:         Timestamp.now(),
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setImporting(false);

    if (successCount > 0) {
      toast.success(
        `${successCount} project${successCount > 1 ? "s" : ""} imported successfully`
      );
      onImportComplete();
      onClose();
    }
    if (failCount > 0) {
      toast.error(`${failCount} project${failCount > 1 ? "s" : ""} failed`);
    }
  };

  const validRows     = rows.filter((r) => r.valid);
  const invalidCount  = rows.filter((r) => !r.valid).length;
  const duplicateRows = rows.filter((r) => r.valid && r.isDuplicate);
  const newRows       = rows.filter((r) => r.valid && !r.isDuplicate);

  const confirmMessage = duplicateRows.length > 0
    ? `${newRows.length} new project${newRows.length !== 1 ? "s" : ""} will be imported.\n\n${duplicateRows.length} duplicate${duplicateRows.length !== 1 ? "s" : ""} already exist in the database and will be skipped.\n\nDo you want to continue?`
    : `Are you sure you want to import ${newRows.length} project${newRows.length !== 1 ? "s" : ""} into the database?`;

  return (
    <>
      {/* Import Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Confirm Import"
        message={confirmMessage}
        confirmLabel="Yes, Import"
        confirmColor="green"
        onConfirm={() => { setShowConfirm(false); handleImport(); }}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-green-600" />
              <h2 className="text-base font-semibold text-gray-900">
                {step === "upload"
                  ? "Upload Projects Excel File"
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

          {/* ══ STEP 1: Upload ══ */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-12">

              {/* Column format guide */}
              <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="mb-4 text-sm font-bold text-gray-800">
                  Required Excel Column Order:
                </p>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {[
                    ["A", "Project Title",      true],
                    ["B", "Student 1",          true],
                    ["C", "Student 2",          false],
                    ["D", "Student 3",          false],
                    ["E", "Student 4",          false],
                    ["F", "Supervisor Name",    true],
                    ["G", "Co-Supervisor",      false],
                    ["H", "Industrial Partner", false],
                    ["I", "SDG",                true],
                  ].map(([col, label, required]) => (
                    <div
                      key={String(col)}
                      className={`rounded-xl px-3 py-2.5 text-center ${
                        required
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-100 border border-gray-200"
                      }`}
                    >
                      <p className="text-base font-bold text-gray-900">{String(col)}</p>
                      <p className={`text-xs mt-1 font-medium ${required ? "text-blue-700" : "text-gray-500"}`}>
                        {String(label)}
                      </p>
                      {required && (
                        <p className="text-red-500 text-xs mt-0.5 font-semibold">required</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-amber-800">
                      If a supervisor is not in the Faculty list, the project will still be imported but won't be linked to any faculty account. Add faculty first for proper linking.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                    <CheckCircle size={14} className="text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-blue-800">
                      Duplicate projects (same title) will be automatically detected and skipped during import.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload area */}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-green-300 bg-green-50 px-12 py-10 text-green-600 hover:bg-green-100 transition-colors"
              >
                <Upload size={32} />
                <div className="text-left">
                  <p className="text-lg font-bold">Click to select Excel file</p>
                  <p className="text-sm text-green-500 mt-1">.xlsx files only</p>
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

          {/* ══ STEP 2: Preview ══ */}
          {step === "preview" && (
            <>
              {/* Stats bar */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-xs font-bold text-green-700">
                    {newRows.length} new
                  </span>
                </div>
                {duplicateRows.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">
                      {duplicateRows.length} already exist
                    </span>
                  </div>
                )}
                {invalidCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1">
                    <AlertCircle size={14} className="text-red-600" />
                    <span className="text-xs font-bold text-red-700">
                      {invalidCount} errors
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-400 ml-auto">File: {fileName}</p>
              </div>

              {/* Duplicate warning */}
              {duplicateRows.length > 0 && (
                <div className="mx-6 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shrink-0">
                  <p className="text-sm font-bold text-amber-900 mb-2">
                    ⚠️ {duplicateRows.length} project{duplicateRows.length > 1 ? "s" : ""} already exist and will be skipped:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {duplicateRows.map((row) => (
                      <span
                        key={row.rowNumber}
                        className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
                      >
                        {row.title}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-amber-700">
                    To re-upload a duplicate, delete it from the Projects page first, then upload again.
                  </p>
                </div>
              )}

              {/* Preview table */}
              <div className="overflow-auto flex-1 px-6 py-4">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold">Row</th>
                      <th className="px-3 py-2.5 text-left font-bold">Project Title</th>
                      <th className="px-3 py-2.5 text-left font-bold">Students</th>
                      <th className="px-3 py-2.5 text-left font-bold">Supervisor</th>
                      <th className="px-3 py-2.5 text-left font-bold">Co-Supervisor</th>
                      <th className="px-3 py-2.5 text-left font-bold">Partner</th>
                      <th className="px-3 py-2.5 text-left font-bold">SDG</th>
                      <th className="px-3 py-2.5 text-left font-bold">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={
                          !row.valid
                            ? "bg-red-50"
                            : row.isDuplicate
                            ? "bg-amber-50"
                            : "bg-white hover:bg-gray-50"
                        }
                      >
                        <td className="px-3 py-2.5 text-gray-400 font-semibold">
                          {row.rowNumber}
                        </td>

                        <td className="px-3 py-2.5 max-w-40">
                          <p className="font-bold text-gray-900 truncate">{row.title || "—"}</p>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            {row.students.length > 0
                              ? row.students.map((s, i) => (
                                  <span key={i} className="text-gray-700 font-medium">{s}</span>
                                ))
                              : <span className="text-red-500 font-semibold">required</span>}
                          </div>
                          <span className="text-gray-400">({row.students.length}/4)</span>
                        </td>

                        <td className="px-3 py-2.5">
                          <p className="font-bold text-gray-900">{row.supervisorName || "—"}</p>
                          {row.supervisorName && (
                            row.supervisorId
                              ? <span className="text-green-600 text-xs font-semibold">✓ linked</span>
                              : <span className="text-gray-400 text-xs font-medium">no link</span>
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-gray-600 font-medium">
                          {row.coSupervisor !== "None" ? row.coSupervisor : "—"}
                        </td>

                        <td className="px-3 py-2.5 text-gray-600 font-medium">
                          {row.industrialPartner !== "None" ? row.industrialPartner : "—"}
                        </td>

                        <td className="px-3 py-2.5">
                          {row.sdg ? (
                            <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 font-bold text-green-700">
                              {row.sdg}
                            </span>
                          ) : (
                            <span className="text-red-500 font-semibold">required</span>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          {!row.valid ? (
                            <div className="text-red-600">
                              {row.errors.map((err, i) => (
                                <div key={i} className="text-xs font-medium">• {err}</div>
                              ))}
                            </div>
                          ) : row.isDuplicate ? (
                            <span className="text-amber-600 font-bold">Already exists</span>
                          ) : (
                            <span className="text-green-600 font-bold">✓ New</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  className="rounded-xl border-2 border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Upload Different File
                </button>

                <div className="flex items-center gap-3">
                  {/* Summary */}
                  <div className="text-sm text-gray-500">
                    {newRows.length > 0 ? (
                      <span>
                        <span className="font-bold text-gray-900">{newRows.length}</span> new •{" "}
                        <span className="font-bold text-amber-600">{duplicateRows.length}</span> skipped
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">All projects already exist</span>
                    )}
                  </div>

                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={importing || newRows.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {importing ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={15} />
                        Import {newRows.length} New Project{newRows.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
