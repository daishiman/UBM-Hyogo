## Summary

- Materialize the 09c output artifacts referenced by `index.md` and root `artifacts.json`.
- Define the 13-step Cloudflare production deploy runbook for `ubm-hyogo-web`, `ubm-hyogo-api`, and `ubm_hyogo_production`.
- Define production D1 migration checks, required secret presence checks, API/web deploy checks, 10-route smoke, manual sync, release tag, incident runbook sharing, and 24h verification templates.
- Define rollback procedures for Worker, Pages, D1 migration recovery, cron pause, and release tag replacement.
- Keep runtime evidence explicitly pending; production PASS is not asserted by these templates.

## Test Plan

- [ ] `pnpm lint` exit 0
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test` exit 0
- [ ] `pnpm build` exit 0
- [ ] Phase 10 approval gate recorded
- [ ] Phase 11 approval gate recorded before production operations
- [ ] `outputs/phase-11/production-smoke-runbook.md` filled with runtime results
- [ ] `outputs/phase-11/release-tag-evidence.md` filled with tag and commit evidence
- [ ] `outputs/phase-11/share-evidence.md` filled with delivery and receipt evidence
- [ ] 24h Cloudflare metrics captured and linked from `outputs/phase-12/post-release-summary.md`
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` updated from pending runtime evidence to actual runtime judgments only after evidence exists

## AC

- AC-1 to AC-12 are traced in `outputs/phase-07/ac-matrix.md`.
- Current state is spec template completeness, not runtime PASS.

## Invariants Compliance

- Spec coverage is defined for invariants #1 to #15.
- Runtime evidence remains pending for all invariants until Phase 11 production evidence is collected.

## Approval Gates

- Phase 10: pending_user_approval
- Phase 11: pending_user_approval
- Phase 13: pending_user_approval

## Related

- depends_on: 09a / 09b
- blocks: none
- execution mode: serial final Wave 9 gate

## Post-Release Follow-Up

- 1-week and 1-month production trend review
- optional automation for Cloudflare 24h metrics
- optional GitHub Releases automation from release tags
