[実装区分: 実装仕様書]

# task-761 — playwright-visual-full を dev / main の required status check に追加

## メタ情報

| 項目 | 値 |
|------|------|
| task_id | task-761-visual-full-required-status-check |
| status | implemented (branch protection mutation completed 2026-05-17T12:49:39Z) |
| source_issue | https://github.com/daishiman/UBM-Hyogo/issues/761 |
| parent_task | task-709-visual-baseline-runtime-capture (PR #760 merged) |
| base_branch | dev |
| working_branch | feat/task-761-visual-full-required-check |
| implementation_mode | new |
| task_type | NON_VISUAL / governance |
| 影響範囲 | GitHub branch protection (dev / main) `required_status_checks.contexts` |
| コード変更 | `.github/workflows/playwright-visual-full.yml` の `pull_request.paths` 削除 + branch protection API 操作 |
| workflow_state | `implemented`（branch protection runtime mutation 完了。`gh api -X POST` を 2026-05-17T12:49:39Z に user 承認後実行済み） |
| governance_mutation_user_gate | `true` |
| source_unassigned_task | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md`（consumed） |

## 概要

`playwright-visual-full` workflow の 3 viewport job (chromium × desktop / tablet / mobile) を `dev` と `main` の branch protection `required_status_checks.contexts` に追加する。
これは branch protection の不可逆 governance mutation であり、user 明示承認が必須。

## Phase 一覧

| Phase | 名称 | status | 主成果物 | 完了条件 |
|------|------|--------|----------|----------|
| 1 | 要件定義 | completed | `outputs/phase-1/phase-1.md` | 不変条件・前提条件チェックリスト確定 |
| 2 | 設計 | completed | `outputs/phase-2/phase-2.md` | required contexts POST 設計、check run name 実測手順、責務境界明文化 |
| 3 | 設計レビュー | completed | `outputs/phase-3/phase-3.md` | Phase 4 進行 GO/NO-GO 判定 |
| 4 | テスト設計 | completed | `outputs/phase-4/phase-4.md` | read-only GET dry-run コマンド確定 |
| 5 | 実装 | completed | `outputs/phase-5/phase-5.md` | dev/main の `required_status_checks.contexts` に 3 件追加（user 承認後） |
| 6 | テスト拡充 | completed | `outputs/phase-6/phase-6.md` | rollback dry-run / drift 検知 grep 設計 |
| 7 | カバレッジ確認 | completed | `outputs/phase-7/phase-7.md` | branch protection 変更項目の網羅確認 |
| 8 | リファクタリング | completed | `outputs/phase-8/phase-8.md` | NON_VISUAL のため命名統一の確認のみ |
| 9 | 品質保証 | completed | `outputs/phase-9/phase-9.md` | required contexts POST 妥当性 / drift 0 件 |
| 10 | 最終レビュー | completed | `outputs/phase-10/phase-10.md` | MAJOR/MINOR 判定 |
| 11 | 手動テスト | completed | `outputs/phase-11/phase-11.md` | evidence 9 件揃い、NON_VISUAL 宣言 |
| 12 | ドキュメント整理 | completed | `outputs/phase-12/main.md` + strict 7 成果物 | 中学生レベル説明 + 技術詳細 + compliance check |
| 13 | PR 作成 | pending | `outputs/phase-13/phase-13.md` | user 承認後 `gh pr create --base dev` |

## 関連タスク・リンク

- 親タスク: `docs/30-workflows/task-709-visual-baseline-runtime-capture/`
  - stability evidence: `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-11/evidence/visual-full-stability.md`
  - 承認 marker: `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-11/evidence/user-approval-marker.md`
- governance 先例: UT-GOV-001（`required_pull_request_reviews=null` / `enforce_admins=true` 保持）
- workflow yaml: `.github/workflows/playwright-visual-full.yml`

## 厳守事項

1. branch protection mutation は **user 明示承認後の Phase 5 のみ**。本 task では required status check contexts POST を 2026-05-17T12:49:39Z に実行済み。
2. full branch protection PUT は **既存設定全置換** のため使用しない。rollback 等で必要になった場合も別途 user 承認を必須にする。
3. dev → main の順で独立実行し、片方の失敗が他方に波及しないようにする。
4. base branch は `dev`（CLAUDE.md ルール）。`main` への PR は production リリース時のみ。
5. required context は fresh evidence を優先し、実測された `visual-full (desktop|tablet|mobile)` を登録済み。
