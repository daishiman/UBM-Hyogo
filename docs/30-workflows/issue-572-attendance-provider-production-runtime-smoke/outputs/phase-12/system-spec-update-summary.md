# Phase 12 System Spec Update Summary

## Updated Canonical Surfaces

| Surface | Update |
| --- | --- |
| Runtime smoke code | `apps/api/scripts/runtime-smoke/run-smoke.sh` を Issue #572 の正本 runner として追加 |
| Redaction | `scripts/lib/redaction.sh` に production cookie / Cloudflare / OAuth / email / name redaction を追加 |
| Runbook | `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` を追加 |
| Workflow inventory | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` に Issue #572 行を追加 |
| Quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` に Issue #572 早見を追加 |
| Resource map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` に Issue #572 逆引きを追加 |
| Topic map / keywords | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` と `keywords.json` に runtime-smoke / issue-572 導線を追加 |
| Skill changelog / LOGS | `.claude/skills/aiworkflow-requirements/SKILL.md` と `LOGS/_legacy.md` に同期履歴を追加 |

## State Vocabulary

| Layer | State |
| --- | --- |
| Issue #572 local implementation | `implemented-local / implementation / NON_VISUAL / production runtime pending_user_gate` |
| Issue #371 before production smoke | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| Issue #371 after approved production smoke | `PASS_RUNTIME_VERIFIED / completed` |

`PASS` 単独表記は runtime evidence 状態として使わない。

## Index Rebuild

`pnpm indexes:rebuild` equivalent sync is represented by the manual same-wave edits above. Validation is recorded by `jq -e .claude/skills/aiworkflow-requirements/indexes/keywords.json` and grep checks in the final review output.

## Related Issues

Issue #531, #371, #571, and #572 are treated as CLOSED issue records. This workflow does not reopen or close GitHub issues.
