[実装区分: 実装仕様書]

# Phase 1 — 要件定義

| 項目 | 値 |
|------|------|
| phase | 1 |
| 名称 | 要件定義 |
| status | completed |
| implementation_mode | new |
| task_type | NON_VISUAL / governance |
| workflow_state | `implemented` |
| governance_mutation_user_gate | `true` |
| source_unassigned_task | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` |
| 完了条件 | 不変条件、前提条件チェックリスト、スコープが確定し Phase 2 進行可能 |

## 1. 目的

`playwright-visual-full` workflow の 3 viewport job (chromium × desktop / tablet / mobile) を `dev` / `main` の `required_status_checks.contexts` に追加し、UI regression を merge gate として強制する。

## 2. スコープ

### in-scope

- `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` の GET 操作
- `gh api -X POST repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection/required_status_checks/contexts` の user-approved mutation
- before/after の `required_status_checks.contexts` を JSON evidence 化
- rollback 用 DELETE contexts payload draft 作成
- `.github/workflows/playwright-visual-full.yml` の `pull_request.paths` 削除

### out-of-scope

- baseline PNG の追加・更新（task-709 で完了済）
- D1 / apps/web / apps/api の変更

## 3. 既存コードベース不変条件

1. 既存 workflow yaml は `pull_request.paths` 削除のみ変更し、job 定義・実行コマンドは無修正。
2. baseline PNG 51 枚（17 routes × 3 viewports）に変更を加えない。
3. 既存 `required_status_checks.contexts` 5 件
   `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]`
   をそのまま維持し、3 件だけ append する。
4. `required_pull_request_reviews=null` / `enforce_admins=true` / `lock_branch=false` / `required_linear_history=true` / `required_conversation_resolution=true` などの既存 governance フィールドを保持する。full PUT は使わず contexts endpoint を使う。

## 4. 追加する context 名（仮）

| viewport | 仮 context 名 | 確定方法 |
|----------|--------------|----------|
| desktop | `visual-full (desktop)` | Phase 11 fresh evidence で実測済み |
| tablet | `visual-full (tablet)` | Phase 11 fresh evidence で実測済み |
| mobile | `visual-full (mobile)` | Phase 11 fresh evidence で実測済み |

> issue #761 本文の `visual (chromium, desktop)` は仮表記。GitHub Actions の required context は実測文字列完全一致が必要なため、実測された `visual-full (...)` を正とする。

## 5. 前提条件チェックリスト

| # | 条件 | 確認コマンド / リンク | 確認結果欄 |
|---|------|---------------------|------------|
| 1 | PR #760 が dev に merge 済 | `gh pr view 760 --json mergedAt,baseRefName` | |
| 2 | baseline PNG 51 枚が dev に存在 | `git ls-files apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/ \| wc -l` | |
| 3 | task-709 stability evidence が存在 | `ls docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-11/evidence/visual-full-stability.md` | |
| 4 | task-709 user approval marker が存在 | `ls docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-11/evidence/user-approval-marker.md` | |
| 5 | playwright-visual-full の pull_request trigger active | `grep -n pull_request .github/workflows/playwright-visual-full.yml` | |
| 6 | 17 route × 3 viewport の snapshot 命名整合 | `ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` | |

## 6. 成功条件 (DoD)

- dev / main 双方の `required_status_checks.contexts` に 3 viewport context が追加されている
- before / after JSON evidence が `outputs/phase-11/evidence/` に保存されている
- rollback PUT payload draft が存在する
- 既存 5 件 context および governance フィールドに drift が無い

## 7. リスク

| リスク | 影響 | 緩和策 |
|--------|------|--------|
| full PUT で既存フィールド欠落 | 全 PR が block / governance 退行 | full PUT を使わず contexts endpoint を使用、Phase 9 で diff 0 件確認 |
| check run name 誤り | 永久に context が解決せず PR merge 不能 | Phase 1 末尾で `gh api .../jobs --jq '.jobs[].name'` で実測 |
| dev PUT 成功 / main PUT 失敗 | 環境差発生 | dev → main の独立実行、失敗時即 rollback |
