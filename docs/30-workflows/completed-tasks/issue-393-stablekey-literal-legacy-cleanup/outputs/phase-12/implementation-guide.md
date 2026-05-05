# Implementation Guide

## Part 1: 中学生レベル

学校で教科書を作るとき、「校章」のロゴ画像は「校章ファイル」1 個だけに保管して、各ページからはそのファイルを参照します。もし各ページが勝手に「校章っぽい絵」を描き直したら、ページごとに校章が微妙に違ってしまい、後で校章を変更したときに全ページを直す羽目になります。

本タスクが解消するのもこれと同じ問題です。フォーム項目の「合言葉」（stableKey という名前）が、これまで 14 個のファイルで個別に直書きされていました。1 か所だけ「正本ファイル」に置き、各所からはそれを名前で参照するように直します。これで合言葉が変わっても 1 か所の修正で全部に反映されます。

さらに、自動チェック係（lint）が「直書きしている人」を見つけてくれる仕組み（親タスクで作成済み）を、いま「警告止まり」から「不合格にする」モードに上げられる準備が整います。

| 専門用語 | 日常語への言い換え |
| --- | --- |
| stableKey | フォームの項目を識別する変わらない合言葉 |
| 正本 supply module | 合言葉を 1 か所に集めた正式なファイル |
| named import | 正本ファイルから合言葉を名前指定で借りてくる書き方 |
| literal | コードに直接書かれた文字列のかたまり |
| strict CI gate | PR 提出時に自動で動く、絶対に通さない検査 |
| family | 変更箇所を安全に進めるためのグループ |

## Part 2: 技術者レベル

### Interface / Constant Contract

- Source #1: `packages/shared/src/zod/field.ts`
- Source #2: `packages/integrations/google/src/forms/mapper.ts`
- Consumer scope: family A〜G in `artifacts.json.violation_families`

### API Signature / Usage

新規 export `STABLE_KEY` を `packages/shared/src/zod/field.ts` に追加（既存の branded type `StableKey` との name collision を避けるため SCREAMING_SNAKE_CASE）。
`FieldByStableKeyZ` のキー集合（31 stableKey）と一致する `Record<StableKeyName, StableKeyName>` を `as const satisfies` で型保証する。

```ts
// packages/shared/src/zod/field.ts (allow-list 内)
export const STABLE_KEY = {
  fullName: "fullName",
  nickname: "nickname",
  // ... 31 entries
  rulesConsent: "rulesConsent",
} as const satisfies { readonly [K in StableKeyName]: K };
```

application code (14 files) は `import { STABLE_KEY } from "@ubm-hyogo/shared"` で取得し、literal を property access に置換する。

```ts
// before
if (col.key === "publicConsent") { ... }
"氏名": "fullName",
<p data-role="nickname">

// after
if (col.key === STABLE_KEY.publicConsent) { ... }
"氏名": STABLE_KEY.fullName,
<p data-role={STABLE_KEY.nickname}>
```

TS 型 indexed access も同様:
```ts
// before
type T = MeProfileStatusSummary["rulesConsent"];
// after
type T = MeProfileStatusSummary[typeof STABLE_KEY.rulesConsent];
```

### 変更ファイル（14 件 / family A〜G）

| family | files |
|---|---|
| A (sync job) | apps/api/src/jobs/mappers/sheets-to-members.ts, apps/api/src/jobs/sync-sheets-to-d1.ts |
| B (repository) | apps/api/src/repository/_shared/builder.ts, apps/api/src/repository/publicMembers.ts |
| C (admin route) | apps/api/src/routes/admin/members.ts, apps/api/src/routes/admin/requests.ts |
| D (use-case / view-model) | apps/api/src/use-cases/public/list-public-members.ts, apps/api/src/view-models/public/public-member-list-view.ts, apps/api/src/view-models/public/public-member-profile-view.ts |
| E (web profile components) | apps/web/app/profile/_components/RequestActionPanel.tsx, apps/web/app/profile/_components/StatusSummary.tsx |
| F (web public components) | apps/web/src/components/public/MemberCard.tsx, apps/web/src/components/public/ProfileHero.tsx |
| G (consent util) | packages/shared/src/utils/consent.ts |

加えて `packages/shared/src/zod/field.ts`（`STABLE_KEY` const 追加）と `scripts/lint-stablekey-literal.test.ts`（issue-393 0-violation 期待値テスト追加）を更新。

### Error Handling / Edge Cases

| Case | Handling |
| --- | --- |
| canonical export missing | stop implementation and update Phase 2 mapping instead of adding duplicate literal |
| focused test absent | record absence in Phase 4 and use integration vitest as substitute |
| strict lint still fails | inspect remaining literal path and continue cleanup in same cycle |
| suppression temptation | do not add `eslint-disable`, `@ts-ignore`, or dynamic string construction |

### Parameters / Constants

| Name | Value |
| --- | --- |
| target violation count | 0 |
| stableKey count | 31 |
| affected files | 14 |
| visual evidence | NON_VISUAL |
