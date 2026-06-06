# staging-api-url-and-session-recovery artifact inventory

| item | value |
|------|-------|
| workflow root | `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| purpose | Recover staging session retrieval and eradicate client localhost API fallback by routing apps/web server-side API calls through `API_SERVICE`, prioritizing `NEXT_PUBLIC_API_BASE_URL`, and adding secret/gate/smoke scripts. |
| user-gated | commit, push, PR, Cloudflare `AUTH_SECRET` mutation, staging deploy, authenticated staging runtime smoke |

## Implementation artifacts

| Area | Paths |
|------|-------|
| transport/env | `apps/web/src/lib/fetch/transport.ts`, `apps/web/src/lib/fetch/authed.ts`, `apps/web/src/lib/fetch/public.ts`, `apps/web/src/lib/env.ts` |
| proxy/auth routes | `apps/web/app/api/me/[...path]/route.ts`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/app/api/auth/magic-link/route.ts`, `apps/web/app/api/auth/magic-link/verify/route.ts`, `apps/web/app/api/auth/gate-state/route.ts`, `apps/web/src/lib/auth/verify-magic-link.ts` |
| operation gates | `scripts/verify-no-localhost-bake.sh`, `scripts/diagnose-auth-secret-parity.sh`, `scripts/cf-secret-put-auth-secret.sh`, `scripts/smoke-staging-me.sh`, `.github/workflows/verify-no-localhost-bake.yml` |
| tests | `apps/web/src/lib/fetch/transport.spec.ts`, `apps/web/src/lib/fetch/authed.spec.ts`, `apps/web/src/lib/fetch/public.spec.ts`, `apps/web/src/lib/__tests__/env.spec.ts`, route specs, `scripts/verify-no-localhost-bake.spec.ts` |

## Local evidence

| Command | Result |
|---------|--------|
| focused Vitest for transport/env/proxy/auth/gate | PASS: 10 files / 94 tests |
| `bash scripts/verify-no-localhost-bake.sh --src-only` | PASS |
| `mise exec -- pnpm typecheck` | PASS |

## Lessons

- L-SASR-001: Same-account Workers `*.workers.dev` server-side loopback should use Service Binding first; HTTP fallback is local/test only.
- L-SASR-002: Client bundle API base must use `NEXT_PUBLIC_API_BASE_URL`; non-prefixed `PUBLIC_API_BASE_URL` is server-only compatibility.
- L-SASR-003: Localhost API fallback literals require explicit `localhost-allow:local-fallback`; bundle/source grep gate fails all other occurrences.
- L-SASR-004: `AUTH_SECRET` parity is name/presence-only via `secret list`; usability is proven by authenticated `/api/me` 200 smoke without exposing values.
