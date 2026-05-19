# Phase 12 Main

Issue #762 is an implementation / NON_VISUAL workflow that completes pre-support Cloudflare OIDC hardening without changing the live deploy credential path.

Implemented local changes:

- `scripts/oidc/verify-claim-pin.sh`
- `scripts/oidc/__tests__/verify-claim-pin.spec.sh`
- `scripts/redaction-check.sh`
- `scripts/__tests__/redaction-check.test.sh`
- `.github/workflows/oidc-observation-window.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/web-cd.yml`
- `package.json`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md`

Root decision:

- Cloudflare OIDC deploy support remains unconfirmed for this repository on 2026-05-17.
- `web-cd.yml` keeps step-scoped `secrets.CLOUDFLARE_API_TOKEN`.
- `id-token: write`, OIDC exchange, staging proof, production cutover, and token physical revocation stay blocked behind G1-G4.

Four-condition verdict:

| Condition | Verdict | Evidence |
|---|---|---|
| 矛盾なし | PASS | Implementation status, Phase table, actual files, and Phase 12 outputs now agree. |
| 漏れなし | PASS | Declared 5 hardening items and canonical strict 7 Phase 12 files are present. |
| 整合性あり | PASS | `conditional_implementation_with_peripheral_hardening` is used consistently. |
| 依存関係整合 | PASS | G1 -> G2 -> G3 -> G4 is preserved; remote mutation and PR are user-gated. |
