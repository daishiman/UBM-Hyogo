---
phase: 2
title: アーキテクチャ設計 — Server Component fetch + adapter + primitive 構造
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 2 — アーキテクチャ設計

[実装区分: 実装仕様書]

## 1. 全体方針

データ流は CLAUDE.md「データ流」セクションを正本とする。本 sub-workflow は **adapter 層** を新規追加することで、既存 API と既存 primitive を変更せずに UI 描画を完成させる。

```
Google Form (formId 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg)
  │
  ▼ (既実装)
apps/api: sync-forms-responses.ts (jobs)
  └─► D1.responses + response_fields
  │
  ▼ (既実装)
apps/api: GET /public/members/:memberId
  └─► JSON: PublicMemberProfileZ {
          memberId, summary, publicSections[], attendance[], tags[]
        }
  │
  ▼ (本 sub-workflow で追加)
apps/web: app/(public)/members/[id]/page.tsx  ← Server Component
  ├─ fetch(`${API_BASE}/public/members/${id}`, { cache: "no-store" })
  ├─ PublicMemberProfileZ.parse(json)         ← schema 検証
  └─ toMemberDetailProps(profile)              ← adapter (新規)
  │
  ▼
apps/web: <MemberDetail {...props} />          ← composition primitive
  ├─ <ProfileHero summary={...} />              (既存)
  ├─ <MemberTags tags={...} />                  (既存)
  ├─ <MemberDetailSections sections={...} />    (既存)
  └─ <MemberActivity sections={activitySection} /> (既存)
  │
  ▼
ブラウザ表示（visibility === "public" のみ）
```

## 2. 層責務

| 層 | ファイル（絶対パス） | 責務 | 入力 | 出力 |
|----|---------------------|------|------|------|
| Route | `/apps/web/app/(public)/members/[id]/page.tsx` | URL parse → fetch → schema parse → adapter → notFound 分岐 | `params: Promise<{ id: string }>` | JSX |
| Adapter | `/apps/web/src/lib/adapters/member-detail.ts` | API response → primitive props 整形 + visibility filter + unknown kind 防御 | `z.output<typeof PublicMemberProfileZ>` | `MemberDetailProps` |
| Primitive (composition) | `/apps/web/src/components/public/MemberDetail.tsx` | Hero + Tags + SectionedFields + Activity の組み立て | `MemberDetailProps` | JSX |
| Sub-primitive | `/apps/web/src/components/public/MemberDetailSections.tsx`（既存） | 6 section の `<dl>` 描画 | `sections[]` | JSX |
| Sub-primitive | `/apps/web/src/components/public/ProfileHero.tsx`（既存） | summary 描画 | `summary` | JSX |
| Sub-primitive | `/apps/web/src/components/public/MemberTags.tsx`（既存） | tags 描画 | `tags` | JSX |
| Sub-primitive | `/apps/web/src/components/public/MemberActivity.tsx`（既存） | activity section 描画 | `sections[]` | JSX |
| Fixture | `/apps/web/src/fixtures/public-member-profile.ts` | unit test / Playwright で使う代表 case | — | `PublicMemberProfile` |

## 3. 既存 API shape と UI 期待の差分吸収方針

### 3.1 API actual shape

`packages/shared/src/zod/viewmodel.ts` L150 `PublicMemberProfileZ`（`.strict()`）:

```ts
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
      stableKey: string,                         // /^[a-z][a-z0-9_]*$/
      label: string,
      value: AnswerValue,                        // string | number | boolean | string[] | null
      kind: FieldKind,                           // text | longtext | url | email | tel | number | choice | multichoice | consent | system
      visibility: "public" | "member" | "admin",
      source: FieldSource                        // google_form | admin_managed | system
    }>
  }>,
  attendance: Array<{ sessionId: string, title: string, heldOn: string }>,
  attendanceMeta?: { hasMore: boolean, nextCursor: string | null },
  tags: Array<{ code: string, label: string, category: string }>
}
```

### 3.2 UI 期待 props（MemberDetail）

```ts
interface MemberDetailProps {
  memberId: string;
  summary: PublicMemberProfile["summary"];
  sections: ReadonlyArray<NormalizedSection>;   // visibility filter 済み + unknown kind 除外済み
  attendance: PublicMemberProfile["attendance"];
  tags: PublicMemberProfile["tags"];
}

interface NormalizedSection {
  key: string;
  title: string;
  fields: ReadonlyArray<NormalizedField>;
}

interface NormalizedField {
  stableKey: string;
  label: string;
  value: AnswerValue;
  kind: FieldKind;
  // visibility / source は adapter 出力から落とす（防御的 sanitize）
}
```

### 3.3 adapter による吸収

| 乖離 | adapter での吸収方法 |
|------|--------------------|
| `publicSections` 名 vs `sections` 名 | adapter で `sections` に rename して primitive に渡す |
| 全 visibility を含む可能性（API バグ防御） | `f.visibility === "public"` のみ通す filter を Phase 5 実装で配置 |
| unknown `kind` 出現 | `FieldKindZ.safeParse(field.kind)` で fallback。失敗時は silent skip |
| `value` が `null` / `""` / `[]` | adapter は値を素通し。primitive 内で `"—"` 表示（既存 `MemberDetailSections`） |
| section 全 fields 除外時 | section ごと skip（empty `<section>` を出さない） |
| API が将来 `socialLinks` 等を追加 | adapter は `PublicMemberProfileZ.parse` 後の output のみ扱うため、schema 拡張時は adapter も同時拡張 |

## 4. RSC / fetch 戦略

- Server Component（`page.tsx`）から `fetch()` を直接呼ぶ。Route Handler 経由は禁止
- `cache: "no-store"`（API が `Cache-Control: no-store` を返すため UI 側も合わせる）
- `export const dynamic = "force-dynamic"` を明示（Next.js のキャッシュ判定で stale を防ぐ）
- API base URL は `getEnv().NEXT_PUBLIC_API_BASE_URL`（task-02 wrangler-env-injection 不変条件 / `process.env.*` 直接参照禁止）
- 404 系応答時は `notFound()`、500 系は `throw new Error(...)` → `error.tsx` boundary で補足
- try/catch で `notFound()` を握り潰さない（Next.js 内部の throw 機構を阻害するため）

## 5. error / loading 境界

- `error.tsx` / `loading.tsx` は serial-05 で `(public)` segment level に配置済みを前提とする
- 本 sub-workflow では新規 boundary を追加しない
- adapter / page.tsx で try/catch 構文を導入しない

## 6. 描画階層図

```
(public) AppShell (parallel-03)
└─ PublicHeader (既存)
└─ <main>
   └─ MemberDetail (新規 or 編集) — data-page="public-member-detail"
      ├─ ProfileHero (既存) — summary を渡す
      ├─ MemberTags (既存) — tags を渡す（tags.length > 0 のときのみ）
      ├─ MemberDetailSections (既存) — sections を渡す
      └─ MemberActivity (既存) — attendance を渡す（attendance.length > 0 のときのみ）
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

`MemberDetail.tsx` が既に存在しない場合は新設。存在する場合は内部実装のみ編集し props 契約（`MemberDetailProps`）は維持する。

## 8. パッケージ境界

- `@ubm-hyogo/shared` から `PublicMemberProfileZ` / `FieldKindZ` を import
- `@ubm-hyogo/web` 内で adapter / primitive / fixture を完結させる
- `@ubm-hyogo/api` への参照は HTTP 経由のみ（直 import 禁止）

## 9. 参照

- Phase 1 `phase-01-requirements.md`
- `packages/shared/src/zod/viewmodel.ts` L150-165
- `apps/api/src/routes/public/member-profile.ts`
- `apps/web/src/components/public/MemberDetailSections.tsx`
- `apps/web/src/lib/env.ts`（task-02）
- CLAUDE.md「データ流」「UI prototype alignment / MVP recovery」
