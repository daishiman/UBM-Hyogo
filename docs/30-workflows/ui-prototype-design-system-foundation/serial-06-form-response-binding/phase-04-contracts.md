---
phase: 4
title: 契約定義 — API response / adapter / primitive props 形状
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 4 — 契約定義

[実装区分: 実装仕様書]

## 1. API response 契約（既存・変更禁止）

### 1.1 endpoint

```
GET /public/members/:memberId
Cache-Control: no-store
```

実装: `apps/api/src/routes/public/member-profile.ts` → `getPublicMemberProfileUseCase`
schema: `packages/shared/src/zod/viewmodel.ts` L150 `PublicMemberProfileZ`

### 1.2 actual response shape

```ts
// PublicMemberProfileZ (.strict())
{
  memberId: string,                              // min(1)
  summary: {
    fullName: string,
    nickname: string,
    location: string,
    occupation: string,
    ubmZone: string | null,
    ubmMembershipType: string | null
  },
  publicSections: Array<{
    key: string,
    title: string,
    fields: Array<{
      stableKey: string,                         // 1〜64 文字, /^[a-z][a-z0-9_]*$/
      label: string,
      value: AnswerValue,                        // string | number | boolean | string[] | null
      kind: FieldKind,                           // text | longtext | url | email | tel | number | choice | multichoice | consent | system
      visibility: "public" | "member" | "admin",
      source: FieldSource                        // google_form | admin_managed | system
    }>
  }>,
  attendance: Array<{
    sessionId: string,
    title: string,
    heldOn: string                               // ISO8601 date
  }>,
  attendanceMeta?: { hasMore: boolean, nextCursor: string | null },
  tags: Array<{ code: string, label: string, category: string }>
}
```

### 1.3 HTTP status 契約

| status | 意味 | UI 対応 |
|--------|-----|--------|
| 200 | 公開対象 member の profile | adapter → primitive 描画 |
| 404 | member が存在しない / 非公開 / `publishState !== "published"` | `notFound()` 呼び出し |
| 500 系 | API 内部エラー | throw → `error.tsx` boundary で補足 |

## 2. adapter 契約

### 2.1 関数シグネチャ

```ts
// apps/web/src/lib/adapters/member-detail.ts

import type { z } from "zod";
import type { PublicMemberProfileZ } from "@ubm-hyogo/shared";

export type PublicMemberProfile = z.output<typeof PublicMemberProfileZ>;

export interface NormalizedField {
  stableKey: string;
  label: string;
  value: PublicMemberProfile["publicSections"][number]["fields"][number]["value"];
  kind: PublicMemberProfile["publicSections"][number]["fields"][number]["kind"];
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

export function toMemberDetailProps(
  profile: PublicMemberProfile,
): MemberDetailProps;
```

### 2.2 adapter 不変条件

- 純関数（I/O / global state / Date.now 等の非決定要素を含まない）
- input は変更しない（immutable）
- `field.visibility === "public"` のみ通す
- unknown `kind`（FieldKindZ で `safeParse` 失敗）は silent skip
- 全 fields 除外された section は出力配列から除外
- input が `PublicMemberProfileZ.parse` 通過済みであることを前提とする（adapter 自身は再 parse しない）

## 3. primitive props 契約

### 3.1 MemberDetail

```ts
// apps/web/src/components/public/MemberDetail.tsx

import type { MemberDetailProps } from "@/lib/adapters/member-detail";

export function MemberDetail(props: MemberDetailProps): JSX.Element;
```

内部で以下を呼ぶ:

```tsx
<article data-page="public-member-detail">
  <ProfileHero summary={props.summary} />
  <MemberTags tags={props.tags} />
  <MemberDetailSections sections={props.sections} />
  <MemberActivity attendance={props.attendance} />
</article>
```

### 3.2 MemberDetailSections（既存・変更禁止）

```ts
interface MemberDetailSectionsProps {
  sections: ReadonlyArray<{
    key: string;
    title: string;
    fields: ReadonlyArray<{
      stableKey: string;
      label: string;
      value: AnswerValue;
      kind: FieldKind;
    }>;
  }>;
}
```

adapter 出力の `NormalizedSection[]` がそのまま代入可能であること。

## 4. fixture 契約

### 4.1 fixture file

```ts
// apps/web/src/fixtures/public-member-profile.ts

import type { PublicMemberProfile } from "@/lib/adapters/member-detail";

export const samplePublicMemberProfile: PublicMemberProfile;
```

`samplePublicMemberProfile` は以下を満たす:

- `memberId === "member-fixture-001"`
- `publicSections.length === 6`（6 セクション網羅）
- 少なくとも 1 section に `visibility === "member"` field を含む（filter テスト用）
- 少なくとも 1 field に unknown kind は **含まない**（PublicMemberProfileZ 適格な状態を保つ。unknown kind は別途 spec で in-memory 構築）
- `attendance.length >= 1`
- `tags.length >= 1`

## 5. 参照

- `packages/shared/src/zod/viewmodel.ts`
- `packages/shared/src/zod/primitives.ts`（`FieldVisibilityZ` / `FieldKindZ`）
- `apps/api/src/use-cases/public/get-public-member-profile.ts`
