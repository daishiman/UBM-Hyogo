# Phase 12: ドキュメント変更履歴 (documentation-changelog)

本タスク (UT-GOV-002) で作成・更新した Markdown / JSON の changelog。`spec_created` のため新規作成が中心。

## サマリー

| 区分 | 件数 |
| --- | --- |
| 新規作成（spec） | 14（index.md + phase-01〜13.md） |
| 新規作成（artifacts） | 1（artifacts.json） |
| 新規作成（outputs） | 30+ ファイル |
| 既存ファイルの更新 | 0（本タスクでは既存の正本仕様を編集しない） |

## ファイル別 changelog

### Top-level（タスクディレクトリ直下）

| path | kind | summary |
| --- | --- | --- |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/index.md` | 新規 | メタ情報・Decision Log・スコープ・依存関係・AC-1〜AC-9・Phase 一覧 |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/artifacts.json` | 新規 | 13 Phase の status / outputs / depends_on_phases / metadata |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-01.md` | 新規 | 要件定義（dry-run 仕様の境界明示） |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-02.md` | 新規 | 設計（safety gate / trusted/untrusted 分離） |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-03.md` | 新規 | 設計レビュー（pwn request 観点） |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-04.md` | 新規 | テスト設計（fork PR 5 シナリオ） |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-05.md` | 新規 | 実装ランブック |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-06.md` | 新規 | テスト拡充（actor / cache / artifact / workflow_dispatch） |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-07.md` | 新規 | カバレッジ確認 |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-08.md` | 新規 | リファクタ（docs-only スコープ） |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-09.md` | 新規 | 品質保証 |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-10.md` | 新規 | 最終レビュー（No-Go 条件表） |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-11.md` | 新規 | 手動テスト（NON_VISUAL 整合性検査） |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-12.md` | 新規 | ドキュメント更新（Step 1-A〜1-D + Step 2） |
| `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-13.md` | 新規 | 完了確認（user_approval_required: true） |

### outputs/

| path | kind | summary |
| --- | --- | --- |
| `outputs/phase-1/main.md` | 新規 | 要件・受入条件・スコープ（111 行） |
| `outputs/phase-2/main.md` | 新規 | 設計概要（51 行） |
| `outputs/phase-2/design.md` | 新規 | safety gate 設計（158 行） |
| `outputs/phase-3/main.md` | 新規 | レビュー概要（50 行） |
| `outputs/phase-3/review.md` | 新規 | security review 観点（93 行） |
| `outputs/phase-4/main.md` | 新規 | テスト設計概要（65 行） |
| `outputs/phase-4/test-matrix.md` | 新規 | fork PR 5 シナリオ（130 行） |
| `outputs/phase-5/main.md` | 新規 | runbook 概要（48 行） |
| `outputs/phase-5/runbook.md` | 新規 | actionlint / yq / gh コマンド（218 行） |
| `outputs/phase-6/main.md` | 新規 | テスト拡充概要（49 行） |
| `outputs/phase-6/failure-cases.md` | 新規 | actor / cache / artifact / workflow_dispatch 脅威（118 行） |
| `outputs/phase-7/main.md` | 新規 | カバレッジ概要（47 行） |
| `outputs/phase-7/coverage.md` | 新規 | AC-1〜AC-9 カバレッジ表（132 行） |
| `outputs/phase-8/main.md` | 新規 | リファクタ概要（143 行） |
| `outputs/phase-8/before-after.md` | 新規 | Before/After 表（86 行） |
| `outputs/phase-9/main.md` | 新規 | 品質ゲート概要（63 行） |
| `outputs/phase-9/quality-gate.md` | 新規 | quality gate（pwn request 非該当根拠）（112 行） |
| `outputs/phase-10/main.md` | 新規 | 最終レビュー概要（57 行） |
| `outputs/phase-10/go-no-go.md` | 新規 | Go/No-Go 条件・ロールバック粒度（95 行） |
| `outputs/phase-11/main.md` | 新規 | 手動テスト概要（本 Phase で更新） |
| `outputs/phase-11/manual-smoke-log.md` | 新規 | 整合性検査ログ（本 Phase で更新） |
| `outputs/phase-11/link-checklist.md` | 新規 | リンクチェック表（本 Phase で更新） |
| `outputs/phase-12/main.md` | 新規 | 本 Phase 概要 |
| `outputs/phase-12/implementation-guide.md` | 新規 | PR メッセージ元の実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 | Step 1-A〜1-D + Step 2 = N/A |
| `outputs/phase-12/documentation-changelog.md` | 新規 | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 | 派生未タスク 4 件 |
| `outputs/phase-12/skill-feedback-report.md` | 新規 | skill 運用フィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | Phase 1-11 準拠チェック |
| `outputs/phase-13/main.md` | 新規 | 完了確認概要（pending） |
| `outputs/phase-13/local-check-result.md` | 新規 | ローカル check 結果テンプレ |
| `outputs/phase-13/change-summary.md` | 新規 | 変更サマリーテンプレ |
| `outputs/phase-13/pr-template.md` | 新規 | PR テンプレ |

## ベースライン

- 初期ドラフト: outputs パスのみ列挙、本文なし
- 現状: artifacts.json で参照される全 outputs パスに本文が存在（Phase 11/12 含む）

## 既存正本仕様への影響

なし。`docs/00-getting-started-manual/specs/` 以下、`apps/web` / `apps/api` 配下、`.github/workflows/*.yml` のいずれも本タスクでは編集しない。
