# Phase 12: ドキュメント更新 — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ] / CONST_004 例外根拠: 本タスクは `taskType: docs-only / NON_VISUAL / spec_created / remaining-only` であり、Phase 12 は task-specification-creator skill の **6 必須タスク + 7 ファイル** を実行・実体化するが、実装コード変更 / commit / push / 実 secret 投入は一切行わない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 12 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| state | spec_created（workflow root の `state` は据え置く） |

## 目的

実装着手前段階で task-specification-creator skill が要求する **Phase 12 の 6 必須タスク + 7 ファイル** を完了し、aiworkflow-requirements 正本との同期を行う。

## 入力

- Phase 1 AC（AC-01 〜 AC-05）
- Phase 2 設計（1Password item / secret 命名表 / 通知 matrix / rotation / fallback tree）
- Phase 3 review GO 判定（R-04 forward 課題）
- Phase 11 evidence template（runtime PASS は別 wave で取得）

## 6 必須タスク（task-specification-creator skill 仕様）

### Task 12-1: 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）

- output: `outputs/phase-12/implementation-guide.md`
- Part 1（中学生レベル）: 「Sentry / Slack って何」「op:// 参照だけ書いて実値を書かない理由」「approval gate がある理由」を平易な言葉で
- Part 2（技術者レベル）: secret 命名 / wrangler.toml 参照 / Sentry SDK 初期化箇所 / Slack notifier 配置 / smoke 手順 / rotation 手順
- 完了条件: 両 Part が同一ファイル内で section 分割され、Part 2 から Phase 2 設計表 / Phase 11 template への内部 link あり

### Task 12-2: システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）

- 同期対象（aiworkflow-requirements）:
  - `observability-monitoring.md`: 通知 matrix セクションに本タスクの 5 trigger（`sync_jobs.failed` / `sync_jobs.running` stale / Workers 5xx / Sentry P1 tag / Magic Link 失敗）を追記。重複行は pointer 化
  - `deployment-secrets-management.md`: secret 命名表に `SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` / `SLACK_WORKFLOW_URL`（optional）を追記
  - `indexes/` rebuild: `mise exec -- pnpm indexes:rebuild` を実行
- output: `outputs/phase-12/system-spec-update-summary.md`
- Step 1-A: 既存 secret 命名表との衝突確認（`SLACK_ALERT_WEBHOOK_URL` 既存名との関係を Phase 5 forward 課題として記録）
- Step 1-B: 通知 matrix の 5 trigger を canonical 行として追記
- Step 1-C: indexes rebuild と diff 確認
- Step 2（条件付き）: `SLACK_ALERT_WEBHOOK_URL` の deprecation 表記が他 references で必要な場合のみ実施、本タスクでは記録のみ
- 完了条件: 上記 2 reference の diff が summary に記録され、indexes が rebuild 済

### Task 12-3: ドキュメント更新履歴作成

- output: `outputs/phase-12/documentation-changelog.md`
- 内容: 本タスクで更新した docs ファイル一覧（aiworkflow-requirements 2 件 / 本 workflow 配下 6 ファイル / indexes）と更新理由
- 完了条件: ファイル / 行数 / 更新理由 / 関連 AC を表で記録

### Task 12-4: 未タスク検出レポート作成（0 件でも出力必須）

- output: `outputs/phase-12/unassigned-task-detection.md`
- 検出対象: Phase 5（実装ランブック）forward 課題 / Sentry-Slack 連携の Phase 5 検討事項 / `SLACK_ALERT_WEBHOOK_URL` deprecation 移行 / production 登録 wave / placeholder 解除 commit wave
- 完了条件: 検出された follow-up が 0 件でも `unassigned 件数: 0` を明示出力。1 件以上ある場合は `docs/30-workflows/unassigned-task/` への登録候補としてファイル名 / 概要を記録

### Task 12-5: スキルフィードバックレポート作成（改善点なしでも出力必須・3 観点固定）

- output: `outputs/phase-12/skill-feedback-report.md`
- 章立て（固定 3 観点）:
  1. テンプレ改善（Phase 11 template が docs-only / NON_VISUAL の runbook formalization に適合するか）
  2. ワークフロー改善（runtime wave 分離契約 / approval gate 運用）
  3. ドキュメント改善（aiworkflow-requirements 同期手順の明確さ）
- 完了条件: 3 章すべてに `改善点: なし` または具体提案を 1 件以上記載

### Task 12-6: タスク仕様書コンプライアンスチェック

- output: `outputs/phase-12/phase12-task-spec-compliance-check.md`
- 確認項目:
  - 6 必須タスク × 7 ファイルが実体存在（`outputs/phase-12/main.md` + 6 deliverable + skill 観点での counter）
  - Phase 11 evidence template 7 種が `outputs/phase-11/main.md` に network 化（実体ファイルは別 wave）
  - aiworkflow-requirements 同期完了（`mise exec -- pnpm indexes:rebuild` の `git status` 確認）
  - 実 secret 値 / 実 DSN URL / 実 webhook URL が repo 内に 0 件（grep gate 3 系統）
  - workflow root `state` が `spec_created` のままであること
- 完了条件: 全項目 PASS の表が記録される

## 7 必須ファイル（実体存在）

| # | path | 概要 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 概要 / 7 ファイル index |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 12-1 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 12-2 |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 12-3 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 12-4 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 12-5 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-6 |

## spec_created タスクの特殊扱い

- workflow root の `state`（`index.md` メタ「状態」 / `artifacts.json.metadata.workflow_state`）は **`spec_created` のまま据え置く**
- Phase 12 close-out で `completed` に書き換えない
- `phases[12].status` は本 spec_created cycle では `spec_created` のまま維持する。Phase 12 の成果物実体は strict 7 files として存在するが、runtime PASS とは別扱いにする
- runtime PASS は別 wave で取得し、その wave 完了時点で workflow root を `completed` 候補に再評価する

## aiworkflow-requirements 同期対象（再掲）

| target file | 追記内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Phase 2 §5 通知 matrix の 5 行を本タスク source として追記。既存重複行は pointer 化 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | secret 命名表に `SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` / `SLACK_WORKFLOW_URL` を追記。1Password 参照表記も同期 |
| `.claude/skills/aiworkflow-requirements/indexes/` | `mise exec -- pnpm indexes:rebuild` を実行し drift 0 を確認 |

## 実行ルール

- アプリケーションコード変更 / commit / push / PR 作成 / 実 secret 投入を**行わない**
- aiworkflow-requirements の更新は本タスクで実行可（docs 更新の範疇）。indexes rebuild も本タスクで実行する
- `outputs/phase-12/` 配下のファイルは本タスクで実体作成する


## 実行タスク

1. この Phase の入力、出力、approval gate、redaction 境界を確認する。
2. 実 secret 値、DSN URL、Slack webhook URL、token 値が仕様書に含まれていないことを確認する。
3. 後続 Phase または runtime wave へ引き渡す evidence path を明示する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 成果物

- `outputs/phase-12/main.md`

## 完了条件

- 上記 7 ファイルが実体存在（line count > 0）
- aiworkflow-requirements 2 reference に diff があり、indexes が rebuild 済
- compliance check（Task 12-6）の全項目が PASS
- workflow root の `state` が `spec_created` のまま

## 次 Phase への引き渡し

Phase 13 へ。PR title / body template / branch 名 candidate / approval gate G-05 を渡す。
