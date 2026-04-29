# System Spec Update Summary — 05a

本タスクで確定した設計を aiworkflow-requirements 正本へ反映した記録。

| spec | 反映内容 | 理由 | 状態 |
| --- | --- | --- | --- |
| `references/api-endpoints.md` | `GET /auth/session-resolve`、`gateReason`、共有 HS256 JWT、admin API `requireAdmin` 認可境界を追記 | 後続 05b / 06b / 06c / 08a が参照する API 正本 | 完了 |
| `references/task-workflow-active.md` | 05a completed 行を追加し、04c の旧認可記述を current facts へ更新 | workflow ledger と実装状態の整合 | 完了 |
| `indexes/quick-reference.md` | Auth.js Google OAuth / Admin Gate 早見を追加 | 後続エージェントの導線 | 完了 |
| `indexes/resource-map.md` | 05a canonical task root と主要実装ファイルを登録 | resource-map から 05a 成果物へ到達可能にする | 完了 |
| `SKILL.md` | 05a close-out sync の変更履歴を追加 | 正本仕様 skill の履歴整合 | 完了 |

## 反映しない判断

`doc/00-getting-started-manual/specs/*.md` は本ワークツリーの正本導線外であり、現行の aiworkflow-requirements 正本は `.claude/skills/aiworkflow-requirements/references/` と `indexes/`。そのため同じ内容を二重管理せず、上記 5 ファイルに集約した。
