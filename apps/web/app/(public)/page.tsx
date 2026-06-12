// public-dashboard-prototype-alignment: 公開トップ /
// プロトタイプ pages-public.jsx LandingPage L4-152 整合。
// 不変条件 #5 (D1 直接アクセス禁止): 全データは /public API 経由。
// 6 セクション: Hero / Stats / AboutUbm / FeaturedMembers / Timeline / CallToActionCTA。

import type { Metadata } from "next";
import { connection } from "next/server";

import { buildPageMetadata } from "@/lib/seo/site-metadata";

import { EmptyState } from "../../src/components/feedback/EmptyState";
import { AboutUbm } from "../../src/components/public/AboutUbm";
import { CallToActionCTA } from "../../src/components/public/CallToActionCTA";
import { Hero } from "../../src/components/public/Hero";
import { MemberGrid } from "../../src/components/public/MemberGrid";
import { SectionError } from "../../src/components/public/SectionError";
import { Stats } from "../../src/components/public/Stats";
import { Timeline } from "../../src/components/public/Timeline";
import {
  PUBLIC_API_REVALIDATE,
  getStats,
  listMembersRaw,
  type PublicStatsView,
} from "../../src/lib/api/public";
import { FORM_RESPONDER_URL } from "../../src/lib/constants/form";
import { safeServerFetch } from "../../src/lib/server-fetch/safe-fetch";

export const revalidate = 60;

const EMPTY_STATS: PublicStatsView = {
  memberCount: 0,
  publicMemberCount: 0,
  zoneBreakdown: [],
  membershipBreakdown: [],
  meetingCountThisYear: 0,
  recentMeetings: [],
  lastSync: {
    schemaSync: "never",
    responseSync: "never",
    schemaSyncFinishedAt: null,
    responseSyncFinishedAt: null,
  },
  generatedAt: "2026-01-01T00:00:00.000Z",
};

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "ホーム",
    description: "UBM 兵庫支部会の活動紹介、メンバーディレクトリ、参加案内",
    path: "/",
  });
}

export default async function HomePage() {
  await connection();
  const [statsResult, membersResult] = await Promise.all([
    safeServerFetch(
      () => getStats({ revalidate: PUBLIC_API_REVALIDATE.stats }),
      { codePrefix: "PUBLIC_FETCH" },
    ),
    safeServerFetch(
      () =>
        listMembersRaw("limit=6&sort=recent&expand=tags", {
          revalidate: PUBLIC_API_REVALIDATE.members,
        }),
      { codePrefix: "PUBLIC_FETCH" },
    ),
  ]);
  const stats = statsResult.ok ? statsResult.data : EMPTY_STATS;

  return (
    <main data-page="home" data-route="public" data-section-rhythm="comfortable">
        <Hero
          variant="card"
          title="兵庫で、事業を育てる人のつながりを可視化する。"
          subtitle="UBM兵庫支部会メンバーサイトは、Googleフォームから集めた支部会メンバーの自己紹介情報を、公開情報と会員限定情報に分けて整理・公開するサイトです。"
          primaryCta={{ label: "メンバー一覧を見る", href: "/members" }}
          secondaryCta={{ label: "会員ログイン", href: "/login" }}
        />
        {statsResult.ok ? (
          <Stats stats={stats} />
        ) : (
          <SectionError
            title="活動指標を読み込めませんでした"
            detail={statsResult.error.message}
            retryHref="/"
          />
        )}
        <AboutUbm />
        <section data-component="featured-members">
          <header data-role="header">
            <div>
              <h2 data-role="section-heading">参加している事業者たち</h2>
            </div>
            <a href="/members" data-role="cta-link">
              全員見る →
            </a>
          </header>
          {!membersResult.ok ? (
            <SectionError
              title="メンバー情報を読み込めませんでした"
              detail={membersResult.error.message}
              retryHref="/"
            />
          ) : membersResult.data.items.length > 0 ? (
            <MemberGrid items={membersResult.data.items} density="comfy" />
          ) : (
            <EmptyState
              title="まだ公開メンバーがいません"
              description="Google Form 回答後、自動で反映されます。"
            />
          )}
        </section>
        <Timeline entries={stats.recentMeetings} />
        <CallToActionCTA responderUrl={FORM_RESPONDER_URL} />
    </main>
  );
}
