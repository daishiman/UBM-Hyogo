# 2026-05-25 issue-899 static bearer fallback retirement spec

Registered `docs/30-workflows/completed-tasks/issue-899-static-bearer-fallback-retirement/` as
`spec_created / implementation / NON_VISUAL / implementation_pending`.

The workflow specifies the post-#916 retirement of static staging runtime smoke
bearers:

- Remove `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` job.env fallback from `.github/workflows/runtime-smoke-staging.yml`.
- Make the mint step mandatory with an explicit `STAGING_AUTH_SECRET` fail-fast guard.
- Remove the `static-fallback` mask branch and restore freshness hard-fail by deleting `RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'`.
- Update the secret provisioning runbook and bearer lifecycle SSOT in the same implementation PR.
- Physically delete the static GitHub Environment secrets only after minted-only smoke is green.

Same-wave sync:

- Added root/output artifacts parity.
- Added aiworkflow artifact inventory.
- Added task-workflow-active, quick-reference, resource-map, SKILL-changelog, and LOGS entries.
- Added 30-method compact evidence in Phase 12 compliance.

Implementation PR, runtime smoke rerun, `gh secret delete`, commit, push, and PR are user-gated. #916 remains the prerequisite for merge.
