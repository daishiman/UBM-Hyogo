# Phase 11: manual smoke log

## Local automated evidence

| Command | Result |
|---------|--------|
| `mise exec -- pnpm exec vitest run ... scripts/verify-no-localhost-bake.spec.ts` | PASS: 10 files / 94 tests |
| `bash scripts/verify-no-localhost-bake.sh --src-only` | PASS after explicit local fallback allowlist |
| `mise exec -- pnpm typecheck` | PASS |

## User-gated runtime evidence

| Runtime check | State | Reason |
|---------------|-------|--------|
| `scripts/smoke-staging-me.sh` against authenticated staging | pending_user_gate | Requires real staging auth cookie/bearer and deployed worker state |
| `cf-secret-put-auth-secret.sh` actual secret write | pending_user_gate | Cloudflare secret mutation |

No screenshot is required for the local close-out because this is NON_VISUAL.
