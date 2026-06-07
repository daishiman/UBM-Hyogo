import type { AttendanceZone } from "@ubm-hyogo/shared";
import {
  PERIOD_PRESETS,
  type PeriodPresetId,
  presetToPeriod,
  SELECTABLE_ZONES,
} from "./format-attendance";

export interface AttendanceFilterState {
  readonly periodPreset: PeriodPresetId;
  readonly periodFrom: string | null;
  readonly periodTo: string | null;
  readonly zones: readonly AttendanceZone[];
}

const VALID_PRESETS = new Set<string>(PERIOD_PRESETS.map((p) => p.id));
const LEGACY_ATTENDANCE_ZONE_MAP: Record<string, AttendanceZone> = {
  "0→1": "zone_0",
  "1→10": "zone_1_9",
  "10→100": "zone_10_99",
};

const readZone = (raw: string): AttendanceZone | null => {
  if (SELECTABLE_ZONES.includes(raw as AttendanceZone)) return raw as AttendanceZone;
  return LEGACY_ATTENDANCE_ZONE_MAP[raw] ?? null;
};

export const readFilterFromQuery = (
  q: URLSearchParams | Record<string, string | undefined>,
): AttendanceFilterState => {
  const get = (k: string): string | undefined =>
    q instanceof URLSearchParams ? q.get(k) ?? undefined : q[k];
  const presetRaw = get("preset");
  const preset = (presetRaw && VALID_PRESETS.has(presetRaw) ? presetRaw : "all") as PeriodPresetId;
  const { periodFrom, periodTo } = presetToPeriod(preset);
  const zoneRaw = get("zone");
  const zones: AttendanceZone[] = zoneRaw
    ? zoneRaw
        .split(",")
        .map((s) => s.trim())
        .map(readZone)
        .filter((s): s is AttendanceZone => s !== null)
    : [];
  return { periodPreset: preset, periodFrom, periodTo, zones };
};
