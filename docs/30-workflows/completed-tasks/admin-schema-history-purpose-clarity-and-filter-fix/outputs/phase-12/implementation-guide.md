# Implementation Guide

[実装区分: 実装仕様書]

`/admin/schema/history`（設問の紐付け履歴）の 4 問題を 1 サイクルで解消する実装ガイド。本タスクは `implemented_local_evidence_captured` であり、local visual evidence は取得済み、staging visual / commit / PR のみ user-gated。

## Part 1（やさしい説明・専門用語を避けて）

この画面は、Google フォームの質問文が変わったときに、昔の質問と新しい質問を同じものとして結びつけた記録を見るためのものです。今回、画面冒頭に「この画面で分かること」と流れ 3 ステップ、用語集を追加し、初めて見る管理者にも用途が分かるようにしました。

絞り込みで表示されていた読みにくい JSON エラーは、サーバーが返す `batchId` を web 側のチェックが知らなかったことが原因でした。web 側の受け取り schema に `batchId` を明示し、想定外の生エラーを日本語メッセージに変換する helper を追加しました。

履歴一覧は表からカード形式へ変更し、「いつ・誰が・どの設問を・旧 stableKey から新 stableKey へどう紐付けたか」を読み取りやすくしました。色は既存 design token のみを使い、API / D1 / Google Form は触っていません。

## Part 2（技術者向け）

### 実装内容

- Lane A: `apps/web/src/lib/admin/api.ts` の `AppliedFiltersZ` と `defaultAppliedFilters()` に `batchId: z.string().nullable()` / `batchId: null` を追加。`.strict()` は維持。
- Lane B: `apps/web/src/lib/admin/schemaHistoryError.ts` に `formatSchemaHistoryError(error: unknown): string` を追加し、ZodError / HTTP Error / generic Error を raw 表示しない日本語メッセージへ変換。
- Lane C: `schemaHistoryGlossary.ts` と `SchemaHistoryPurposeExplainer.tsx` を追加し、panel 冒頭へ目的説明 UI を組み込み。page title / description を平易化。
- Lane D: `SchemaDiffHistoryPanel.tsx` の table 表示を `.schema-history-card` のカードリストへ置換。
- Lane E: focused spec 4 ファイルで batchId / error / explainer / card を回帰保護。

### 対象ファイル

#### 新規作成（apps/web）

- `apps/web/src/lib/admin/schemaHistoryError.ts`
- `apps/web/src/lib/admin/schemaHistoryGlossary.ts`
- `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx`

#### 新規作成（apps/web spec）

- `apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts`
- `apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx`
- `apps/web/playwright/tests/admin-schema-history-purpose-clarity.spec.ts`

#### 編集（apps/web）

- `apps/web/src/lib/admin/api.ts`
- `apps/web/src/lib/admin/__tests__/api.spec.ts`
- `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx`
- `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx`
- `apps/web/app/(admin)/admin/schema/history/page.tsx`
- `apps/web/src/styles/globals.css`

### 非接触

- `apps/api/**`
- `apps/api/migrations/**`
- Google Form schema

### 検証結果

| Command | Result |
| --- | --- |
| `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | PASS（4 files / 60 tests） |
| `PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-history-purpose-clarity-and-filter-fix/outputs/phase-11 pnpm --dir apps/web exec playwright test playwright/tests/admin-schema-history-purpose-clarity.spec.ts --project=desktop-chromium` | PASS（2 tests / local screenshots 2 PNG） |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm verify:tokens` | PASS（design tokens in sync / 91 tracked） |
| `git diff origin/dev...HEAD -- apps/api apps/api/migrations` | PASS（空） |

### 既知制約

- staging deploy / authenticated screenshot 2 点 / commit / push / PR は user-gated。local screenshot 2 点は取得済み。
- M-1（glossary 将来統合）/ M-2（shared 型化）は本サイクル外 baseline として維持。今回対応すると未マージ依存または apps/api 非接触に反する。

## 視覚証跡

| canonical 名 | 内容 | status |
|------|------|--------|
| `outputs/phase-11/screenshots/admin-schema-history-purpose-and-card.png` | 目的説明パネル + 履歴カード一覧 | present |
| `outputs/phase-11/screenshots/admin-schema-history-error-message.png` | 日本語エラーメッセージ（raw JSON 非表示） | present |
