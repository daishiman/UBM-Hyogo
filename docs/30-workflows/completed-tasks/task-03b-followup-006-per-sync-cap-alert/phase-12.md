[実装区分: 実装仕様書]

# Phase 12: close-out — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 目的

この Phase の責務を、per-sync cap alert 仕様の実装承認前に検証可能な粒度へ固定する。

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-11.md

## 成果物

- phase-12.md

## 5 必須タスク + Task 6 (compliance)

### Task 12-1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md` を生成する。

- Part 1（中学生レベル）: per-sync write cap = 200 とは何か / なぜ連続到達を検知したいか / 通知が飛ぶ条件
- Part 2（技術者レベル）: zod schema 拡張 / detector の SQL / Analytics Engine binding / 閾値と escalation 階段

### Task 12-2: システム仕様書更新

- 1-A: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` の observability 節に閾値と通知抽象化を追記
- 1-B: 同 references の cost guardrail 節に D1 無料枠影響評価（19.2% 占有）を追記
- 1-C: index / topic-map / keywords を `mise exec -- pnpm indexes:rebuild` で再生成

### Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に変更ファイル一覧と差分概要を記録。

### Task 12-4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md` に以下を記録:

1. 通知チャネル本体構築（GitHub issue auto-create script / Slack webhook 配線 / mail sender 統合）→ 引き取り候補: 05a-parallel-observability-and-cost-guardrails
2. cron 間隔を一時的に短縮するオペレーション自動化 → 引き取り候補: observability cluster 内 follow-up
3. 0 件の場合でもファイル出力必須

### Task 12-5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` に task-specification-creator / aiworkflow-requirements skill への改善提案を記録。改善点なしでもファイル出力必須。

### Task 12-6: compliance check

`outputs/phase-12/phase12-task-spec-compliance-check.md` に 5 必須タスクと runbook の存在を実体確認した結果を記録。

### Phase 12 strict 7 files

| # | 必須ファイル | 用途 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 本体 evidence |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 12-1 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 12-2 |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 12-3 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 12-4 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 12-5 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-6 |

## runbook（追加成果物）

`outputs/phase-12/runbook-per-sync-cap-alert.md` に phase-03 §6 の通り 6 セクション構成で記載。

## state 遷移

- 実装未着手段階: `spec_created`
- 実装完了 + staging 反映: `implemented-staging`
- production 反映 + 24 時間観測完了: `completed`

## 完了条件

- Task 12-1〜12-6 全ファイル存在
- runbook 存在
- root workflow state が適切なステージに据え置き / 昇格
