import type { AttendanceZone } from "@ubm-hyogo/shared";

export const formatRate = (rate: number): string => {
  if (!Number.isFinite(rate)) return "—";
  return `${(Math.min(1, Math.max(0, rate)) * 100).toFixed(1)}%`;
};

export const formatDelta = (current: number, previous: number | null): string => {
  if (previous === null || !Number.isFinite(previous)) return "—";
  const diff = current - previous;
  const sign = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
  return `${sign}${Math.abs(diff * 100).toFixed(1)}pt`;
};

export const ZONE_LABEL: Record<AttendanceZone, string> = {
  "0→1": "0 回（未出席）",
  "1→10": "1〜9 回",
  "10→100": "10〜99 回",
  unknown: "100 回以上",
};

export const ZONE_HELP =
  "出席回数帯は、各メンバーの累計出席回数を現行の集計境界で分類したものです。";

export const PERIOD_PRESETS = [
  { id: "all", label: "全期間", monthsBack: null as number | null },
  { id: "1m", label: "今月", monthsBack: 1 },
  { id: "3m", label: "3M", monthsBack: 3 },
  { id: "6m", label: "6M", monthsBack: 6 },
  { id: "1y", label: "1Y", monthsBack: 12 },
] as const;

export type PeriodPresetId = (typeof PERIOD_PRESETS)[number]["id"];

export const presetToPeriod = (preset: PeriodPresetId, now = new Date()): { periodFrom: string | null; periodTo: string | null } => {
  const target = PERIOD_PRESETS.find((p) => p.id === preset);
  if (!target || target.monthsBack === null) return { periodFrom: null, periodTo: null };
  const to = new Date(now);
  const from = new Date(now);
  from.setMonth(from.getMonth() - target.monthsBack);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { periodFrom: fmt(from), periodTo: fmt(to) };
};

export const SELECTABLE_ZONES: readonly AttendanceZone[] = ["0→1", "1→10", "10→100"];
