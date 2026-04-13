"use client";

import { useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import {
  Upload, X, FileSpreadsheet,
  AlertCircle, CheckCircle, AlertTriangle,
} from "lucide-react";

import { Button, ConfirmDialog, Badge, DataTable, ColumnDef } from "@/components/ui";
import { bulkImportProjects } from "@/services/projects/projects.service";
import { parseExcelBuffer, ExcelRow, FacultyMap } from "@/utils/excelParser";

interface ExcelUploadProps {
  onImportComplete: () => void;
  onClose: () => void;
}

export default function ExcelUpload({ onImportComplete, onClose }: ExcelUploadProps) {
  const [rows, setRows] = useState<ExcelRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [fileName, setFileName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Load dependencies before parsing ─────────────────────
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

  const loadExistingTitles = async (): Promise<Set<string>> => {
    const snap = await getDocs(collection(db, "projects"));
    const titles = new Set<string>();
    snap.docs.forEach((d) => {
      const title = d.data().title?.trim().toLowerCase();
      if (title) titles.add(title);
    });
    return titles;
  };

  // ─── Parse ────────────────────────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const [facultyMap, existingTitles] = await Promise.all([
        loadFacultyMap(),
        loadExistingTitles(),
      ]);

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          const parsed = parseExcelBuffer(buffer, facultyMap, existingTitles);
          setRows(parsed);
          setStep("preview");
        } catch {
          toast.error("Failed to parse Excel file. Please check the format.");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch {
      toast.error("Failed to load database constraints.");
    }
  };

  // ─── Import ───────────────────────────────────────────────
  const handleImport = async () => {
    const toImport = rows.filter((r) => r.valid && !r.isDuplicate);
    if (toImport.length === 0) {
      toast.error("No new projects to import");
      return;
    }

    setImporting(true);
    try {
      await bulkImportProjects(
        toImport.map(row => ({
          title: row.title,
          supervisor: row.supervisorName,
          supervisorId: row.supervisorId,
          coSupervisor: row.coSupervisor,
          students: row.students,
          studentCount: row.students.length,
          industrialPartner: row.industrialPartner,
          sdg: row.sdg,
        }))
      );
      toast.success(`${toImport.length} projects imported successfully`);
      onImportComplete();
      onClose();
    } catch (error) {
      toast.error("Failed to import projects.");
    } finally {
      setImporting(false);
    }
  };

  // ─── Metrics ──────────────────────────────────────────────
  const invalidCount  = rows.filter((r) => !r.valid).length;
  const duplicateRows = rows.filter((r) => r.valid && r.isDuplicate);
  const newRows       = rows.filter((r) => r.valid && !r.isDuplicate);

  // ─── DataTable Columns ────────────────────────────────────
  const columns: ColumnDef<ExcelRow>[] = [
    {
      key: "rowNum",
      header: "Row",
      cell: (row) => <span className="text-gray-400 font-semibold">{row.rowNumber}</span>,
    },
    {
      key: "title",
      header: "Project Title",
      cell: (row) => <p className="font-bold text-gray-900 truncate max-w-[200px]" title={row.title}>{row.title || "—"}</p>,
    },
    {
      key: "students",
      header: "Students",
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          {row.students.length > 0 ? (
            row.students.map((s, i) => <span key={i} className="text-gray-700 font-medium">{s}</span>)
          ) : (
            <span className="text-red-500 font-semibold">required</span>
          )}
          <span className="text-gray-400">({row.students.length}/4)</span>
        </div>
      ),
    },
    {
      key: "supervisor",
      header: "Supervisor",
      cell: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.supervisorName || "—"}</p>
          {row.supervisorName && (
            row.supervisorId
              ? <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider">✓ Linked</span>
              : <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">⚠ No Link</span>
          )}
        </div>
      )
    },
    {
      key: "partner",
      header: "Partner",
      cell: (row) => <span className="text-gray-600 font-medium">{row.industrialPartner !== "None" ? row.industrialPartner : "—"}</span>,
    },
    {
      key: "sdg",
      header: "SDG",
      cell: (row) => row.sdg ? <Badge color="green">{row.sdg}</Badge> : <span className="text-red-500 font-semibold">required</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        if (!row.valid) {
          return (
            <div className="text-red-600 space-y-0.5">
              {row.errors.map((err, i) => <div key={i} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-red-50">{err}</div>)}
            </div>
          );
        }
        if (row.isDuplicate) return <Badge color="yellow">Already exists</Badge>;
        return <Badge color="green">✓ Ready</Badge>;
      }
    }
  ];

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirm}
        title="Confirm Import"
        message={duplicateRows.length > 0
          ? `${newRows.length} new projects will be imported.\n\n${duplicateRows.length} duplicates already exist and will be skipped.\n\nContinue?`
          : `Import ${newRows.length} projects?`
        }
        confirmLabel="Yes, Import"
        confirmColor="green"
        onConfirm={() => { setShowConfirm(false); handleImport(); }}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
          
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-green-600" />
              <h2 className="text-base font-semibold text-gray-900">
                {step === "upload" ? "Upload Projects Excel File" : `Preview — ${rows.length} rows`}
              </h2>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {step === "upload" && (
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-12">
              <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="mb-4 text-sm font-bold text-gray-800">Required Excel Columns:</p>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {[
                    ["A", "Project Title", true], ["B", "Student 1", true], ["C", "Student 2", false],
                    ["D", "Student 3", false], ["E", "Student 4", false], ["F", "Supervisor", true],
                    ["G", "Co-Supervisor", false], ["H", "Ind. Partner", false], ["I", "SDG", true],
                  ].map(([col, label, req]) => (
                    <div key={String(col)} className={`rounded-xl px-3 py-2.5 text-center ${req ? "bg-blue-50 border-blue-200" : "bg-gray-100 border-gray-200"} border`}>
                      <p className="text-base font-bold text-gray-900">{String(col)}</p>
                      <p className={`text-xs mt-1 font-medium ${req ? "text-blue-700" : "text-gray-500"}`}>{String(label)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-green-300 bg-green-50 px-12 py-10 text-green-600 hover:bg-green-100 transition-colors w-full justify-center">
                <Upload size={32} />
                <div className="text-left">
                  <p className="text-lg font-bold">Select Excel file</p>
                  <p className="text-sm text-green-500 mt-1">.xlsx only</p>
                </div>
              </button>
              <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFile} className="hidden" />
            </div>
          )}

          {step === "preview" && (
            <>
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-3 shrink-0 flex-wrap">
                <Badge color="green" dot>{newRows.length} new</Badge>
                {duplicateRows.length > 0 && <Badge color="yellow" dot>{duplicateRows.length} exist</Badge>}
                {invalidCount > 0 && <Badge color="red" dot>{invalidCount} errors</Badge>}
                <p className="text-xs text-gray-400 ml-auto">File: {fileName}</p>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col p-6 pt-2 bg-gray-50/50">
                <DataTable
                  data={rows}
                  columns={columns}
                  searchFields={["title", "supervisorName"]}
                  rowClassName={(row) => !row.valid ? "bg-red-50/50" : row.isDuplicate ? "bg-amber-50/50" : ""}
                />
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 shrink-0">
                <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); if(fileRef.current) fileRef.current.value=""; }}>
                  Start Over
                </Button>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">
                    {newRows.length > 0 
                      ? <span><span className="font-bold text-gray-900">{newRows.length}</span> ready to import</span>
                      : <span className="text-amber-600 font-semibold">Nothing to import</span>}
                  </div>
                  <Button 
                    variant="success" 
                    icon={<FileSpreadsheet />} 
                    loading={importing} 
                    loadingLabel="Importing..."
                    disabled={newRows.length === 0} 
                    onClick={() => setShowConfirm(true)}
                  >
                    Import {newRows.length} Projects
                  </Button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
