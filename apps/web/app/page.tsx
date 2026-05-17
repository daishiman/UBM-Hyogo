// task-11: 公開トップ。Hero / Stats / ZoneIntro / Timeline + 任意の MemberGrid (recent 6)。
// 不変条件 #5 (D1 直接アクセス禁止): 全データは /public API 経由。
// revalidate: stats=60s, members=30s。

import { connection } from "next/server";

import { Hero } from "../src/components/public/Hero";
import { MemberGrid } from "../src/components/public/MemberGrid";
import { PublicFooter } from "../src/components/public/PublicFooter";
import { PublicHeader } from "../src/components/public/PublicHeader";
import { Stats } from "../src/components/public/Stats";
import { Timeline } from "../src/components/public/Timeline";
import { ZoneIntro } from "../src/components/public/ZoneIntro";
import {
  PUBLIC_API_REVALIDATE,
  getStats,
  listMembersRaw,
} from "../src/lib/api/public";

// stats=60s revalidate (AC-9)
export const revalidate = 60;

export default async function HomePage() {
  await connection();
  const [stats, members] = await Promise.all([
    getStats({ revalidate: PUBLIC_API_REVALIDATE.stats }),
    listMembersRaw("limit=6&sort=recent", {
      revalidate: PUBLIC_API_REVALIDATE.members,
    }),
  ]);

  return (
    <>
      <PublicHeader />
      <main data-page="home">
        <Hero
          eyebrow="UBM 兵庫支部会"
          title="兵庫から、ゆるやかに事業を伸ばす"
          subtitle="0→1 / 1→10 / 10→100 を一緒に進める仲間が、ここにいます。"
          primaryCta={{ label: "メンバーを見る", href: "/members" }}
          secondaryCta={{ label: "登録する", href: "/register" }}
        />
        <Stats stats={stats} />
        <ZoneIntro />
        <Timeline entries={stats.recentMeetings} />
        {members.items.length > 0 ? (
          <section data-component="featured-members">
            <h2>新しく参加したメンバー</h2>
            <MemberGrid items={members.items} density="comfy" />
            <p>
              <a href="/members">メンバー一覧を見る →</a>
            </p>
          </section>
        ) : null}
      </main>
      <PublicFooter />
    </>
  );
}
