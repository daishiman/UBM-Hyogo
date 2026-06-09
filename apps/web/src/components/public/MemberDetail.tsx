// serial-06-form-response-binding: 公開会員詳細の composing primitive
// - 既存 4 primitive (ProfileHero / MemberTags / MemberDetailSections / MemberActivity) を組み立てる
// - adapter からの NormalizedSection を MemberDetailSections の strict Section 型に橋渡しする
//   ( visibility/source は API 正本に従い "public" / "forms" を literal で復元する )
// - 既存 primitive props を変更しない (NFR-04)
import type { z } from "zod";

import type { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import type { MemberDetailProps } from "@/lib/adapters/member-detail";

import { MemberActivity } from "./MemberActivity";
import { BusinessOverviewSection } from "./BusinessOverviewSection";
import { MemberDetailSections } from "./MemberDetailSections";
import { MemberLinks } from "./MemberLinks";
import { MessageCard } from "./MessageCard";
import { PersonalSection } from "./PersonalSection";
import { MemberTags } from "./MemberTags";
import { ProfileHero } from "./ProfileHero";

type LegacySection = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];

function toLegacySections(
  sections: MemberDetailProps["sections"],
): ReadonlyArray<LegacySection> {
  // adapter は visibility=public で filter 済みのため "public" / "forms" を literal で復元する
  return sections.map((s) => ({
    key: s.key,
    title: s.title,
    fields: s.fields.map((f) => ({
      stableKey: f.stableKey,
      label: f.label,
      value: f.value,
      kind: f.kind,
      visibility: "public" as const,
      source: "forms" as const,
    })),
  }));
}

function toLegacyActivitySections(
  attendance: MemberDetailProps["attendance"],
): ReadonlyArray<LegacySection> {
  if (attendance.length === 0) return [];
  return [
    {
      key: "activity",
      title: "参加履歴",
      fields: attendance.map((a) => ({
        stableKey: `attendance:${a.sessionId}`,
        label: a.heldOn,
        value: a.title,
        kind: "shortText" as const,
        visibility: "public" as const,
        source: "forms" as const,
      })),
    },
  ];
}

export function MemberDetail({
  memberId,
  summary,
  hero,
  business,
  personal,
  message,
  linkSections,
  other,
  attendance,
  tags,
  photoUrl,
}: MemberDetailProps) {
  return (
    <article
      data-page="public-member-detail"
      data-member-id={memberId}
      className="stack-lg"
    >
      <ProfileHero
        memberId={memberId}
        fullName={summary.fullName}
        nickname={summary.nickname}
        occupation={summary.occupation}
        location={summary.location}
        hometown={hero.hometown}
        ubmZone={summary.ubmZone}
        ubmMembershipType={summary.ubmMembershipType}
        photoUrl={photoUrl}
      />
      <div className="grid-2" data-region="member-detail-primary">
        <BusinessOverviewSection {...business} />
        <div className="stack-sm" data-region="member-detail-side">
          <MemberTags tags={tags} />
          <MemberLinks sections={toLegacySections(linkSections)} />
        </div>
      </div>
      <PersonalSection rows={personal} />
      <MessageCard message={message} />
      <MemberDetailSections sections={toLegacySections(other)} />
      <MemberActivity sections={toLegacyActivitySections(attendance)} />
    </article>
  );
}
