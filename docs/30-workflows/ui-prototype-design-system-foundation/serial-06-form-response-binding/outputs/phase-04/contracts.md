# Phase 4 — 契約（実装版）

## adapter contract

```ts
export interface MemberDetailProps {
  memberId: string;
  summary: PublicMemberProfile["summary"]; // SummaryZ
  sections: ReadonlyArray<NormalizedSection>;
  attendance: PublicMemberProfile["attendance"]; // Array<AttendanceRecord>
  tags: PublicMemberProfile["tags"];
}

export interface NormalizedSection {
  key: string;
  title: string;
  fields: ReadonlyArray<NormalizedField>;
}

export interface NormalizedField {
  stableKey: string;
  label: string;
  value: AnswerValue; // z.union(string | string[] | number | boolean | {year,month,day} | null)
  kind: FieldKind;   // FieldKindZ enum
  // NOTE: visibility / source は出力に含まれない（sanitized）
}

export function toMemberDetailProps(profile: PublicMemberProfile): MemberDetailProps;
```

## 不変条件

- pure: 入力 mutate しない / 副作用なし / throw しない
- silent skip: unknown kind / visibility !== "public" は出力から消える（log なし）
- 空 section 除外: filter 後 fields.length === 0 の section は出力に含まれない

## DOM contract（MemberDetail 出力）

- `<article data-page="public-member-detail" data-member-id="...">`
- 内部に既存 primitive 由来の `[data-component="profile-hero"]` / `[data-section]` / `[data-stable-key]` が出る

## page.tsx contract

- 404 (`FetchPublicNotFoundError`) → `notFound()`
- zod parse fail → throw → `(public)/error.tsx`（親階層継承で `apps/web/app/error.tsx`）
- env fail (`getEnv()` not used directly; `fetchPublicOrNotFound` 内部) → throw → error.tsx
- 5xx → throw → error.tsx
