# システム仕様への影響

> workflow: `issue-1126-bulk-tag-picker-viewport-baseline-expansion`
> workflow_state: `implemented_local_runtime_pending` / issue: #1126（CLOSED 維持）

---

## システム仕様への影響

本タスクは **Playwright visual baseline の additive 追加のみ** であり、
プロダクションの挙動・データモデル・公開 interface を一切変更しない。

| 対象 | 影響 | 判定 |
|------|------|------|
| API（`apps/api/src/routes/`） | endpoint surface 不変。新規 / 変更なし | 影響なし |
| D1 schema（migrations） | テーブル / カラム / index の追加・変更なし | 影響なし |
| Google Form schema | フォーム項目・consent キー等の変更なし | 影響なし |
| `apps/web` プロダクションコード | `BulkActionBar.tsx` 等の component 実装は不変（baseline 取得のみ） | 影響なし |
| `docs/00-getting-started-manual/specs/*.md`（正本仕様） | 仕様変更なし | 影響なし |
| OKLch design tokens（`tokens.css` / `design-tokens.md`） | 色・token 変更なし | 影響なし |

### 結論

- **システム仕様書（`docs/00-getting-started-manual/specs/`）の更新は不要（N/A）。**
  理由: 本タスクの成果物は test artifact（Playwright spec + viewport fixture + baseline PNG）の追加であり、
  プロダクション挙動・公開仕様は不変。test infra の拡張は正本仕様の対象外。

- **aiworkflow-requirements の公開 system spec への反映は不要（N/A）。**
  理由: 公開 interface / 型 / 定数 / API の新設・変更がない。`viewports.ts` の `wide` 追加は
  内部 test fixture への additive であり、外部公開 contract ではない。

- **aiworkflow-requirements の workflow 台帳・artifact inventory は同一 wave で同期済み。**
  理由: 本件は workflow 正本管理対象であり、quick-reference / resource-map / task-workflow-active /
  artifact inventory / changelog / LOGS / SKILL-changelog に `implemented_local_runtime_pending` と user-gated
  runtime visual 境界を登録した。

### 補足

- `viewports.ts` の `ViewportName` union は `wide` 追加で自動拡張されるが、これは test 内部の型であり、
  既存 consumer（`playwright.config.ts` の `visual-full-*` project）の互換を壊さない additive 変更（AC-R4）。
- CI ワークフロー（`playwright-staging-visual-authenticated.yml`）も無改修。glob 経由で新 baseline が自動参加するため。
