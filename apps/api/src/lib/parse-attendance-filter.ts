import type { AttendanceZone } from "@ubm-hyogo/shared";
import { AttendanceZoneZ } from "@ubm-hyogo/shared";
import type { AttendanceFilter } from "../repository/attendance-analytics";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const parseIsoDateOrNull = (raw: string | undefined | null): string | null => {
  if (!raw) return null;
  return ISO_DATE.test(raw) ? raw : null;
};

export const parseZones = (raw: string | undefined | null): AttendanceZone[] | null => {
  if (!raw) return null;
  const out = new Set<AttendanceZone>();
  for (const z of raw.split(",")) {
    const trimmed = z.trim();
    const parsed = AttendanceZoneZ.safeParse(trimmed);
    if (parsed.success) out.add(parsed.data);
  }
  return out.size > 0 ? [...out] : null;
};

export const parseAttendanceFilter = (
  q: Record<string, string | undefined> | ((k: string) => string | undefined),
): AttendanceFilter => {
  const get = typeof q === "function" ? q : (k: string) => q[k];
  return {
    periodFrom: parseIsoDateOrNull(get("periodFrom")),
    periodTo: parseIsoDateOrNull(get("periodTo")),
    zone: parseZones(get("zone")),
  };
};

export const clampIntQuery = (
  raw: string | undefined,
  def: number,
  min: number,
  max: number,
): number => {
  if (raw === undefined || raw === null || raw === "") return def;
  const n = Number(raw);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
};
