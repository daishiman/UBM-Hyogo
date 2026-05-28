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
        .filter((s): s is AttendanceZone => SELECTABLE_ZONES.includes(s as AttendanceZone))
    : [];
  return { periodPreset: preset, periodFrom, periodTo, zones };
};
