// ut-07c-followup-001: CSV → AttendanceImportRow[] のクライアント側 parse。
// papaparse の薄い wrapper として、email を NFKC + trim + lowercase に正規化する。
// 仕様上、API 側でも同じ正規化を行うため両者で一貫した突合になる。
import Papa from "papaparse";

export interface ParsedAttendanceRow {
  memberId?: string | undefined;
  email?: string | undefined;
}

export interface ParseAttendanceError {
  row: number;
  message: string;
}

export interface ParseAttendanceResult {
  rows: ParsedAttendanceRow[];
  errors: ParseAttendanceError[];
}

const normalizeEmail = (s: string): string => s.normalize("NFKC").trim().toLowerCase();

const pickColumn = (
  obj: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): string | undefined => {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return undefined;
};

export function parseAttendanceCsv(text: string): ParseAttendanceResult {
  if (text.trim().length === 0) {
    return { rows: [], errors: [] };
  }
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  const rows: ParsedAttendanceRow[] = [];
  const errors: ParseAttendanceError[] = [];

  for (const err of parsed.errors ?? []) {
    errors.push({
      row: typeof err.row === "number" ? err.row : -1,
      message: err.message ?? "parse_error",
    });
  }

  const records = parsed.data ?? [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i] ?? {};
    const memberId = pickColumn(record, ["memberId", "member_id", "MemberId"]);
    const emailRaw = pickColumn(record, ["email", "Email", "メール"]);
    const email = emailRaw ? normalizeEmail(emailRaw) : undefined;
    if (!memberId && !email) {
      errors.push({ row: i, message: "memberId_or_email_required" });
      rows.push({});
      continue;
    }
    rows.push({ memberId, email });
  }

  return { rows, errors };
}
