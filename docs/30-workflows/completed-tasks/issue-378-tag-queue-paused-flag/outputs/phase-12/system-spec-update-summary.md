# System Spec Update Summary

## Applied Updates

| File | Update |
| --- | --- |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | Added `TAG_QUEUE_PAUSED` operational guard to tag assignment queue section |
| `docs/00-getting-started-manual/specs/12-search-tags.md` | Added candidate enqueue pause contract and strict parser rule |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | Added `TAG_QUEUE_PAUSED` as a non-secret Cloudflare variable |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Added pause flag to Forms response sync operational contract |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Registered issue #378 implemented-local workflow |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added immediate lookup row for the pause flag |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Registered workflow root and implementation files |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | Added Issue #378 change-history entry |
| `docs/30-workflows/unassigned-task/task-issue-109-tag-queue-pause-flag-001.md` | Marked source unassigned task as consumed by Issue #378 |
| `docs/30-workflows/completed-tasks/issue-109-ut-02a-tag-assignment-queue-management/phase-12.md` | Marked old secret / 503 circuit breaker wording as stale-current |
| `docs/30-workflows/completed-tasks/issue-109-ut-02a-tag-assignment-queue-management/phase-13.md` | Marked old secret / 503 rollback wording as stale-current |

## Boundary

No admin UI toggle was added. The pause path is deploy-gated and documented in `docs/30-workflows/runbooks/tag-queue-pause.md`.

## Stale-current Classification

| Reference | Classification | Current Source |
| --- | --- | --- |
| Older rollback notes that mention a possible `TAG_QUEUE_PAUSED` guard without implementation | stale-current / superseded by Issue #378 | `docs/30-workflows/issue-378-tag-queue-paused-flag/` and `docs/30-workflows/runbooks/tag-queue-pause.md` |
| Any description that treats the pause flag as a secret or admin UI toggle | stale-current / rejected boundary | `TAG_QUEUE_PAUSED` is a non-secret Cloudflare variable and remains deploy-gated |
| Any description that pauses admin queue listing, resolve, reject, retry tick, or `member_tags` guarded resolve writes | stale-current / out of scope | The current contract pauses only Forms sync candidate enqueue |

Current behavior is the strict parser contract documented in the Issue #378 workflow: only lower-case `"true"` pauses enqueue; unset, `"false"`, `"True"`, `"1"`, and other values leave enqueue enabled.
