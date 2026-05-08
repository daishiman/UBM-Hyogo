# 2026-05-07 UI prototype alignment scope gate

## Summary

UI prototype alignment / MVP recovery の task-01 scope gate を aiworkflow-requirements に同期した。
同日 task-07 prototype mapping table も同一 recovery wave の docs-only / NON_VISUAL 正本として同期した。

## Synced Facts

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-01-w1-solo-scope-gate-all-screens/` |
| status | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| scope SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` |
| routes | 19 routes（公開 6 / 会員 2 / 管理 8 / 共通 3） |
| runtime boundary | apps/packages code diff 0。新 endpoint / D1 schema / Google Form 変更なし |
| visual evidence | NON_VISUAL。screenshot 不要 |
| archive hygiene | 5 dir を `docs/30-workflows/completed-tasks/` へ archive し、純削除 blocker は解消済み |

| task-07 item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-07-prototype-mapping-table/` |
| artifact | `docs/00-getting-started-manual/specs/09a-prototype-map.md` |
| aiworkflow reference | `references/ui-ux-prototype-map.md` |
| inventory | `references/workflow-task-07-prototype-mapping-table-artifact-inventory.md` |
| 苦戦箇所 | `lessons-learned/lessons-learned-task-07-prototype-mapping-table-2026-05.md` |
| verifier | `scripts/verify-09a-prototype-line-ranges.sh` |
| synced facts | 13+ primitives, 19 routes, shell/chrome, 09c-09h source mapping, EDITMODE rejection list |

## Updated Indexes

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/ui-ux-prototype-map.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## Verification

- `mise exec -- pnpm lint` exit 0
- route count evidence: `outputs/phase-11/manual-smoke-log.md`
- Phase 12 compliance: `outputs/phase-12/phase12-task-spec-compliance-check.md`
