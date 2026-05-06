# Skill Feedback Report: 09c-A-production-deploy-execution

判定行: `FEEDBACK_ROUTED`

## テンプレ改善

| item | routing |
| --- | --- |
| Phase 12 strict 7 files は `main.md` に列挙するだけでなく実体配置を必須化する | workflow-local fix applied。skill 側は既に `phase-12-spec.md` で規定済みのため no-op |
| Phase 9 が要求する preflight / redaction / observability / post-deploy healthcheck evidence を Phase 11 manifest に同時反映する | workflow-local fix applied。`artifacts.json` と `outputs/phase-11/main.md` に同期済み。skill 側は既存の Phase 11 evidence manifest ルールで吸収可能なため no-op |

## ワークフロー改善

| item | routing |
| --- | --- |
| implementation workflow で `docs-only` 併記を残すと CONST_004 と矛盾する | workflow-local metadata を `implementation / VISUAL_ON_EXECUTION` に統一 |
| canonical root drift は aiworkflow indexes まで同一 wave で直す | quick-reference / resource-map / task-workflow-active / artifact inventory を補正 |

## ドキュメント改善

| item | routing |
| --- | --- |
| stale deploy command (`pnpm --filter @ubm/* deploy:production`) が source unassigned task に残っていた | `scripts/cf.sh` route へ補正 |
| root-only artifacts parity の文言を実ファイルへ配置する必要があった | compliance check に逐語文言を配置 |
| infrastructure runbook に production execution command / approval gate / 24h threshold の導線が必要だった | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に同 wave 反映済み |
