# System Spec Update Summary

## Step 1-A: 完了記録

Issue #352 postmortem template automation を `implemented-local / implementation / NON_VISUAL / Phase 13 blocked_pending_user_approval` として同期した。

## Step 1-B: 正本更新

| Path | 更新 |
| --- | --- |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rollback 後 24 時間以内の `pnpm postmortem:generate` 実行と follow-up issue 起票手順への参照を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Issue #352 早見を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory 行を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 行を追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-352-postmortem-template-automation-artifact-inventory.md` | topic-map / keywords から到達可能な artifact inventory を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | Issue #352 同期履歴を追加 |
| `.claude/skills/aiworkflow-requirements/LOGS/20260505-000000-issue-352-postmortem-template-automation.md` | 正本仕様同期ログを確認・維持 |
| `.claude/skills/task-specification-creator/LOGS/20260505-000000-issue-352-postmortem-template-automation.md` | Phase evidence / strict outputs 同期ログを確認・維持 |
| `docs/30-workflows/unassigned-task/task-09c-postmortem-template-automation-001.md` | 昇格先と implemented-local pending PR 状態を記録 |

## Step 1-C: 関連タスク

Slack 通知、GitHub Releases 自動生成、AI 補完は本タスク外。既存または将来タスクの責務であり、本 cycle では CLI / template / runbook / infra runbook link を完了範囲とする。

## Step 2: aiworkflow-requirements

更新必要。正式 workflow 昇格と runbook 入口追加により、SKILL.md / quick-reference / resource-map / task-workflow-active / LOGS fragment を同一 wave で同期した。topic-map / keywords は `node scripts/generate-index.js` で再生成する。
