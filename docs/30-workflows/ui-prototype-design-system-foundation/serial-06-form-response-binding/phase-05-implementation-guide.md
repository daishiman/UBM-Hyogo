---
phase: 5
title: 実装ガイド — 各ファイルの最終形
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
depends_on:
  - serial-05-page-routes-blueprint-binding
---

# Phase 5 — 実装ガイド

[実装区分: 実装仕様書]

## 0. serial-05 完了確認（precondition）

実装着手前に以下を確認する:

```bash
# serial-05 の page skeleton が存在することを確認
test -f apps/web/app/\(public\)/members/\[id\]/page.tsx \
  && echo "OK: skeleton exists" \
  || { echo "BLOCK: serial-05 incomplete"; exit 1; }

# (public)/error.tsx / loading.tsx も確認
test -f apps/web/app/\(public\)/error.tsx \
  && test -f apps/web/app/\(public\)/loading.tsx \
  && echo "OK: boundaries exist" \
  || { echo "BLOCK: error/loading boundary missing"; exit 1; }
```

precondition fail 時は serial-05 PR の merge を待ってから着手する。

## 1. ファイル一覧（絶対パス）

| 種別 | パス |
|------|------|
| 新規 | `/apps/web/src/lib/adapters/member-detail.ts` |
| 新規 | `/apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` |
| 新規 | `/apps/web/src/fixtures/public-member-profile.ts` |
| 新規 or 編集 | `/apps/web/src/components/public/MemberDetail.tsx` |
| 編集 | `/apps/web/app/(public)/members/[id]/page.tsx` |
| 新規 | `/apps/web/playwright/tests/serial-06-member-detail.spec.ts` |

## 2. adapter 実装

`/apps/web/src/lib/adapters/member-detail.ts`:

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
  // visibility filter (二重防御; 正本は API 側 getPublicMemberProfileUseCase)
  if (field.visibility !== "public") return null;
  // unknown kind は silent skip（production console を汚さない）
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

実装上の注意:

- `map().filter(typeguard)` を採用し、null を含む中間配列を typeguard で除去
- 入力 `profile` を mutate しない（Array.prototype.map は新規配列を返す）
- `try/catch` を使わない（Next.js の `notFound()` は throw 機構で動くため）
- logger 呼び出しを入れない（production console 汚染防止）

## 3. page.tsx 実装

`/apps/web/app/(public)/members/[id]/page.tsx`:

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
  const res = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/public/members/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) notFound();
  if (!res.ok) {
    throw new Error(`Failed to fetch member profile: ${res.status}`);
  }
  const json = await res.json();
  const profile = PublicMemberProfileZ.parse(json);
  const props = toMemberDetailProps(profile);
  return <MemberDetail {...props} />;
}
```

実装上の注意:

- `notFound()` を try/catch で囲まない（内部の throw を握り潰すため）
- `PublicMemberProfileZ.parse` 失敗時は zod の `ZodError` が throw され `error.tsx` boundary で補足される
- `getEnv()` の throw も `error.tsx` で補足される（task-02 設計）
- `process.env.*` を直接参照しない（task-02 不変条件）

## 4. MemberDetail primitive 実装

`/apps/web/src/components/public/MemberDetail.tsx`:

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
    <article
      data-page="public-member-detail"
      data-member-id={memberId}
    >
      <ProfileHero
        memberId={memberId}
        fullName={summary.fullName}
        nickname={summary.nickname}
        occupation={summary.occupation}
        location={summary.location}
        ubmZone={summary.ubmZone}
        ubmMembershipType={summary.ubmMembershipType}
      />
      {tags.length > 0 ? <MemberTags tags={tags} /> : null}
      <MemberDetailSections sections={toLegacySections(sections)} />
      <MemberActivity sections={toLegacyActivitySections(attendance)} />
    </article>
  );
}
```

実装上の注意:

- 既存 4 primitive を組み立てるのみ。新規 primitive を生やさない
- 既存 primitive の props 契約を変えない
- adapter が sanitize した `sections` は `visibility: "public"` / `source: "forms"` を復元して `MemberDetailSections` に渡す
- `attendance` は `key="activity"` の section に橋渡しし、既存 `MemberActivity` の `sections` props を維持する
- `data-page` / `data-member-id` を Playwright assertion 用に明示
- 内部 state / hook を持たない（pure composition）

## 5. fixture 実装

`/apps/web/src/fixtures/public-member-profile.ts`:

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
        { stableKey: "nickname", label: "ニックネーム", value: "ひょうご",
          kind: "text", visibility: "public", source: "google_form" },
      ],
    },
    {
      key: "contact",
      title: "コンタクト",
      fields: [
        // visibility=member → adapter で filter される（filter テスト用）
        { stableKey: "response_email", label: "メールアドレス",
          value: "taro@example.com", kind: "email",
          visibility: "member", source: "system" },
      ],
    },
    {
      key: "profile",
      title: "プロフィール",
      fields: [
        { stableKey: "location", label: "活動エリア", value: "神戸市",
          kind: "text", visibility: "public", source: "google_form" },
        { stableKey: "occupation", label: "職業", value: "エンジニア",
          kind: "text", visibility: "public", source: "google_form" },
        { stableKey: "bio", label: "自己紹介",
          value: "兵庫支部会で機械学習を学んでいます。",
          kind: "longtext", visibility: "public", source: "google_form" },
      ],
    },
    {
      key: "ubm",
      title: "UBM 関連",
      fields: [
        { stableKey: "ubm_zone", label: "ゾーン", value: "兵庫",
          kind: "choice", visibility: "public", source: "google_form" },
        { stableKey: "ubm_membership_type", label: "会員区分", value: "正会員",
          kind: "choice", visibility: "public", source: "google_form" },
      ],
    },
    {
      key: "interests",
      title: "興味関心",
      fields: [
        { stableKey: "interests", label: "興味分野",
          value: ["機械学習", "Web 開発"], kind: "multichoice",
          visibility: "public", source: "google_form" },
      ],
    },
    {
      key: "consent",
      title: "同意",
      fields: [
        // visibility=admin → adapter で filter される（filter テスト用）
        { stableKey: "public_consent", label: "公開同意", value: true,
          kind: "consent", visibility: "admin", source: "google_form" },
        { stableKey: "rules_consent", label: "規約同意", value: true,
          kind: "consent", visibility: "admin", source: "google_form" },
      ],
    },
  ],
  attendance: [
    { sessionId: "sess-001", title: "第1回 兵庫支部会", heldOn: "2026-01-15" },
  ],
  tags: [
    { code: "engineer", label: "エンジニア", category: "occupation" },
  ],
};
```

実装上の注意:

- 全 field は CLAUDE.md「フォーム固定値」「不変条件」「consent キー統一」と整合
- `response_email` は system field（不変条件 #3）として `source: "system"` で表現
- `public_consent` / `rules_consent` は不変条件 #2 に従う命名
- spec 側で `PublicMemberProfileZ.parse(samplePublicMemberProfile)` self-validation する

## 6. stableKey ↔ section mapping 表（実装時参照）

`01-api-schema.md` で定義される 6 セクションと代表 stableKey の対応:

| section key | section title | 代表 stableKey 例 | 既定 visibility |
|-------------|--------------|-------------------|-----------|
| `basic` | 基本情報 | `full_name`, `nickname` | public |
| `contact` | コンタクト | `response_email` | member |
| `profile` | プロフィール | `location`, `occupation`, `bio` | public |
| `ubm` | UBM 関連 | `ubm_zone`, `ubm_membership_type` | public |
| `interests` | 興味関心 | `interests` | public |
| `consent` | 同意 | `public_consent`, `rules_consent` | admin |

> 代表 stableKey は `docs/00-getting-started-manual/specs/01-api-schema.md` を正本とする。本表は実装時の参照便宜のため。

## 7. visibility filter 実装の二重防御

- 正本: API 側 `getPublicMemberProfileUseCase` が `visibility !== "public"` を除外して返す（既存実装）
- UI 二重防御: adapter `normalizeField` で `field.visibility !== "public"` を再 filter
- Playwright assertion（Phase 6 §3.2）: `data-stable-key="response_email"` / `data-stable-key="public_consent"` 等の admin/member field が DOM に存在しないこと

## 8. 実装順序（推奨）

Phase 3 タスク順序に従う:

1. T-03 fixture 作成（先に書いておくと T-01 / T-02 の型検証が楽）
2. T-01 adapter 実装
3. T-02 adapter unit spec（6 ケース）→ green になるまで T-01 を補正
4. T-04 MemberDetail primitive
5. T-05 page.tsx 編集
6. T-06 / T-07 Playwright spec
7. T-08 evidence 収集

## 9. 副作用とエラーハンドリング

| 場所 | 副作用 | エラー扱い |
|------|-------|----------|
| adapter | なし（pure） | throw しない・logger 呼ばない |
| page.tsx fetch | HTTP request | 404 → `notFound()`, 5xx → throw |
| page.tsx parse | zod parse | ZodError throw → `error.tsx` |
| page.tsx env | `getEnv()` | env parse fail → throw → `error.tsx` |
| primitive | DOM render のみ | client error は throw 経由で boundary 補足 |

## 10. 参照

- Phase 2 アーキテクチャ
- Phase 4 契約
- Phase 6 テスト方針
- `apps/web/src/lib/env.ts`（task-02）
- `packages/shared/src/zod/viewmodel.ts`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
