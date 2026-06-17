# workflow-issue-1189-deleted-member-410-guidance-and-restore artifact inventory

## Classification

`implemented_local_evidence_captured / implementation / VISUAL / local_static_visual_present_staging_visual_pending_user_gate`

## Workflow Root

`docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/`

## Implementation Files

| Path | Role |
| --- | --- |
| `apps/web/app/(member)/profile/_lib/session-error-display.ts` | Maps `MEMBER_SESSION_410` to deleted-member title/detail and top-page CTA, with no retry link |
| `apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts` | C1 unit expectations |
| `apps/web/app/(member)/profile/page.spec.tsx` | C1 server component render regression |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | Adds deleted-member restore action using existing `useAdminMutation` path |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx` | C2 focused tests through real hook + fetch mock |

## Evidence

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"
```

Result: PASS, 3 files / 24 tests.

Local static visual contract screenshots (present):

- `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/outputs/phase-11/screenshots/profile-410-deleted-guidance.png`
- `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/outputs/phase-11/screenshots/admin-member-drawer-restore-button.png`
- `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/outputs/phase-11/screenshots/admin-member-drawer-after-restore.png`
- `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/outputs/phase-11/screenshots/phase11-capture-metadata.json`

## Invariants

- `apps/api` production source unchanged.
- D1 schema and Google Form schema unchanged.
- Existing restore endpoint contract remains the source of truth.
- General member self-restore is out of scope by product decision; admin restore is the formal recovery path.
- Staging D1 mutation, authenticated runtime screenshots, commit, push, PR, and Issue mutation remain user-gated.

## Lessons Learned

- L-I1189-001: If local implementation lands after spec authoring, remove `spec_created` / future implementation wording from index, Phase 11, and Phase 12 in the same wave.
- L-I1189-002: For UI wiring over an existing mutation hook, mock network I/O rather than the hook when validating hook-owned error and in-flight behavior.
- L-I1189-003: VISUAL tasks can be `implemented_local_evidence_captured` while staging authenticated screenshots remain `pending_user_gate`; if local static visual screenshots can be produced without external mutation, capture them in the same cycle and record local visual evidence separately from staging runtime evidence.
