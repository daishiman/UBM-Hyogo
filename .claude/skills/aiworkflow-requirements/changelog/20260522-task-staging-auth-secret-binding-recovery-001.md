# 2026-05-22 task-staging-auth-secret-binding-recovery-001

Registered `task-staging-auth-secret-binding-recovery-001` as
`implemented_local_runtime_pending / implementation / NON_VISUAL`.

Local implementation:

- `require-admin.ts` emits `UBM-AUTH-SECRET-MISSING` when `AUTH_SECRET` is missing or blank.
- `env.ts` exposes a narrow `validateAuthSecretEnv()` zod contract.
- `runtime-attendance-provider.sh` records `auth-secret-binding-missing` for `{"error":"auth misconfigured"}` bodies.
- `cf.sh secret put` rejects empty stdin and supports non-empty local dry-run.

Runtime operations remain user-gated: Cloudflare secret reinjection, staging and
production curl evidence, backend-ci rerun, commit, push, and PR.

