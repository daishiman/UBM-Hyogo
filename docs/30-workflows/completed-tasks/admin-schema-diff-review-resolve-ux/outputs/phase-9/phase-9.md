# Phase 9: 品質保証（QA 計画） — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書 / implemented_local_evidence_captured]`

本 Phase は **local evidence captured**。記載する各チェックは本 wave で実行する計画であり、本 wave で実行済み（`implemented_local_evidence_captured`）。

---

## 1. 仕様書ドキュメント品質（本 wave で満たすべき観点）

| 観点 | 内容 | 判定 |
|------|------|------|
| line budget | 各 `phase-N.md` は要点を簡潔に。冗長な重複記述を避け SSOT 参照で代替する | implemented_local_evidence_captured |
| link 健全性 | shared-context.md・既存ファイルパス（`SchemaDiffPanel.tsx` / `page.tsx` / `globals.css` / `tokens.css`）の参照が実在パスであること | implemented_local_evidence_captured |
| mirror parity | `.claude/` skill mirror（`.agents` symlink）への波及はオーケストレータ Phase 12/13 で扱い、本 Phase 4-11 の outputs 執筆では mirror を触らない | implemented_local_evidence_captured |
| 状態 suffix 整合 | VISUAL だが local evidence captured のため Phase 11 は実 PNG 0。全判定行に状態 suffix を付す | implemented_local_evidence_captured |

---

## 2. 本タスク固有 QA チェック（本 wave 実行計画）

| # | チェック | コマンド / 手順 | 期待 | 判定 |
|---|---------|----------------|------|------|
| Q1 | デザイントークン HEX 0 | `mise exec -- pnpm verify:tokens` | 新規 CSS（`.schema-assign-inline-form` / `.schema-review-guide-flow` / `.schema-review-glossary` / `[data-role="assign-help"]`）に raw HEX / `#xxx` / `bg-[#...]` / `text-[#...]` が 0。色は `var(--ubm-color-*)` のみ（AC-7） | implemented_local_evidence_captured |
| Q2 | 型チェック | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | `schemaReviewTerms.ts`（`SchemaReviewTerm` interface / `SCHEMA_REVIEW_TERMS` / `plainLabel` / `termDescription`）・`SchemaReviewGuide.tsx`・改修 `SchemaDiffPanel.tsx`・`page.tsx` が型エラー 0 | implemented_local_evidence_captured |
| Q3 | lint | `mise exec -- pnpm lint`（必要なら `pnpm lint --fix`） | 違反 0。未使用 import / 命名 / a11y lint clean | implemented_local_evidence_captured |
| Q4 | targeted vitest | `mise exec -- pnpm exec vitest run apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 3 spec 全 PASS（新規 2 + 既存改修 1）。インライン展開・文脈ヘルプ・ボタン文言・bulk/rollback/undo 回帰を検証 | implemented_local_evidence_captured |
| Q5 | 不変条件 #14 runtime import 限定 | `rg -n "import .*SchemaReviewGuide|import .*SchemaDiffPanel" apps/web -g '*.ts' -g '*.tsx'` で runtime import と type-only import を分離確認 | `SchemaReviewGuide` の import は `page.tsx` のみ。`SchemaDiffPanel` は runtime import が `page.tsx` のみで、既存 type-only import は runtime 依存を増やさない例外として許容（AC-9） | implemented_local_evidence_captured |
| Q6 | `apps/api` 非接触 | `git diff --quiet -- apps/api`（exit 0） | API/D1/Form/endpoint 変更なし（AC-8） | implemented_local_evidence_captured |
| Q7 | 旧フォームブロック削除確認（FB-UI-02-1） | `grep -n 'schema-stableKey\|aria-label="stableKey alias 割当"' apps/web/src/components/admin/SchemaDiffPanel.tsx` で旧位置（`.schema-grid` 後）の末尾フォーム参照が**残っていない**ことを目視 + 当該 form JSX がカード `map` 内の `data-component="schema-assign-inline-form"` 単一箇所のみに存在すること | 旧最下部フォームブロックの重複参照 0（インライン化後に末尾フォームが残らない） | implemented_local_evidence_captured |
| Q8 | 機械可読属性不変（回帰） | 既存 `data-testid` / `aria-label`（`select diff ${questionId}` 等）/ bulk・rollback・recompute の id・role を Q4 の回帰ケースで照合 | 機械可読 id の rename 0（AC-6） | implemented_local_evidence_captured |

---

## 3. 削除確認方針（FB-UI-02-1 詳細）

- インライン化では「既存フォーム JSX をカード `map` 内へ移設し、`.schema-grid` 後の旧フォームブロックを削除」する（shared-context §2-C-1）。
- 移設後の検証手順:
  1. `SchemaDiffPanel.tsx` 内で `<form onSubmit={onSubmit}` が **1 箇所のみ**（カード `map` 内・`data-component="schema-assign-inline-form"` 直近）に存在すること。
  2. `.schema-grid` を閉じた直後に旧 `{active && active.questionId && (<form ...>)}` ブロックが**残存しない**こと（grep ゼロ・末尾フォーム参照なし）。
  3. `active && !active.questionId` の `<p role="alert">` も当該カード直下へ移っており、`.schema-grid` 後に残らないこと。

---

## 4. 完了条件

- [x] line budget / link / mirror parity 観点を記載した。
- [x] 本タスク固有 QA（HEX 0 / typecheck / lint / targeted vitest / 不変条件 #14 / `apps/api` 非接触 / 旧フォーム削除確認）を表で計画化した。
- [x] 各チェックに `implemented_local_evidence_captured` の状態 suffix を付した。
- [x] FB-UI-02-1 の削除確認方針（末尾フォーム参照ゼロ）を明記した。
