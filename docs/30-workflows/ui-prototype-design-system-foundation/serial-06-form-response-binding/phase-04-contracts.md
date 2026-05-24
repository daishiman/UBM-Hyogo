---
phase: 4
title: 契約定義 — API response / adapter / primitive props 形状
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 4 — 契約定義

[実装区分: 実装仕様書]

本 phase は API / adapter / primitive / fixture の 4 種類の契約を明文化する。実装は Phase 5 で行うが、契約は本 phase が正本。

## 1. API response 契約（既存・変更禁止）

### 1.1 endpoint

```
GET /public/members/:memberId
Cache-Control: no-store
```

実装:
- route: `apps/api/src/routes/public/member-profile.ts`
- use-case: `apps/api/src/use-cases/public/get-public-member-profile.ts`
- schema: `packages/shared/src/zod/viewmodel.ts` L150 `PublicMemberProfileZ`

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
      stableKey: string,                         // /^[a-z][a-z0-9_]*$/, length 1-64
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
    heldOn: string                               // ISO8601 date (YYYY-MM-DD)
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
| 5xx | API 内部エラー | throw → `(public)/error.tsx` boundary で補足 |

## 2. adapter 契約

### 2.1 関数シグネチャ

```ts
// /apps/web/src/lib/adapters/member-detail.ts

import type { z } from "zod";
import {
  type FieldKind,
  FieldKindZ,
  type PublicMemberProfileZ,
} from "@ubm-hyogo/shared";

export type PublicMemberProfile = z.output<typeof PublicMemberProfileZ>;

export interface NormalizedField {
  stableKey: string;
  label: string;
  value: PublicMemberProfile["publicSections"][number]["fields"][number]["value"];
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

export function toMemberDetailProps(
  profile: PublicMemberProfile,
): MemberDetailProps;
```

### 2.2 adapter 不変条件

- 純関数（I/O / global state / Date.now / Math.random 等の非決定要素を含まない）
- input は変更しない（immutable, 入力 reference を mutate しない）
- `field.visibility === "public"` のみ通す（二重防御）
- unknown `kind`（`FieldKindZ.safeParse` 失敗）は silent skip。logger 呼び出し無し
- 全 fields 除外された section は出力配列から除外
- input が `PublicMemberProfileZ.parse` 通過済みであることを前提とする（adapter 自身は再 parse しない）
- 出力 `NormalizedField` には `visibility` / `source` を含めない（防御的 sanitize）

### 2.3 エラーハンドリング

| ケース | 挙動 |
|-------|------|
| input が PublicMemberProfile に整合 | 正常出力 |
| field.visibility が `member` / `admin` | filter（出力に含めない） |
| field.kind が未知文字列 | silent skip（個別 field のみ除外） |
| section.fields が全 skip された | section ごと除外 |
| publicSections === [] | sections === [] を返す（throw しない） |

## 3. primitive props 契約

### 3.1 MemberDetail（composition layer, 新規 or 編集）

```ts
// /apps/web/src/components/public/MemberDetail.tsx

import type { MemberDetailProps } from "@/lib/adapters/member-detail";

export function MemberDetail(props: MemberDetailProps): JSX.Element;
```

内部実装（疑似）:

```tsx
<article data-page="public-member-detail" data-member-id={props.memberId}>
  <ProfileHero {...props.summary} memberId={props.memberId} />
  {props.tags.length > 0 ? <MemberTags tags={props.tags} /> : null}
  <MemberDetailSections sections={toLegacySections(props.sections)} />
  <MemberActivity sections={toLegacyActivitySections(props.attendance)} />
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

adapter 出力の `NormalizedSection[]` がそのまま代入可能であること（型レベルで担保）。

### 3.3 既存 sub-primitive props（参照のみ・変更禁止）

- `ProfileHero`: flat summary props + `memberId`
- `MemberTags`: `{ tags: PublicMemberProfile["tags"] }`
- `MemberActivity`: `{ sections: PublicMemberProfile["publicSections"] }`

## 4. fixture 契約

### 4.1 fixture file

```ts
// /apps/web/src/fixtures/public-member-profile.ts

import type { PublicMemberProfile } from "@/lib/adapters/member-detail";

export const samplePublicMemberProfile: PublicMemberProfile;
```

### 4.2 fixture 仕様

`samplePublicMemberProfile` は以下を必ず満たす:

- `memberId === "member-fixture-001"`
- `publicSections.length === 6`（01-api-schema.md sectionCount=6 に整合: basic / contact / profile / ubm / interests / consent）
- 少なくとも 1 section に `visibility === "member"` field を含む（filter テスト用）
- 少なくとも 1 section に `visibility === "admin"` field を含む（filter テスト用）
- 少なくとも 1 field は `visibility === "public"` で表示される（描画テスト用）
- 全 field は `PublicMemberProfileZ.parse(samplePublicMemberProfile)` が success（self-validation）
- unknown kind は fixture 自体には含めない（spec 内で `structuredClone` + 型 cast で混入させる）
- `attendance.length >= 1`
- `tags.length >= 1`

### 4.3 unit spec 内の self-validation

```ts
import { PublicMemberProfileZ } from "@ubm-hyogo/shared";
import { samplePublicMemberProfile } from "@/fixtures/public-member-profile";

it("fixture は PublicMemberProfileZ.parse を通過する", () => {
  expect(() => PublicMemberProfileZ.parse(samplePublicMemberProfile)).not.toThrow();
});
```

これにより API schema 変更時に fixture が壊れたら CI で即検知できる。

## 5. fetch 契約（page.tsx）

```ts
const res = await fetch(
  `${env.NEXT_PUBLIC_API_BASE_URL}/public/members/${encodeURIComponent(id)}`,
  { cache: "no-store" },
);
```

- HTTP method: GET
- cache: `no-store`
- credentials: 既定（cookie 送信しない）
- timeout: Next.js 既定（明示設定なし）

## 6. 参照

- `packages/shared/src/zod/viewmodel.ts`
- `packages/shared/src/zod/primitives.ts`（`FieldVisibilityZ` / `FieldKindZ`）
- `apps/api/src/use-cases/public/get-public-member-profile.ts`
- Phase 2 §3 差分吸収方針
- Phase 5 実装ガイド
