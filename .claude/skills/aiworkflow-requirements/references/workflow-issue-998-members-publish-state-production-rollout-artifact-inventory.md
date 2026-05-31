# Artifact Inventory: issue-998-members-publish-state-production-rollout

## Workflow

| Artifact | Path | Status |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/` | active / implemented_local_runtime_pending |
| root artifacts | `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/outputs/artifacts.json` | present |
| Phase 1-13 specs | `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/phase-*.md` | present |
| Task A/B/C specs | `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/tasks/` | present |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/outputs/phase-12/` | present |

## Implementation

| Artifact | Path | Status |
| --- | --- | --- |
| production auto-publish flag | `apps/api/wrangler.toml` | changed: production `MEMBERS_AUTO_PUBLISH_ON_CONSENT="true"` |
| auto-publish policy | `apps/api/src/lib/policies/auto-publish.ts` | reused unchanged |
| Forms sync job | `apps/api/src/jobs/sync-forms-responses.ts` | reused unchanged |
| backfill endpoint | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` | reused unchanged |
| diagnostics endpoint | `apps/api/src/routes/admin/sync-diagnostics.ts` | reused unchanged |
| public members filter | `apps/api/src/repository/publicMembers.ts` | reused unchanged |
| ops scripts | `scripts/diagnose-members-pipeline.sh`, `scripts/backfill-publish-state.sh` | reused unchanged |

## Evidence Boundary

| Artifact | Path | Status |
| --- | --- | --- |
| local regression result | `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/outputs/phase-11/manual-test-result.md` | present after local verification |
| runtime evidence inventory | `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/phase-11-evidence-inventory.md` | Gate-C pending |
| staging/production screenshots and JSON | `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/outputs/phase-11/` | pending user-gated runtime ops |

## Lessons Learned

> 正本: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-998-members-publish-state-production-rollout-2026-05.md`

| ID | 教訓 |
| --- | --- |
| L-I998PROD-001 | Flag 変更と backfill は両輪。config-only では既存 record が昇格しない（dry-run→approval→apply の 3 段直列） |
| L-I998PROD-002 | D1 backup は apply 前に取得しコミット対象外に保管（`cf.sh d1 export`、path のみ記録） |
| L-I998PROD-003 | backfill は admin override（`publish_state='hidden'`）を上書きしない保証が最優先（`skipped.adminExplicit` 確認 + spot check） |
| L-I998PROD-004 | staging 実績比で candidates が乖離したら apply 中止 → user escalate（10〜20% 乖離で中止） |
| L-I998PROD-005 | deploy 前に rollback 手順を用意（version id 控え + `cf.sh rollback <VERSION_ID>`） |
| L-I998PROD-006 | evidence 保存後に secret redaction grep を必須実行（`SYNC_ADMIN_TOKEN` / `CLOUDFLARE_API_TOKEN` ゼロ件） |
| L-I998PROD-007 | Issue #998 は CLOSED 維持、PR 文脈は `Refs #998` のみ。reopen 禁止 |

## User-Gated Items

Cloudflare staging deploy, staging backfill apply, production D1 backup, production deploy, production backfill apply, `/members` browser smoke screenshots, commit, push, and PR remain user-gated. Issue #998 is CLOSED and remains `Refs #998` only.
