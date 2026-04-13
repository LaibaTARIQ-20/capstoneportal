import * as XLSX from "xlsx";

export interface ExcelRow {
  rowNumber: number;
  title: string;
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

export interface FacultyMap {
  [name: string]: string;
}

export function parseExcelBuffer(
  buffer: ArrayBuffer,
  facultyMap: FacultyMap,
  existingTitles: Set<string>
): ExcelRow[] {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  const dataRows = raw.slice(1).filter((row) => row && row.length > 0);

  return dataRows.map((row, index) => {
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
    const title = String(row[0] || "").trim();
    const students = [
      String(row[1] || "").trim(),
      String(row[2] || "").trim(),
      String(row[3] || "").trim(),
      String(row[4] || "").trim(),
    ].filter((s) => s.length > 0);

    const supervisorName = String(row[5] || "").trim();
    const coSupervisor = String(row[6] || "").trim();
    const industrialPartner = String(row[7] || "").trim();
    const sdg = String(row[8] || "").trim();

    const errors: string[] = [];
    if (!title) errors.push("Project title is required");
    if (!supervisorName) errors.push("Supervisor name is required");
    if (students.length < 1) errors.push("At least 1 student is required");
    if (!sdg) errors.push("SDG is required");

    const isDuplicate = title ? existingTitles.has(title.toLowerCase()) : false;
    const supervisorId = supervisorName ? facultyMap[supervisorName.toLowerCase()] || "" : "";

    return {
      rowNumber: index + 2,
      title,
      students,
      supervisorName,
      supervisorId,
      coSupervisor: coSupervisor || "None",
      industrialPartner: industrialPartner || "None",
      sdg,
      errors,
      valid: errors.length === 0,
      isDuplicate,
    };
  });
}
