---
phase: 2
title: アーキテクチャ設計 — Server Component fetch + adapter + primitive 構造
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 2 — アーキテクチャ設計

[実装区分: 実装仕様書]

## 1. 全体方針

データ流（CLAUDE.md 「データ流」セクションを正本とする）:

```
Google Form (formId 119ec...)
  → apps/api: sync-forms-responses.ts → D1.responses + response_fields（既に実装済）
  → apps/api: GET /public/members/:memberId
       → JSON: PublicMemberProfileZ {
            memberId, summary, publicSections[], attendance[], tags[]
          }
  → apps/web: app/(public)/members/[id]/page.tsx (Server Component, RSC)
       → fetch(`${API_BASE}/public/members/${id}`, { cache: "no-store" })
       → adapter (member-detail.ts) で props 整形
  → apps/web: <MemberDetail fields={...} summary={...} sections={...} />
       → 内部で <MemberDetailSections> を組み立て
  → ブラウザ表示（visibility === "public" のみ）
```

## 2. 層責務

| 層 | ファイル | 責務 | 入力 | 出力 |
|----|---------|-----|------|------|
| Route | `app/(public)/members/[id]/page.tsx` | URL parse → fetch → notFound 分岐 | `params: Promise<{ id: string }>` | JSX |
| Adapter | `lib/adapters/member-detail.ts` | API response → primitive props 整形 + visibility filter + unknown kind 防御 | `z.output<typeof PublicMemberProfileZ>` | `MemberDetailProps` |
| Primitive | `components/public/MemberDetail.tsx` | Hero + SectionedFields 組み立て | `MemberDetailProps` | JSX |
| Sub-primitive | `components/public/MemberDetailSections.tsx`（既存） | 6 section の `<dl>` 描画 | `sections[]` | JSX |
| Fixture | `fixtures/public-member-profile.ts` | unit test / Playwright で使う代表 case | — | `PublicMemberProfile` |

## 3. 既存 API shape と UI 期待の差分吸収方針

### 3.1 API actual shape（`packages/shared/src/zod/viewmodel.ts` L150 `PublicMemberProfileZ`）

```ts
{
  memberId: string,
  summary: {
    fullName, nickname, location, occupation,
    ubmZone: string | null, ubmMembershipType: string | null
  },
  publicSections: Array<{
    key: string,
    title: string,
    fields: Array<{
      stableKey: string,
      label: string,
      value: AnswerValue,    // string | string[] | null | ...
      kind: FieldKind,        // text | url | email | ...
      visibility: "public" | "member" | "admin",
      source: FieldSource
    }>
  }>,
  attendance: Array<{ sessionId, title, heldOn }>,
  tags: Array<{ code, label, category }>
}
```

### 3.2 UI 期待 props（MemberDetail）

```ts
interface MemberDetailProps {
  memberId: string;
  summary: Summary;
  sections: Array<NormalizedSection>;  // visibility filter 済み + unknown kind 除外済み
  attendance: Array<AttendanceRecord>;
  tags: Array<Tag>;
}

interface NormalizedSection {
  key: string;
  title: string;
  fields: Array<NormalizedField>;
}

interface NormalizedField {
  stableKey: string;
  label: string;
  value: AnswerValue;
  kind: FieldKind;
  // visibility / source は UI 描画には不要なため adapter 出力で落とす
}
```

### 3.3 adapter による吸収

| 乖離 | adapter での吸収方法 |
|------|--------------------|
| `publicSections` 名 vs `sections` 名 | adapter で `sections` に rename して primitive に渡す |
| 全 visibility 含む可能性 | `f.visibility === "public"` のみ通す filter を Phase 5 で実装 |
| unknown `kind` 出現 | `FieldKindZ.safeParse(field.kind)` で fallback。失敗時は silent skip |
| `value` が `null` / `""` / `[]` | adapter は値を素通し。primitive 内で `"—"` 表示 |
| section 全 fields 除外時 | section ごと skip（empty `<section>` を出さない） |

## 4. RSC / fetch 戦略

- Server Component（`page.tsx`）から `fetch()` を直接呼ぶ。Route Handler 経由禁止
- `cache: "no-store"`（既存 API が `Cache-Control: no-store` を返すため UI 側も合わせる）
- API base URL は `getEnv().NEXT_PUBLIC_API_BASE_URL`（task-02 wrangler-env-injection 不変条件）
- 404 / 500 系応答時は `notFound()` を呼ぶ（500 系は `notFound` ではなく throw → `error.tsx` boundary で補足）

## 5. error / loading 境界

- `error.tsx` / `loading.tsx` は serial-05 で配置済みを前提とする（`(public)` segment level）
- 本 sub-workflow では新規 boundary を追加しない

## 6. 描画階層図

```
(public) AppShell (parallel-03)
└─ PublicHeader (既存)
└─ <main>
   └─ MemberDetail (新規 / 編集)
      ├─ ProfileHero (既存) — summary を渡す
      ├─ MemberTags (既存) — tags を渡す
      ├─ MemberDetailSections (既存) — sections を渡す
      └─ MemberActivity (既存) — attendance を渡す
└─ PublicFooter (既存)
```

## 7. 既存 primitive 再利用方針

| primitive | 用途 | 変更可否 |
|-----------|-----|---------|
| `ProfileHero.tsx` | summary 描画 | 変更不可（props 既定） |
| `MemberTags.tsx` | tags 描画 | 変更不可 |
| `MemberDetailSections.tsx` | 6 section の `<dl>` 描画 | 変更不可 |
| `MemberActivity.tsx` | attendance 描画 | 変更不可 |
| `MemberDetail.tsx`（新規 or 既存編集） | 上記 4 primitive を組み立てる composition layer | 新設または編集可 |

`MemberDetail.tsx` が既に存在しない場合は新設。存在する場合は内部実装のみ編集し props 契約は維持する。

## 8. 参照

- Phase 1 `phase-01-requirements.md`
- `packages/shared/src/zod/viewmodel.ts` L150-165
- `apps/api/src/routes/public/member-profile.ts`
- `apps/web/src/components/public/MemberDetailSections.tsx`
- `apps/web/src/lib/env.ts`（task-02）
