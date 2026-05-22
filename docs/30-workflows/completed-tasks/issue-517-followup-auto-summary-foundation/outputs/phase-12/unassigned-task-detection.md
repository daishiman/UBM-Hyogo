# Unassigned Task Detection

Detected new tasks: 2.

## 新規未タスク一覧

| # | パス | 概要 |
| --- | --- | --- |
| 1 | `docs/30-workflows/unassigned-task/task-issue-517-slack-bootstrap-001.md` | Slack channel `w1618436027-ek2505248` の作成、Incoming Webhook 取得、1Password 正本化、GitHub Secret `SLACK_WEBHOOK_URL` への登録までの user-gated bootstrap 作業を未タスクとして切り出す。 |
| 2 | `docs/30-workflows/unassigned-task/task-issue-517-30day-runtime-evidence-001.md` | 30 day gate（schedule-only / 30 schedule days / `missing_schedule_gap_days = 0`）が production 環境で実際に gate を通過した runtime evidence（実行ログ・成果物・Slack post 履歴）を 30 日継続で収集・確認する未タスクを切り出す。 |

## 検出根拠

- Phase-12 監査の途中で、Slack channel bootstrap が **user-gated 残作業** として明示された（`task-specification-creator/references/phase-11-guide.md` の preflight に記述済み）。本タスク本体では Slack App / Bot OAuth を out of scope とし、Incoming Webhook 経由のみを採用したため、外部 channel 作成・webhook 取得・secret 配備は人間オペレーション側に閉じる必要がある。これを「現在タスクの外」かつ「将来確実に必要」な単独責務として独立タスク化した。
- 30 day gate は仕様（`deployment-gha.md`）として導入済みだが、実際に schedule run のみで 30 日連続で gate を通過したことを確認する **runtime evidence** は本タスクの完了範囲外である。production 環境で 30 日経過後に観測する必要があるため、時間軸が分離する独立タスクとして切り出した。

Skill feedback handling:

- External channel / secret preflight guidance was applied directly to `.claude/skills/task-specification-creator/references/phase-11-guide.md` in this cycle.
- No skill follow-up backlog item is needed for that finding.

Explicitly out of scope:

| Candidate | Reason | Trigger For Future Task |
| --- | --- | --- |
| Slack App / Bot OAuth | Incoming Webhook is enough for this task | Interactive Slack operation becomes required |
| Automatic Slack channel creation | Requires Slack API app scope and adds unnecessary complexity | Multiple automated channels are needed |
| Retry / alert implementation | Current task only adds PR body recommendation when failure rate is high | Three consecutive production summaries show failure rate >= 10% |
| Generic N day framework | Issue #517 is issue-497 specific | Another workflow requires the same pattern |

No backlog issue was created because none of these are required to satisfy the current cycle.
