# task-26 / ui-mvp / W8 par — error.tsx token utility migration

| 項目 | 値 |
|------|----|
| Task ID | task-26-ui-mvp-w8-par-error-tsx-token-utility-migration |
| Wave | W8 par（task-23 / task-24 / task-25 と並列実行可） |
| Implementation Mode | `verify_existing`（差分確認 + token utility 置換） |
| Task 分類 | UI task（NON_VISUAL に近い — 既存 visual baseline で regression 0 確認） |
| 配置先 | `docs/30-workflows/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/` |
| upstream | task-05（error boundary）/ task-08（design tokens SSOT）/ task-09（@theme inline bridge） |
| downstream | task-18（verify-design-tokens CI gate） |
| Status | spec_created |

## 目的（1 行）

`apps/web/src/app/error.tsx` の Tailwind arbitrary value 直書き（`text-[var(--ubm-color-*)]` / `bg-[var(--ubm-color-*)]`）を task-09 の `@theme inline` utility（`text-danger` / `bg-panel` 等）に置換し、未定義 token `--ubm-color-fg-muted` の命名齟齬を解消する。

## 真の論点（要件レビュー思考法）

1. **真の論点**: error boundary の token 表現が SSOT（task-08）と utility bridge（task-09）に整合していない。`--ubm-color-fg-muted` は task-08 に未定義であり、現状コード（実装中）で参照されている場合は build/runtime で fallback 色が出る。
2. **依存関係・責務境界**: token SSOT は task-08、utility bridge は task-09。本 task は両者を変更せず、consumer（error.tsx）側だけを是正する。
3. **価値とコスト**: 価値 = CI gate（task-18）通過 + 命名一貫性。コスト = 数行の className 置換。並列実行可能。
4. **改善優先順位**: error.tsx → 他 boundary（global-error / not-found / loading）→ admin features（横展開 = 別 task）
5. **4 条件評価**:
   - 価値性: design-token 一貫性 + CI gate green
   - 実現性: pure rename / 副作用なし
   - 整合性: SSOT 不変・bridge 不変・consumer のみ変更
   - 運用性: regression baseline で確認、grep gate で再発防止

## 不変条件

1. token SSOT は `docs/00-getting-started-manual/specs/09b-design-tokens.md`（task-08）。本 task では SSOT を変更しない。
2. `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css` の `@theme inline` 定義は変更しない（task-09 正本維持）。
3. `--ubm-color-fg-muted` は task-08 に未定義のため既存 utility（`text-text-3` ＝ `--color-text-3` ＝ `--ubm-color-text-muted` への bridge）に置換する。SSOT への新 token 追加は別 PR。
4. visual regression は task-18 baseline（playwright-smoke / visual）で 0 件確認。
5. grep gate: `apps/web/src/app/error.tsx` 内に `text-\[var\(` / `bg-\[var\(` が残らない。

## スコープ

| 区分 | 対象 |
|------|------|
| in scope | `apps/web/src/app/error.tsx`、同階層の `global-error.tsx` / `not-found.tsx` / `loading.tsx` に同パターンが存在する場合のみ併せて移行 |
| out of scope | `apps/web/src/features/**`、`apps/web/src/components/**` 配下の同種パターン（admin / public 各 features は別 task = unassigned 候補） |
| out of scope | tokens.css / globals.css の bridge 追加・SSOT 変更 |

## utility マッピング（暫定）

| 旧 arbitrary | 新 utility（@theme inline 経由） | bridge 元 (--ubm-*) |
|--------------|----------------------------------|---------------------|
| `text-[var(--ubm-color-text-primary)]` | `text-text` | `--ubm-color-text-primary` |
| `text-[var(--ubm-color-text-secondary)]` | `text-text-2` | `--ubm-color-text-secondary` |
| `text-[var(--ubm-color-text-muted)]` | `text-text-3` | `--ubm-color-text-muted` |
| `text-[var(--ubm-color-fg-muted)]`（未定義）| `text-text-3` に統一 | 同上（命名齟齬を text-muted に集約） |
| `text-[var(--ubm-color-danger)]` | `text-danger` | `--ubm-color-danger` |
| `bg-[var(--ubm-color-danger-soft)]` | `bg-danger-soft` | `--ubm-color-danger-soft` |
| `bg-[var(--ubm-color-surface-panel)]` | `bg-panel` | `--ubm-color-surface-panel` |
| `border-[var(--ubm-color-border-default)]` | `border-border` | `--ubm-color-border-default` |

> 最終マッピングは Phase 1 / 2 で実コード grep 結果に基づき確定する。

## Phase 一覧

| Phase | 名称 | Status | 出力 |
|-------|------|--------|------|
| 1 | 要件定義 | spec_created | `outputs/phase-1/requirements.md` |
| 2 | 設計 | spec_created | `outputs/phase-2/design.md` |
| 3 | 設計レビュー | spec_created | `outputs/phase-3/design-review.md` |
| 4 | テスト作成 | spec_created | `outputs/phase-4/test-plan.md` |
| 5 | 実装 | spec_created | `outputs/phase-5/implementation-plan.md` |
| 6 | テスト拡充 | spec_created | `outputs/phase-6/extended-tests.md` |
| 7 | カバレッジ確認 | spec_created | `outputs/phase-7/coverage-report.md` |
| 8 | リファクタリング | spec_created | `outputs/phase-8/refactor-notes.md` |
| 9 | 品質保証 | spec_created | `outputs/phase-9/qa-result.md` |
| 10 | 最終レビュー | spec_created | `outputs/phase-10/final-review.md` |
| 11 | 手動テスト | spec_created | `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント更新 | spec_created | `outputs/phase-12/*.md`（6 成果物） |
| 13 | PR 作成 | blocked（user 承認後） | `outputs/phase-13/pr-summary.md` |
