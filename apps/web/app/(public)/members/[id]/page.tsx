// `/members/[id]` 公開メンバー詳細 (Server Component)
// task-12 で primitives 接続を再構成。
// 不変条件 #1: stableKey 経由でのみ field を参照（直書き禁止、全 KV row に data-stable-key）
// 不変条件 #5: web から D1 直接禁止 → public API 経由のみ

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { z } from "zod";

import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { buildPageMetadata } from "@/lib/seo/site-metadata";

import { MemberActivity } from "../../../../src/components/public/MemberActivity";
import { MemberDetailSections } from "../../../../src/components/public/MemberDetailSections";
import { MemberLinks } from "../../../../src/components/public/MemberLinks";
import { MemberTags } from "../../../../src/components/public/MemberTags";
import { ProfileHero } from "../../../../src/components/public/ProfileHero";
import { fetchPublicOrNotFound } from "../../../../src/lib/fetch/public";

type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;

export const dynamic = "force-dynamic";

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

async function fetchProfile(
  id: string,
): Promise<PublicMemberProfile | null> {
  try {
    return await fetchPublicOrNotFound<PublicMemberProfile>(
      `/public/members/${encodeURIComponent(id)}`,
      { revalidate: 0 },
    );
  } catch (e) {
    if (e instanceof Error && e.name === "FetchPublicNotFoundError") {
      return null;
    }
    throw e;
  }
}

export async function generateMetadata({
  params,
}: MemberDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchProfile(id);
  if (!profile) {
    return buildPageMetadata({
      title: "メンバーが見つかりません",
      description:
        "指定された UBM 兵庫支部会メンバーは公開されていません",
      path: `/members/${id}`,
      twitterCard: "summary",
    });
  }
  const occ = profile.summary.occupation;
  return buildPageMetadata({
    title: profile.summary.fullName,
    description: `${profile.summary.fullName}${
      occ ? `（${occ}）` : ""
    }の UBM 兵庫支部会プロフィール`,
    path: `/members/${id}`,
    twitterCard: "summary",
  });
}

export default async function MemberDetailPage({
  params,
}: MemberDetailPageProps) {
  const { id } = await params;
  const profile = await fetchProfile(id);
  if (!profile) {
    notFound();
  }

  // activity セクションは MemberActivity 側で取り出すため汎用 sections では除外する
  const detailSections = profile.publicSections.filter(
    (s) => s.key !== "activity",
  );

  return (
    <main data-page="member-detail" className="stack-lg">
      <a href="/members" data-role="back" className="back-link">
        ← メンバー一覧に戻る
      </a>
      <ProfileHero
        memberId={profile.memberId}
        fullName={profile.summary.fullName}
        nickname={profile.summary.nickname}
        occupation={profile.summary.occupation}
        location={profile.summary.location}
        ubmZone={profile.summary.ubmZone}
        ubmMembershipType={profile.summary.ubmMembershipType}
      />
      <MemberTags tags={profile.tags} />
      <MemberDetailSections sections={detailSections} />
      <MemberLinks sections={profile.publicSections} />
      <MemberActivity sections={profile.publicSections} />
    </main>
  );
}
