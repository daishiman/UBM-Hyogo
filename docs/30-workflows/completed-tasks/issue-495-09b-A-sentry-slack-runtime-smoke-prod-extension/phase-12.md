# Phase 12: ドキュメント更新 — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 12 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

task-specification-creator skill が要求する Phase 12 の **6 必須タスク + 7 ファイル** を完了し、aiworkflow-requirements 正本との同期を実装拡張観点（production extension）で行う。

## 6 必須タスク

### Task 12-1: 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）

- output: `outputs/phase-12/implementation-guide.md`
- Part 1（中学生レベル）: 「production と staging を分ける理由」「production_confirm ヘッダがある理由」「approval gate（G1〜G4）が 4 段階ある理由」「実値を log に書かない理由」を平易な言葉で
- Part 2（技術者レベル）: route 拡張差分 / `PRODUCTION_CONFIRM_HEADER` const / `smokeMessagePrefix` 純関数 / wrangler binding / 1Password item 構造 / `cf.sh secret put` 順序 / staging→production smoke 実行手順 / rollback
- 完了条件: 両 Part 同一ファイル内 section 分割、Part 2 から Phase 2 / Phase 5 / Phase 11 への内部 link

### Task 12-2: システム仕様書更新

- 同期対象:
  - `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`: production env 向け smoke message prefix 規約 / Sentry environment tag 規約 / channel 識別の追記
  - `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`: production env における `SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN` の op:// 参照 item 名追加、`PRODUCTION_CONFIRM_HEADER` 運用ルール記述
  - indexes rebuild: `mise exec -- pnpm indexes:rebuild`
- output: `outputs/phase-12/system-spec-update-summary.md`
- 完了条件: 2 reference の diff が summary に記録 + indexes drift 0

### Task 12-3: ドキュメント更新履歴作成

- output: `outputs/phase-12/documentation-changelog.md`
- 内容: 本タスクで更新した docs / 実装ファイル一覧（route / test / wrangler.toml / aiworkflow-requirements 2 件 / 本 workflow 配下 / indexes）と更新理由 / 関連 AC

### Task 12-4: 未タスク検出レポート（0 件でも出力必須）

- output: `outputs/phase-12/unassigned-task-detection.md`
- 検出対象: PagerDuty 連携 / Slack channel 完全分離（webhook 別出し）/ smoke の cron 定期実行化 / production_confirm の rotation 監査 / 09c production deploy readiness 連動
- 完了条件: 0 件でも `unassigned 件数: 0` を明示

### Task 12-5: スキルフィードバックレポート（3 観点固定）

- output: `outputs/phase-12/skill-feedback-report.md`
- 章立て:
  1. テンプレ改善（production extension 用 phase template が staging spec を継承する書き方）
  2. ワークフロー改善（multi-stage approval gate G1〜G4 の運用）
  3. ドキュメント改善（aiworkflow-requirements の env 別 secret 命名規約の明確さ）

### Task 12-6: タスク仕様書コンプライアンスチェック

- output: `outputs/phase-12/phase12-task-spec-compliance-check.md`
- 確認:
  - 6 必須タスク × 7 ファイル実体存在
  - Phase 11 template が `staging-smoke-log.md` / `production-smoke-log.md` を分離設計
  - aiworkflow-requirements 同期完了 + indexes drift 0
  - 実 secret 値 / DSN / webhook が repo 0 件（grep 3 系統）
  - workflow root state は実コード差分に合わせて `implemented-local`、runtime evidence は `pending_user_approval` のまま

## 7 必須ファイル

| # | path |
| --- | --- |
| 1 | `outputs/phase-12/main.md` |
| 2 | `outputs/phase-12/implementation-guide.md` |
| 3 | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | `outputs/phase-12/documentation-changelog.md` |
| 5 | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | `outputs/phase-12/skill-feedback-report.md` |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 実行ルール

- aiworkflow-requirements 更新と indexes rebuild は本タスクで実行可
- 実装コード変更は Phase 5 で実行する（本 phase は docs 同期）
- commit / push / PR は本仕様書 cycle で行わない

## 成果物

- 上記 7 ファイル

## 完了条件

- 7 ファイル実体存在
- aiworkflow-requirements 2 reference 更新 + indexes drift 0
- compliance check 全項目 PASS
- workflow root state は `implemented-local`、runtime evidence は `pending_user_approval` のまま

## 次 Phase への引き渡し

Phase 13 へ: PR title / body template / branch 候補 / G-05（PR 作成許可）。
