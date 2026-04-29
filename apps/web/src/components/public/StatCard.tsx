import type { z } from "zod";

import { PublicStatsViewZ } from "@ubm-hyogo/shared";

export type PublicStatsView = z.infer<typeof PublicStatsViewZ>;

export interface StatCardProps {
  stats: PublicStatsView;
}

export function StatCard({ stats }: StatCardProps) {
  return (
    <section data-component="stat-card">
      <ul data-role="primary">
        <li>
          <span data-key="member-count">{stats.memberCount}</span>
          <span data-key="member-count-label">メンバー数</span>
        </li>
        <li>
          <span data-key="public-count">{stats.publicMemberCount}</span>
          <span data-key="public-count-label">公開メンバー数</span>
        </li>
        <li>
          <span data-key="meeting-count">{stats.meetingCountThisYear}</span>
          <span data-key="meeting-count-label">今年の支部会</span>
        </li>
      </ul>
      <dl data-role="zone">
        {stats.zoneBreakdown.map((z) => (
          <div key={z.zone}>
            <dt>{z.zone}</dt>
            <dd>{z.count}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
