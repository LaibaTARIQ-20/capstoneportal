"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  collection, addDoc, getDocs,
  setDoc, doc, Timestamp
} from "firebase/firestore";
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
interface ExcelRow {
  rowNumber: number;
  title: string;
  supervisorName: string;
  supervisorId: string;
  coSupervisor: string;
  student1: string;
  student2: string;
  student3: string;
  student4: string;
  students: string[];
  studentCount: number;
  industrialPartner: string;
  sdg: string;
  status: string;
  errors: string[];
  valid: boolean;
  isNewSupervisor: boolean;
  supervisorEmail: string;
}

interface FacultyMap {
  [name: string]: string;
}

interface ExcelUploadProps {
  onImportComplete: () => void;
  onClose: () => void;
}

const DEFAULT_PASSWORD = "University@123";

// ─── Generate email from name ────────────────
function nameToEmail(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/^dr\.\s*/i, "")
      .replace(/^ms\.\s*/i, "")
      .replace(/^mr\.\s*/i, "")
      .replace(/^prof\.\s*/i, "")
      .trim()
      .replace(/\s+/g, ".")
      .replace(/[^a-z.]/g, "") + "@university.edu"
  );
}

export default function ExcelUpload({ onImportComplete, onClose }: ExcelUploadProps) {
  const [rows, setRows]           = useState<ExcelRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep]           = useState<"upload" | "preview">("upload");
  const [fileName, setFileName]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Load existing faculty from Firestore ────
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

  // ─── Parse Excel ─────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const facultyMap = await loadFacultyMap();

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data     = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const raw      = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

        const newSupervisors: { [name: string]: string } = {};
        const dataRows = raw.slice(1).filter((row) => row && row.length > 0);

        const parsed: ExcelRow[] = dataRows.map((row, index) => {
          // ── YOUR EXCEL COLUMN ORDER ──
          // A=Title, B=Supervisor, C=Co-Supervisor,
          // D=Student1, E=Student2, F=Student3, G=Student4,
          // H=Industrial Partner, I=SDG, J=Status
          const title             = String(row[0] || "").trim();
          const supervisorName    = String(row[1] || "").trim();
          const coSupervisor      = String(row[2] || "").trim();
          const student1          = String(row[3] || "").trim();
          const student2          = String(row[4] || "").trim();
          const student3          = String(row[5] || "").trim();
          const student4          = String(row[6] || "").trim();
          const industrialPartner = String(row[7] || "").trim();
          const sdg               = String(row[8] || "").trim();
          const status            = String(row[9] || "pending").trim().toLowerCase();

          // Collect only non-empty students
          const students = [student1, student2, student3, student4].filter(
            (s) => s.length > 0
          );

          // Validate
          const errors: string[] = [];
          if (!title)          errors.push("Title is required");
          if (!supervisorName) errors.push("Supervisor name is required");
          if (students.length < 2) errors.push("At least 2 students are required");
          if (!sdg)            errors.push("SDG is required");

          // Match or assign supervisor
          let supervisorId      = "";
          let isNewSupervisor   = false;
          let supervisorEmail   = "";

          if (supervisorName) {
            const key = supervisorName.toLowerCase();
            if (facultyMap[key]) {
              supervisorId    = facultyMap[key];
              isNewSupervisor = false;
            } else if (newSupervisors[key]) {
              supervisorId    = newSupervisors[key];
              isNewSupervisor = true;
            } else {
              // New supervisor — reserve a temp key
              // Real UID will come from Firebase Auth on import
              newSupervisors[key] = `pending_${key}`;
              supervisorId    = `pending_${key}`;
              isNewSupervisor = true;
            }
            supervisorEmail = nameToEmail(supervisorName);
          }

          const validStatuses = ["pending", "under_review", "accepted", "rejected"];
          const finalStatus   = validStatuses.includes(status) ? status : "pending";

          return {
            rowNumber: index + 2,
            title,
            supervisorName,
            supervisorId,
            supervisorEmail,
            coSupervisor: coSupervisor || "None",
            student1, student2, student3, student4,
            students,
            studentCount: students.length,
            industrialPartner: industrialPartner || "None",
            sdg,
            status: finalStatus,
            errors,
            valid: errors.length === 0,
            isNewSupervisor,
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

  // ─── Import all to Firebase Auth + Firestore ─
  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);

    try {
      // Save admin session
      const currentAdmin = auth.currentUser;

      // ── Step 1: Create Firebase Auth + Firestore for new supervisors ──
      const createdSupervisors = new Map<string, string>();
      // key = supervisorName.toLowerCase(), value = real Firebase UID

      const newSupervisorRows = validRows.filter(
        (r) => r.isNewSupervisor
      );

      // Get unique new supervisors
      const uniqueNewSupervisors = [
        ...new Map(
          newSupervisorRows.map((r) => [r.supervisorName.toLowerCase(), r])
        ).values(),
      ];

      for (const row of uniqueNewSupervisors) {
        try {
          // Create Firebase Auth account
          const credential = await createUserWithEmailAndPassword(
            auth,
            row.supervisorEmail,
            DEFAULT_PASSWORD
          );
          const newUid = credential.user.uid;

          // Create Firestore profile
          await setDoc(doc(db, "users", newUid), {
            name:            row.supervisorName,
            email:           row.supervisorEmail,
            role:            "faculty",
            gender:          "Male",
            department:      "Not Set",
            designation:     "Lecturer",
            phone:           "Not Set",
            joinedAt:        Timestamp.now(),
            profileComplete: false,
          });

          createdSupervisors.set(row.supervisorName.toLowerCase(), newUid);
        } catch (err: unknown) {
          if (
            err instanceof Error &&
            err.message.includes("email-already-in-use")
          ) {
            // Already exists — look up their UID from Firestore
            const snap = await getDocs(collection(db, "users"));
            snap.docs.forEach((d) => {
              const data = d.data();
              if (
                data.name?.toLowerCase() === row.supervisorName.toLowerCase()
              ) {
                createdSupervisors.set(row.supervisorName.toLowerCase(), d.id);
              }
            });
          }
        }
      }

      // Restore admin session
      if (currentAdmin) {
        await auth.updateCurrentUser(currentAdmin);
      }

      // ── Step 2: Insert projects with correct supervisorId ──
      let successCount = 0;
      let failCount    = 0;

      for (const row of validRows) {
        try {
          // Get real UID — either from createdSupervisors or original facultyMap match
          let realSupervisorId = row.supervisorId;
          if (row.isNewSupervisor) {
            realSupervisorId =
              createdSupervisors.get(row.supervisorName.toLowerCase()) ||
              row.supervisorId;
          }

          await addDoc(collection(db, "projects"), {
            title:           row.title,
            supervisor:      row.supervisorName,
            supervisorId:    realSupervisorId,
            coSupervisor:    row.coSupervisor,
            students:        row.students,
            studentCount:    row.studentCount,
            industrialPartner: row.industrialPartner,
            sdg:             row.sdg,
            status:          row.status,
            uploadedBy:      "excel_import",
            uploadedAt:      Timestamp.now(),
            updatedAt:       Timestamp.now(),
          });
          successCount++;
        } catch {
          failCount++;
        }
      }

      if (createdSupervisors.size > 0) {
        toast.success(
          `${createdSupervisors.size} new faculty account${createdSupervisors.size > 1 ? "s" : ""} created — password: ${DEFAULT_PASSWORD}`
        );
      }
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

    } catch {
      toast.error("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const validCount          = rows.filter((r) => r.valid).length;
  const invalidCount        = rows.filter((r) => !r.valid).length;
  const newSupervisorsCount = [
    ...new Set(
      rows
        .filter((r) => r.isNewSupervisor && r.valid)
        .map((r) => r.supervisorName)
    ),
  ].length;

  return (
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

        {/* ══════════════════════════════════════
            STEP 1 — Upload
        ══════════════════════════════════════ */}
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center gap-6 px-6 py-12">

            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-700">
                Required Excel Column Order:
              </p>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {[
                  ["A", "Project Title",      true],
                  ["B", "Supervisor Name",    true],
                  ["C", "Co-Supervisor",      false],
                  ["D", "Student 1",          true],
                  ["E", "Student 2",          true],
                  ["F", "Student 3",          false],
                  ["G", "Student 4",          false],
                  ["H", "Industrial Partner", false],
                  ["I", "SDG",                true],
                  ["J", "Status",             false],
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
                    <p className={required ? "text-blue-700 text-xs" : "text-gray-500 text-xs"}>
                      {String(label)}
                    </p>
                    {required && <p className="text-red-500 text-xs">required</p>}
                  </div>
                ))}
              </div>

              {/* New supervisor notice */}
              <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                <p className="text-xs font-medium text-blue-800">
                  New supervisors are automatically created as faculty accounts.
                </p>
                <p className="mt-0.5 text-xs text-blue-600">
                  Default login password:{" "}
                  <span className="font-bold tracking-widest">{DEFAULT_PASSWORD}</span>
                </p>
              </div>
            </div>

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
              {newSupervisorsCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1">
                  <CheckCircle size={14} className="text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    {newSupervisorsCount} new faculty will be created
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-400 ml-auto">File: {fileName}</p>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1 px-6 py-4">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Row</th>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Supervisor</th>
                    <th className="px-3 py-2 text-left">Students</th>
                    <th className="px-3 py-2 text-left">SDG</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.valid ? "bg-white hover:bg-gray-50" : "bg-red-50"
                      }
                    >
                      <td className="px-3 py-2 text-gray-400">{row.rowNumber}</td>

                      <td className="px-3 py-2 font-medium text-gray-900 max-w-[160px] truncate">
                        {row.title || "—"}
                      </td>

                      <td className="px-3 py-2 text-gray-600">
                        <div className="font-medium">{row.supervisorName || "—"}</div>
                        {row.supervisorName && (
                          row.isNewSupervisor ? (
                            <div className="text-blue-500 text-xs">★ new — {row.supervisorEmail}</div>
                          ) : (
                            <div className="text-green-600 text-xs">✓ existing</div>
                          )
                        )}
                      </td>

                      <td className="px-3 py-2 text-gray-600">
                        <div className="flex flex-col gap-0.5">
                          {row.students.map((s, i) => (
                            <span key={i} className="text-xs">{s}</span>
                          ))}
                          {row.students.length === 0 && (
                            <span className="text-red-500 text-xs">required</span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        {row.sdg ? (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700 text-xs">
                            {row.sdg}
                          </span>
                        ) : (
                          <span className="text-red-500 text-xs">required</span>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium text-xs ${
                            row.status === "accepted"
                              ? "bg-green-50 text-green-700"
                              : row.status === "rejected"
                              ? "bg-red-50 text-red-700"
                              : row.status === "under_review"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="px-3 py-2">
                        {row.valid ? (
                          <span className="text-green-600 font-medium">✓ Ready</span>
                        ) : (
                          <div className="text-red-600">
                            {row.errors.map((err, i) => (
                              <div key={i} className="text-xs">• {err}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* New faculty notice */}
            {newSupervisorsCount > 0 && (
              <div className="mx-6 mb-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 shrink-0">
                <p className="text-sm font-medium text-blue-800 mb-1">
                  {newSupervisorsCount} new faculty account
                  {newSupervisorsCount > 1 ? "s" : ""} will be created with login access:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...new Set(
                      rows
                        .filter((r) => r.isNewSupervisor && r.valid)
                        .map((r) => r.supervisorName)
                    ),
                  ].map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-blue-600">
                  Default password:{" "}
                  <span className="font-bold tracking-widest">{DEFAULT_PASSWORD}</span>
                </p>
              </div>
            )}

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
                    Importing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={15} />
                    Import {validCount} Project{validCount !== 1 ? "s" : ""}
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
