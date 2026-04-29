// `/members/[id]` 公開メンバー詳細 (Server Component)
// AC-1, AC-10 — public visibility のみ表示。404 は notFound()
// 不変条件 #1: stableKey 経由でのみ field を参照（直書き禁止）
// 不変条件 #5: public API 経由のみ

import { notFound } from "next/navigation";
import type { z } from "zod";

import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { Chip } from "../../../../src/components/ui/Chip";
import { KVList } from "../../../../src/components/ui/KVList";
import { LinkPills, type LinkPill } from "../../../../src/components/ui/LinkPills";
import { ProfileHero } from "../../../../src/components/public/ProfileHero";
import {
  fetchPublicOrNotFound,
  FetchPublicNotFoundError,
} from "../../../../src/lib/fetch/public";

type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;

export const revalidate = 60;

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({
  params,
}: MemberDetailPageProps) {
  const { id } = await params;

  let profile: PublicMemberProfile;
  try {
    profile = await fetchPublicOrNotFound<PublicMemberProfile>(
      `/public/members/${encodeURIComponent(id)}`,
      { revalidate: 60 },
    );
  } catch (e) {
    if (e instanceof FetchPublicNotFoundError) notFound();
    throw e;
  }

  // KVList 化: stableKey 経由のみ参照する。section.fields の visibility は API 側で
  // public のものに絞り込まれている前提（不変条件 #1, #5）。
  const kvItems = profile.publicSections.flatMap((section) =>
    section.fields.map((f) => ({
      key: f.stableKey,
      value: (
        <span data-stable-key={f.stableKey} data-section={section.key}>
          <strong>{f.label}</strong>:{" "}
          {Array.isArray(f.value) ? f.value.join(", ") : String(f.value ?? "—")}
        </span>
      ),
    })),
  );

  // socialLinks 等のリンク要素は publicSections 内の link kind を抽出
  const links: LinkPill[] = profile.publicSections
    .flatMap((s) => s.fields)
    .filter((f) => f.kind === "url" && typeof f.value === "string" && f.value)
    .map((f) => ({
      label: f.label,
      href: String(f.value),
      ariaLabel: `${f.label}（外部リンク）`,
    }));

  return (
    <main data-page="member-detail">
      <ProfileHero
        memberId={profile.memberId}
        fullName={profile.summary.fullName}
        nickname={profile.summary.nickname}
        occupation={profile.summary.occupation}
        location={profile.summary.location}
        ubmZone={profile.summary.ubmZone}
        ubmMembershipType={profile.summary.ubmMembershipType}
      />
      {profile.tags.length > 0 ? (
        <section data-component="profile-tags">
          <ul>
            {profile.tags.map((t) => (
              <li key={t.code}>
                <Chip tone="cool">{t.label}</Chip>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <KVList items={kvItems} />
      {links.length > 0 ? <LinkPills links={links} /> : null}
      <a href="/members" data-role="back">
        メンバー一覧に戻る
      </a>
    </main>
  );
}
