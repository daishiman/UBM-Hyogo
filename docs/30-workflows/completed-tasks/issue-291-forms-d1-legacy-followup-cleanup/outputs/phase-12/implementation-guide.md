# Forms D1 Legacy Follow-Up Cleanup - Implementation Guide

## Part 1: Concept

### Why this cleanup was needed

Old documents still described the former data path as if it were the current one. That is risky because a new implementer could follow the old route and add work to the wrong place.

For example, it is like a library shelf labeled "latest edition" that still contains an old book. People will trust the shelf label unless the old book is clearly marked as historical.

### What changed

- Current guidance now points to Google Forms API, split sync routes, and the `sync_jobs` ledger.
- Old Google Sheets API, single `/admin/sync`, and `sync_audit` references are marked as historical or superseded instead of current.
- Related tasks now point back to the legacy umbrella and this cleanup workflow, so readers can trace why the old route was retired.

### Visual evidence

This workflow is NON_VISUAL. There is no UI or UX change, so screenshots are not required. Phase 11 uses text evidence instead:

- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/rg-before-after.md`

## Part 2: Technical Details

### Current contract

| Area | Current value |
| --- | --- |
| Provider | Google Forms API |
| Admin sync routes | `POST /admin/sync/schema`, `POST /admin/sync/responses` |
| Ledger | `sync_jobs` |
| Secret | `GOOGLE_SERVICE_ACCOUNT_JSON` for Forms API, `SYNC_ADMIN_TOKEN` for split sync endpoints |
| Issue wording | `Refs #291` only. Do not use `Closes #291` because the issue is already closed. |

### Target delta applied in this wave

| File | Change |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | Current admin sync table now keeps only schema/responses routes; legacy single sync routes are historical. |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `GOOGLE_SERVICE_ACCOUNT_JSON` and `SYNC_ADMIN_TOKEN` descriptions now point to Forms split sync; Sheets env names are legacy. |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Cloudflare sync guidance now names Forms split sync and `sync_jobs`; Sheets path is historical. |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Secret ownership now describes current Forms use and old Sheets use separately. |
| `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | Admin sync architecture now uses Forms API, split endpoints, and `sync_jobs`. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md` | Legacy `sync_audit` follow-ups are marked superseded. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 04c / 09b ledger fallback backlinks and Issue #291 workflow row are recorded. |

### Verification commands

```bash
git status --porcelain -- apps/ packages/
git diff --name-only main...HEAD -- 'apps/**' 'packages/**'
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" .claude/skills/aiworkflow-requirements/references
cmp -s docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/artifacts.json docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/artifacts.json
```

### Edge cases

| Case | Handling |
| --- | --- |
| Historical documents still mention Sheets or `sync_audit` | Keep them when they are clearly historical; do not delete lessons-learned evidence. |
| A referenced workflow root is absent from this worktree | Use `task-workflow-active.md` as ledger fallback and state that the physical root is absent. |
| Closed GitHub issue wording | Use `Refs #291`; avoid close keywords. |
| Runtime code expectation | No `apps/` or `packages/` diff is expected for this docs-only cleanup. If such diff appears, reclassify before close-out. |

### Settings and constants

| Item | Value |
| --- | --- |
| `visualEvidence` | `NON_VISUAL` |
| `taskType` | `docs-only` |
| `workflow_state` | `implemented_local` for this local documentation cleanup wave |
| PR gate | Phase 13 remains blocked until explicit user approval |
