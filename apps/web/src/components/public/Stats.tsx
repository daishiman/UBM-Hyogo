// public-dashboard-prototype-alignment: localized home stats labels
// プロトタイプ pages-public.jsx LandingPage の 4 stat + sub line + badge-sync 整合。
// data source: /public/stats (PublicStatsViewZ)。新 endpoint 追加なし。

import type { z } from "zod";

import { PublicStatsViewZ } from "@ubm-hyogo/shared";

export type PublicStatsView = z.infer<typeof PublicStatsViewZ>;

export interface StatsProps {
  stats: PublicStatsView;
}

/** プロトタイプ固定値: 兵庫支部会の Zone 数。 */
const ZONE_COUNT = 3;
/** プロトタイプ固定値: 年間ミーティング数 (毎月開催)。 */
const MEETINGS_PER_YEAR = 12;

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
  return (
    <section data-component="stats" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        サポート指標
      </h2>
      <ul data-role="stat-grid">
        <li data-stat="members">
          <span data-role="label">公開メンバー</span>
          <span data-role="value">{stats.publicMemberCount}</span>
          <span data-role="sub">公開中のメンバー</span>
        </li>
        <li data-stat="zones">
          <span data-role="label">事業フェーズ</span>
          <span data-role="value">{ZONE_COUNT}</span>
          <span data-role="sub">0→1 / 1→10 / 10→100</span>
        </li>
        <li data-stat="meetings">
          <span data-role="label">年間の支部会</span>
          <span data-role="value">{MEETINGS_PER_YEAR}</span>
          <span data-role="sub">毎月の支部会</span>
        </li>
        <li data-stat="sync">
          <span data-role="label">最終データ更新</span>
          <span data-role="value">{lastSyncLabel(stats)}</span>
          <span data-role="sub">
            <span data-role="badge-sync">
              <span data-role="dot" aria-hidden="true" />
              自動で最新化
            </span>
          </span>
        </li>
      </ul>
    </section>
  );
}
