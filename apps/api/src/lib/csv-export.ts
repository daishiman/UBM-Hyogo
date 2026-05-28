// CSV export helper for Workers runtime (Web Streams only).
const CRLF = "\r\n";
const BOM = "﻿";

const escapeCell = (raw: unknown): string => {
  const s = raw === null || raw === undefined ? "" : String(raw);
  if (/[,"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export interface CsvRow {
  readonly [k: string]: unknown;
}

export function buildCsv(header: readonly string[], rows: readonly CsvRow[]): string {
  const head = header.map(escapeCell).join(",");
  const body = rows
    .map((row) => header.map((h) => escapeCell(row[h])).join(","))
    .join(CRLF);
  return `${BOM}${head}${CRLF}${body}${body ? CRLF : ""}`;
}

export function csvFilename(prefix: string, periodFrom: string | null, periodTo: string | null): string {
  const f = periodFrom ?? "all";
  const t = periodTo ?? "all";
  return `${prefix}-${f}_${t}.csv`;
}
