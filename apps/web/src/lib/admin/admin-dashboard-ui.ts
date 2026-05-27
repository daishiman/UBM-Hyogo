// task-15 / admin-dashboard-recovery-and-byZone:
// `byZone` / `byStatus` は AdminDashboardViewZ の optional 拡張として shared schema に同梱済み。
// API 未提供時 (旧 response shape) は parseZoneSlices が undefined を返し、UI は placeholder 描画する。
import type { AdminDashboardView } from "@ubm-hyogo/shared";

export interface ZoneSlice {
  readonly key: "0to1" | "1to10" | "10to100";
  readonly label: string;
  readonly hint: string;
  readonly count: number;
  readonly total: number;
  readonly tone: "info" | "accent" | "ok";
}

export interface StatusSlice {
  readonly status: "public" | "member_only" | "hidden";
  readonly count: number;
}

export interface AdminDashboardUiView {
  readonly totals: AdminDashboardView["totals"];
  readonly recentActions: AdminDashboardView["recentActions"];
  readonly generatedAt: string;
  readonly byZone: ReadonlyArray<ZoneSlice> | undefined;
  readonly byStatus: ReadonlyArray<StatusSlice> | undefined;
}

export function toAdminDashboardUi(
  view: Omit<AdminDashboardView, "byStatus"> & { byZone?: unknown; byStatus?: unknown },
): AdminDashboardUiView {
  return {
    totals: view.totals,
    recentActions: view.recentActions,
    generatedAt: view.generatedAt,
    byZone: parseZoneSlices(view.byZone),
    byStatus: parseStatusSlices(view.byStatus),
  };
}

const ZONE_KEYS = new Set(["0to1", "1to10", "10to100"]);
const ZONE_TONES = new Set(["info", "accent", "ok"]);

export function parseZoneSlices(v: unknown): ReadonlyArray<ZoneSlice> | undefined {
  if (!Array.isArray(v) || v.length !== 3) return undefined;
  const out: ZoneSlice[] = [];
  for (const item of v) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as { key?: unknown }).key !== "string" ||
      !ZONE_KEYS.has((item as { key: string }).key) ||
      typeof (item as { label?: unknown }).label !== "string" ||
      typeof (item as { hint?: unknown }).hint !== "string" ||
      typeof (item as { count?: unknown }).count !== "number" ||
      typeof (item as { total?: unknown }).total !== "number" ||
      typeof (item as { tone?: unknown }).tone !== "string" ||
      !ZONE_TONES.has((item as { tone: string }).tone)
    ) {
      return undefined;
    }
    const i = item as {
      key: ZoneSlice["key"];
      label: string;
      hint: string;
      count: number;
      total: number;
      tone: ZoneSlice["tone"];
    };
    out.push({
      key: i.key,
      label: i.label,
      hint: i.hint,
      count: i.count,
      total: i.total,
      tone: i.tone,
    });
  }
  return out;
}

function parseStatusSlices(v: unknown): ReadonlyArray<StatusSlice> | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: StatusSlice[] = [];
  const allowed = new Set(["public", "member_only", "hidden"]);
  for (const item of v) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { status?: unknown }).status === "string" &&
      allowed.has((item as { status: string }).status) &&
      typeof (item as { count?: unknown }).count === "number"
    ) {
      out.push({
        status: (item as { status: StatusSlice["status"] }).status,
        count: (item as { count: number }).count,
      });
    }
  }
  return out.length === 0 ? undefined : out;
}
