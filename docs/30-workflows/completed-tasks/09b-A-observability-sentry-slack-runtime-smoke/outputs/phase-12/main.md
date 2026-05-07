# Output Phase 12: ドキュメント更新（概要 / index）

## status

state: implemented-local / NON_VISUAL / Phase 12 deliverables index

本ファイルは Phase 12 の **概要と 7 必須ファイルへの index** であり、実 deliverable は別ファイルとして同一 cycle 内に配置済み。runtime wave では実測証跡が取得された場合のみ追記する。

## 7 必須ファイル index

| # | path | 概要 | 作成タイミング | 更新タイミング |
| --- | --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md`（本ファイル） | Phase 12 概要 / index | 本タスクで作成 | runtime wave 完了時に必要なら更新 |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 12-1 実装ガイド（Part 1 中学生 / Part 2 技術者） | 本タスクで initial 作成 | 実装後に Part 2 を update |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 12-2 システム仕様書同期サマリ（observability-monitoring + deployment-secrets-management + indexes rebuild） | 本タスクで作成 | aiworkflow-requirements 再同期時に update |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 12-3 更新履歴 | 本タスクで作成 | runtime wave 完了時に追記 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 12-4 未タスク検出（0 件でも出力） | 本タスクで作成 | follow-up 発見時に追記 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 12-5 skill feedback（3 観点固定） | 本タスクで作成 | runtime wave 完了時に追記 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-6 コンプライアンスチェック | 本タスクで作成 | runtime wave 完了時に再実行して update |

## 各ファイルの作成ルール

- implementation タスクでは Phase 12 で **現サイクルの実装内容を反映した版を作る**。実Provider smoke 後は別 wave で update する
- 改善点なしでも空欄ではなく「改善点: なし」を明示する（Task 12-5 の 3 観点）
- 未タスク検出が 0 件でも `unassigned 件数: 0` を明示出力する（Task 12-4）
- compliance check は本実装サイクルでのチェック結果（smoke route 実装 / Phase 11 evidence template 確定 / aiworkflow-requirements 同期完了 / workflow root `state=implemented-local`）を記録する

## implemented-local 状態の宣言

- workflow root の `state` は `implemented-local`
- Phase 12 close-out では provider runtime PASS までは主張しない
- provider runtime PASS は別 wave で取得され、その wave 完了時点で runtime evidence を再評価する
- 本ファイル更新時にも provider PASS への遷移は行わない

## aiworkflow-requirements 同期参照（実行は Task 12-2 で）

| target | 同期内容 |
| --- | --- |
| `observability-monitoring.md` | Phase 2 §5 通知 matrix の 5 trigger 追記 |
| `deployment-secrets-management.md` | secret 命名表に `SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` / `SLACK_WORKFLOW_URL` 追記 |
| `indexes/` | `mise exec -- pnpm indexes:rebuild` で drift 0 確認 |

## redact 規則（再掲）

本ファイル含め `outputs/phase-12/` 配下では DSN URL / webhook URL / token 値を一切記録しない。`op://...` 参照のみで表記する。

## 完了条件

- 本 index に列挙した 7 ファイルすべてが本タスクで実体作成される
- workflow root `state` が `implemented-local`
- runtime PASS は別 wave で取得する旨が明示されている

## notes

実 deliverable（implementation-guide.md 等 6 ファイル）は本仕様書作成タスク内で実体作成済み。本ファイルは **index + 作成ルールの宣言** であり、各 deliverable の本文は個別ファイルを正本とする。
