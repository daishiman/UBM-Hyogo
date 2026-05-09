// task-11: 公開トップ Stats セクション。4 枚の StatCard を持ち、`data-stat` anchor で AC-1 を満たす。
// データ source は `/public/stats` (PublicStatsViewZ)。

import type { z } from "zod";

import { PublicStatsViewZ } from "@ubm-hyogo/shared";

export type PublicStatsView = z.infer<typeof PublicStatsViewZ>;

export interface StatsProps {
  stats: PublicStatsView;
}

function lastSyncLabel(stats: PublicStatsView): string {
  const ts = stats.generatedAt;
  if (!ts) return "未同期";
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "未同期";
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "未同期";
  }
}

export function Stats({ stats }: StatsProps) {
  const zoneCount = stats.zoneBreakdown?.length ?? 0;
  return (
    <section data-component="stats" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        サポート指標
      </h2>
      <ul data-role="stat-grid">
        <li data-stat="total">
          <span data-role="label">メンバー総数</span>
          <span data-role="value">{stats.memberCount}</span>
        </li>
        <li data-stat="public">
          <span data-role="label">公開メンバー</span>
          <span data-role="value">{stats.publicMemberCount}</span>
        </li>
        <li data-stat="zones">
          <span data-role="label">アクティブ zone</span>
          <span data-role="value">{zoneCount}</span>
        </li>
        <li data-stat="sync">
          <span data-role="label">最終同期</span>
          <span data-role="value">{lastSyncLabel(stats)}</span>
        </li>
      </ul>
    </section>
  );
}
