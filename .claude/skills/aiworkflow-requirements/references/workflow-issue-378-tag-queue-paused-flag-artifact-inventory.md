# Workflow Artifact Inventory: Issue #378 Tag Queue Paused Flag

## Summary

Issue #378 tag queue paused flag is `implemented-local / implementation / NON_VISUAL / Phase 12 strict outputs present / Phase 13 pending_user_approval`.

The workflow adds a non-secret Cloudflare variable `TAG_QUEUE_PAUSED` that pauses only Forms sync candidate enqueue into `tag_assignment_queue`. It does not pause admin queue listing, resolve, reject, retry tick, or guarded `member_tags` writes. It is not a secret and is not an admin UI toggle.

## Canonical Workflow

- Workflow root: `docs/30-workflows/completed-tasks/issue-378-tag-queue-paused-flag/`
- Source unassigned task (consumed): `docs/30-workflows/completed-tasks/task-issue-109-tag-queue-pause-flag-001.md`
- Runbook: `docs/30-workflows/runbooks/tag-queue-pause.md`
- Parent context (stale-current sections marked): `docs/30-workflows/completed-tasks/issue-109-ut-02a-tag-assignment-queue-management/phase-12.md` / `phase-13.md`

## Implementation Artifacts

- Worker env type: `apps/api/src/env.ts` — adds `TAG_QUEUE_PAUSED?: string`
- Worker variable defaults: `apps/api/wrangler.toml` — root / production / staging vars set `TAG_QUEUE_PAUSED = "false"`
- Strict parser + early guard: `apps/api/src/workflows/tagCandidateEnqueue.ts` — `parsePaused()`, `paused` reason on result, structured log `UBM-TAGQ-PAUSED`
- Boolean propagation: `apps/api/src/jobs/sync-forms-responses.ts` — parses env once and passes boolean through `processResponse` options
- Tests: `apps/api/src/workflows/tagCandidateEnqueue.test.ts` — unset / `"false"` / `"true"` / `"True"` / `"1"` / numeric / structured log / D1 non-call cases
- Test fixture sync: `apps/api/src/jobs/sync-forms-responses.test.ts` — propagates pause boolean via job options

## Runtime Contract

- `TAG_QUEUE_PAUSED` is a Cloudflare Worker variable (non-secret), deploy-gated only.
- Strict parser: only lower-case `"true"` pauses enqueue; unset, `"false"`, `"True"`, `"1"`, `"yes"`, and any other value leave enqueue enabled.
- When paused, `enqueueTagCandidate` returns `{ enqueued: false, reason: "paused" }` before any D1 read or write.
- Structured log: code `UBM-TAGQ-PAUSED` with `reason: "paused"` context.
- Existing queue rows remain resolvable; retry tick continues; admin operations are unaffected.

## Evidence

- Phase 12 main: `docs/30-workflows/completed-tasks/issue-378-tag-queue-paused-flag/outputs/phase-12/main.md`
- Implementation guide: `outputs/phase-12/implementation-guide.md`
- Compliance check: `outputs/phase-12/phase12-task-spec-compliance-check.md` (8 items + 4 conditions PASS)
- System spec update summary: `outputs/phase-12/system-spec-update-summary.md`
- Documentation changelog: `outputs/phase-12/documentation-changelog.md`
- Skill feedback report: `outputs/phase-12/skill-feedback-report.md` (no skill definition change required)
- Unassigned task detection: `outputs/phase-12/unassigned-task-detection.md` (zero follow-up candidates)
- Phase 11 evidence: `outputs/phase-11/main.md` / `manual-smoke-log.md` / `non-visual-evidence.md` / `link-checklist.md`

## System Spec Sync

- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/12-search-tags.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260506-issue378-tag-queue-paused-flag.md`
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-378-tag-queue-paused-flag-2026-05.md`

## Invariants

- Invariant #5 (D1 access stays in `apps/api`) intact.
- Invariant #13 (`tag_definitions` is read-only master; `member_tags` write is only via resolve) intact — this task does not write to `member_tags`.
- Existing queue rows remain resolvable while candidate enqueue is paused.
