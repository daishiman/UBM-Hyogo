# 05b-A Auth Mail Env Contract Alignment Lessons (2026-05)

## Scope

Workflow: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`

Task type: `spec_created / docs-only / remaining-only / NON_VISUAL`

## Lessons

### L-05BA-001: Provider-specific env names must not become provisioning contract

- Symptom: manual specs still used `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL` while implementation and aiworkflow SSOT used `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`.
- Cause: provider implementation detail leaked into user-facing provisioning docs.
- Recurrence condition: mail provider changes or a new runbook is written from stale manual spec text.
- 5-minute resolution: grep stale names, classify historical references, then update active tables to the implementation env names.
- Evidence path: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-11/env-name-grep.md`

### L-05BA-002: Secret and Variable placement must be recorded with the env rename

- Symptom: renaming the mail API key alone leaves `MAIL_FROM_ADDRESS` and `AUTH_URL` placement ambiguous.
- Cause: env-name alignment was treated as a string replacement rather than a deployment contract.
- Recurrence condition: Cloudflare Secrets / Variables are provisioned from separate docs.
- 5-minute resolution: record `MAIL_PROVIDER_KEY` as Secret and `MAIL_FROM_ADDRESS` / `AUTH_URL` as Variables in the same wave.
- Evidence path: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-12/implementation-guide.md`

### L-05BA-003: Readiness evidence is not Magic Link smoke PASS

- Symptom: Phase 11 can look complete even when no `POST /auth/magic-link` request or inbox check ran.
- Cause: docs-only env contract tasks can only prove name readiness, not provider delivery.
- Recurrence condition: staging / production credentials need user approval or external state.
- 5-minute resolution: use `secret-list-check.md` and `magic-link-smoke-readiness.md` for readiness, then route real send smoke to 09a/09c.
- Evidence path: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-11/magic-link-smoke-readiness.md`

### L-05BA-004: Phase 12 companion files must be materialized

- Symptom: Phase 12 template listed companion artifacts before all files existed under `outputs/phase-12/`.
- Cause: template content was mistaken for artifact evidence.
- Recurrence condition: close-out tasks are generated from a phase narrative without strict file existence checks.
- 5-minute resolution: create the strict 7 files first, then run `find outputs/phase-12 -maxdepth 1 -type f -name '*.md'`.
- Evidence path: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-12/phase12-task-spec-compliance-check.md`

## Downstream boundaries

- Staging provisioning and real send smoke remain owned by 09a.
- Production readiness and fail-closed runtime verification remain owned by 09c.
- Callback / Credentials provider integration remains owned by 05b-B.
