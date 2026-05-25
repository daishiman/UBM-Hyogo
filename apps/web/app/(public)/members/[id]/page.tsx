// serial-06-form-response-binding: /(public)/members/[id]
// - serial-05 で配線した page skeleton に adapter + MemberDetail composing primitive を接続
// - 既存 fetchPublicOrNotFound 経由 (不変条件 #5: web から D1 直接禁止)
// - visibility filter は adapter の二重防御 (正本は API 側 getPublicMemberProfileUseCase)
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { MemberDetail } from "../../../../src/components/public/MemberDetail";
import {
  toMemberDetailProps,
  type PublicMemberProfile,
} from "../../../../src/lib/adapters/member-detail";
import { fetchPublicOrNotFound } from "../../../../src/lib/fetch/public";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const dynamic = "force-dynamic";

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

async function fetchProfile(id: string): Promise<PublicMemberProfile | null> {
  try {
    const raw = await fetchPublicOrNotFound<unknown>(
      `/public/members/${encodeURIComponent(id)}`,
      { revalidate: 0 },
    );
    // fail-close: zod parse 失敗時は error.tsx boundary で補足
    return PublicMemberProfileZ.parse(raw);
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
      occ ? `(${occ})` : ""
    }の UBM 兵庫支部会プロフィール`,
    path: `/members/${id}`,
    twitterCard: "summary",
    ogImage: `/members/${encodeURIComponent(id)}/opengraph-image`,
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
  const props = toMemberDetailProps(profile);
  return (
    <main data-route="public" data-section-rhythm="comfortable">
      <a href="/members" data-role="back" className="back-link">
        ← メンバー一覧に戻る
      </a>
      <MemberDetail {...props} />
    </main>
  );
}
