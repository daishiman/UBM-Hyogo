# System Spec Update Summary — Issue #587

## Step 1-A: 完了タスク記録

| 同期先 | 追記内容 |
| --- | --- |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/index.md` | Phase 完了状況 = `implemented_local_runtime_pending` |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 1 行: canonical absolute path + `state: implemented_local_runtime_pending` |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | 同上 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | Issue #587 sync target を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` / `keywords.json` | Issue #587 の検索導線を追加 |

## Step 1-B: 実装状況テーブル

`workflow_state = implemented_local_runtime_pending` に再分類。Issue #587 / #549 は CLOSED 維持で、open/close 操作は行わない。`Refs #549, #587` で連携。

## Step 1-C: 関連タスクテーブル

| 関連タスク | status |
| --- | --- |
| 親 #549 production switch | `pass_runtime_synced` または `completed`（実状態確認） |
| 上位親 #515 | `completed` |
| FU-03-C #548 offline replay | `external_dependency` |
| #587 本タスク | `implemented_local_runtime_pending` |
| 次世代 model 学習 | `unassigned`（Task 4 起票） |
| 自動 rotation スケジューラ | `unassigned`（Task 4 起票） |

## Step 1-D: runbook 差分追記タイミング

`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` への rotation セクション追記は `same-wave`（spec として記述。本体 runbook は `docs/30-workflows/runbooks/ml-model-artifact-rotation.md`）。

## Step 1-H: skill feedback routing

skill-feedback-report.md 参照。

## Step 2: 新規インターフェース追加（適用）

| 同期先 | 追記内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | rotation telemetry / canary evidence schema（4 段） |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `CF_AUDIT_ML_MODEL_PATH_CANDIDATE` / `CF_AUDIT_ML_MODEL_PATH_PREVIOUS` の field 名（実値非記載） |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rotation セクション + 本体 runbook 相互リンク |

## artifacts.json parity 文言

> root `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。本サイクルでは scripts / canary workflow / local evidence を実装済みとして root + outputs に同値で配置する。
