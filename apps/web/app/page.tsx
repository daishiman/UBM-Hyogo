// `/` ランディングページ (Server Component)
// 06a: AC-1, AC-2 — 4 ルートの起点。stats と featured members を並列 fetch。
// 不変条件 #5: 全データ取得は public API 経由。

import type { z } from "zod";

import {
  PublicMemberListViewZ,
  PublicStatsViewZ,
} from "@ubm-hyogo/shared";

import { Hero } from "../src/components/public/Hero";
import { MemberCard } from "../src/components/public/MemberCard";
import { StatCard } from "../src/components/public/StatCard";
import { Timeline } from "../src/components/public/Timeline";
import { fetchPublic } from "../src/lib/fetch/public";

type PublicStatsView = z.infer<typeof PublicStatsViewZ>;
type PublicMemberListView = z.infer<typeof PublicMemberListViewZ>;

export const revalidate = 60;

export default async function HomePage() {
  const [stats, members] = await Promise.all([
    fetchPublic<PublicStatsView>("/public/stats", { revalidate: 60 }),
    fetchPublic<PublicMemberListView>("/public/members?limit=6", {
      revalidate: 60,
    }),
  ]);

  return (
    <main data-page="home">
      <Hero
        title="UBM 兵庫支部会"
        subtitle="兵庫で活動するメンバーをつなぐコミュニティ"
        primaryCta={{ label: "メンバーを見る", href: "/members" }}
        secondaryCta={{ label: "登録する", href: "/register" }}
      />
      <StatCard stats={stats} />
      <section data-component="about">
        <h2>UBM 兵庫支部会について</h2>
        <p>
          メンバーは UBM のコアバリューに基づき、月次の支部会で学びと実践を共有しています。
        </p>
      </section>
      <section data-component="featured">
        <h2>新規メンバー</h2>
        <ul>
          {members.items.map((m) => (
            <li key={m.memberId}>
              <MemberCard member={m} density="comfy" />
            </li>
          ))}
        </ul>
      </section>
      <Timeline entries={stats.recentMeetings} />
      <section data-component="faq">
        <h2>よくある質問</h2>
        <dl>
          <dt>登録は無料ですか？</dt>
          <dd>はい。登録は Google フォームから無料で行えます。</dd>
          <dt>メンバー情報の編集はどうしますか？</dt>
          <dd>Google フォームへの再回答が正式な経路です。</dd>
        </dl>
      </section>
      <section data-component="cta">
        <a href="/register" data-variant="primary">
          UBM 兵庫支部会に登録する
        </a>
      </section>
    </main>
  );
}
