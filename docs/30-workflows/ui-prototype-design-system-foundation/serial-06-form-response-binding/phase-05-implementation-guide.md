---
phase: 5
title: 実装ガイド — 各ファイルの最終形
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
depends_on:
  - serial-05-page-routes-blueprint-binding
---

# Phase 5 — 実装ガイド

[実装区分: 実装仕様書]

## 0. serial-05 完了確認

実装着手前に以下を確認する:

```bash
# serial-05 の page skeleton が存在することを確認
test -f apps/web/app/\(public\)/members/\[id\]/page.tsx \
  && echo "OK: skeleton exists" || echo "BLOCK: serial-05 incomplete"
```

存在しない場合は serial-05 の Phase 5 完了を待つ。

## 1. ファイル一覧（絶対パス）

| 種別 | パス |
|------|------|
| 新規 | `/apps/web/src/lib/adapters/member-detail.ts` |
| 新規 | `/apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` |
| 新規 | `/apps/web/src/fixtures/public-member-profile.ts` |
| 新規 or 編集 | `/apps/web/src/components/public/MemberDetail.tsx` |
| 編集 | `/apps/web/app/(public)/members/[id]/page.tsx` |
| 新規 | `/apps/web/tests/e2e/public-member-detail.spec.ts` |

## 2. adapter 実装

`apps/web/src/lib/adapters/member-detail.ts`:

```ts
import type { z } from "zod";

import {
  type FieldKind,
  FieldKindZ,
  type PublicMemberProfileZ,
} from "@ubm-hyogo/shared";

export type PublicMemberProfile = z.output<typeof PublicMemberProfileZ>;
type RawSection = PublicMemberProfile["publicSections"][number];
type RawField = RawSection["fields"][number];

export interface NormalizedField {
  stableKey: string;
  label: string;
  value: RawField["value"];
  kind: FieldKind;
}

export interface NormalizedSection {
  key: string;
  title: string;
  fields: ReadonlyArray<NormalizedField>;
}

export interface MemberDetailProps {
  memberId: string;
  summary: PublicMemberProfile["summary"];
  sections: ReadonlyArray<NormalizedSection>;
  attendance: PublicMemberProfile["attendance"];
  tags: PublicMemberProfile["tags"];
}

function normalizeField(field: RawField): NormalizedField | null {
  // visibility filter (二重防御; 正本は API 側)
  if (field.visibility !== "public") return null;
  // unknown kind は silent skip
  const parsed = FieldKindZ.safeParse(field.kind);
  if (!parsed.success) return null;
  return {
    stableKey: field.stableKey,
    label: field.label,
    value: field.value,
    kind: parsed.data,
  };
}

function normalizeSection(section: RawSection): NormalizedSection | null {
  const fields = section.fields
    .map(normalizeField)
    .filter((f): f is NormalizedField => f !== null);
  if (fields.length === 0) return null;
  return { key: section.key, title: section.title, fields };
}

export function toMemberDetailProps(
  profile: PublicMemberProfile,
): MemberDetailProps {
  const sections = profile.publicSections
    .map(normalizeSection)
    .filter((s): s is NormalizedSection => s !== null);
  return {
    memberId: profile.memberId,
    summary: profile.summary,
    sections,
    attendance: profile.attendance,
    tags: profile.tags,
  };
}
```

## 3. page.tsx 実装

`apps/web/app/(public)/members/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";

import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { MemberDetail } from "@/components/public/MemberDetail";
import { getEnv } from "@/lib/env";
import { toMemberDetailProps } from "@/lib/adapters/member-detail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `会員プロフィール — ${id}` };
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const env = getEnv();
  const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/public/members/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to fetch member profile: ${res.status}`);
  const json = await res.json();
  const profile = PublicMemberProfileZ.parse(json);
  const props = toMemberDetailProps(profile);
  return <MemberDetail {...props} />;
}
```

## 4. MemberDetail primitive

`apps/web/src/components/public/MemberDetail.tsx`:

```tsx
import { MemberActivity } from "./MemberActivity";
import { MemberDetailSections } from "./MemberDetailSections";
import { MemberTags } from "./MemberTags";
import { ProfileHero } from "./ProfileHero";

import type { MemberDetailProps } from "@/lib/adapters/member-detail";

export function MemberDetail({
  memberId,
  summary,
  sections,
  attendance,
  tags,
}: MemberDetailProps) {
  return (
    <article data-page="public-member-detail" data-member-id={memberId}>
      <ProfileHero summary={summary} />
      {tags.length > 0 ? <MemberTags tags={tags} /> : null}
      <MemberDetailSections sections={sections} />
      {attendance.length > 0 ? <MemberActivity attendance={attendance} /> : null}
    </article>
  );
}
```

## 5. stableKey ↔ section mapping 表

01-api-schema.md で定義される 6 セクションと代表 stableKey の対応:

| section key | section title | 代表 stableKey 例 | visibility |
|-------------|--------------|-------------------|-----------|
| `basic` | 基本情報 | `full_name`, `nickname` | public |
| `contact` | コンタクト | `response_email` | member |
| `profile` | プロフィール | `location`, `occupation`, `bio` | public |
| `ubm` | UBM 関連 | `ubm_zone`, `ubm_membership_type` | public |
| `interests` | 興味関心 | `interests` | public |
| `consent` | 同意 | `public_consent`, `rules_consent` | admin |

> 代表 stableKey は 01-api-schema.md を正本とする。本表は実装時の参照便宜のため。

## 6. visibility filter 実装の二重防御

- 正本: API 側 `getPublicMemberProfileUseCase` が `visibility !== "public"` を除外して返す（既存）
- UI 二重防御: adapter `normalizeField` で `field.visibility !== "public"` を再 filter
- Playwright assertion: `data-stable-key="response_email"` 等の admin/member field が DOM に存在しないこと

## 7. fixture

`apps/web/src/fixtures/public-member-profile.ts`:

```ts
import type { PublicMemberProfile } from "@/lib/adapters/member-detail";

export const samplePublicMemberProfile: PublicMemberProfile = {
  memberId: "member-fixture-001",
  summary: {
    fullName: "兵庫 太郎",
    nickname: "ひょうご",
    location: "神戸市",
    occupation: "エンジニア",
    ubmZone: "兵庫",
    ubmMembershipType: "正会員",
  },
  publicSections: [
    {
      key: "basic",
      title: "基本情報",
      fields: [
        { stableKey: "full_name", label: "氏名", value: "兵庫 太郎",
          kind: "text", visibility: "public", source: "google_form" },
      ],
    },
    // ... 残り 5 section（contact は admin/member only を含める）
  ],
  attendance: [
    { sessionId: "sess-001", title: "第1回 兵庫支部会", heldOn: "2026-01-15" },
  ],
  tags: [
    { code: "engineer", label: "エンジニア", category: "occupation" },
  ],
};
```

詳細は実装時に 01-api-schema.md / google-form/02-result.md を参照して 6 section 全件埋める。

## 8. 参照

- Phase 2 アーキテクチャ
- Phase 4 契約
- `apps/web/src/lib/env.ts`
- `packages/shared/src/zod/viewmodel.ts`
