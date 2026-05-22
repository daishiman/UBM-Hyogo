// task-15: AdminDashboardView の web local UI mapper。
// `byZone` / `byStatus` は @ubm-hyogo/shared schema 外（FB-W0-01: shared を変更しない）。
// API 未提供時は undefined を返し、UI 側で placeholder 描画する契約。
import type { AdminDashboardView } from "@ubm-hyogo/shared";

export interface ZoneSlice {
  readonly zone: string;
  readonly count: number;
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

// API response が現行 schema (totals/recentActions/generatedAt) のみを返すケースを正常系とし、
// 拡張フィールドが将来追加された場合に optional として吸収できるよう loose 判定する。
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

function parseZoneSlices(v: unknown): ReadonlyArray<ZoneSlice> | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: ZoneSlice[] = [];
  for (const item of v) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { zone?: unknown }).zone === "string" &&
      typeof (item as { count?: unknown }).count === "number"
    ) {
      out.push({ zone: (item as { zone: string }).zone, count: (item as { count: number }).count });
    }
  }
  return out.length === 0 ? undefined : out;
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
