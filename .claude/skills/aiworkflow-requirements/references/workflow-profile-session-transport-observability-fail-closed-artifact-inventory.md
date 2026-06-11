# Workflow Artifact Inventory — profile-session-transport-observability-fail-closed

| Item | Path |
| --- | --- |
| Workflow root | `docs/30-workflows/profile-session-transport-observability-fail-closed/` |
| Root artifacts | `docs/30-workflows/profile-session-transport-observability-fail-closed/artifacts.json` |
| Output artifacts mirror | `docs/30-workflows/profile-session-transport-observability-fail-closed/outputs/artifacts.json` |
| Phase 11 main | `docs/30-workflows/profile-session-transport-observability-fail-closed/outputs/phase-11/phase-11.md` |
| Phase 11 manual result | `docs/30-workflows/profile-session-transport-observability-fail-closed/outputs/phase-11/manual-test-result.md` |
| Phase 12 main | `docs/30-workflows/profile-session-transport-observability-fail-closed/outputs/phase-12/main.md` |
| Phase 12 compliance | `docs/30-workflows/profile-session-transport-observability-fail-closed/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Code | `apps/web/src/lib/fetch/transport.ts`, `apps/web/src/lib/env.ts`, `apps/web/src/lib/fetch/errors.ts`, `apps/web/src/lib/fetch/authed.ts`, `apps/web/src/lib/server-fetch/safe-fetch.ts`, `apps/web/src/lib/result.ts`, `apps/web/app/api/auth/{gate-state,magic-link,magic-link/verify}/route.ts`, `apps/web/app/api/me/[...path]/route.ts`, `apps/web/src/lib/auth/verify-magic-link.ts`, `scripts/diagnose-profile-session.sh` |
| Tests | `apps/web/src/lib/fetch/transport.spec.ts`, `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts`, `apps/web/src/lib/fetch/authed.spec.ts`, `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`, `apps/web/src/lib/__tests__/env.spec.ts` |
| System specs | `docs/00-getting-started-manual/specs/02-auth.md`, `docs/00-getting-started-manual/specs/13-mvp-auth.md` |

## Status

`implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate`.

The local implementation is complete: server-side API transport now exposes `{ transportKind, baseHost }` diagnostics, `/profile` session fetch failures log those fields through `server_fetch_failed`, and implicit local fallback is blocked when `ENVIRONMENT` is not explicitly one of `local | staging | production` and no service binding / internal base URL is available.

## Evidence

- Focused Vitest: 5 files / 70 tests PASS.
- `bash -n scripts/diagnose-profile-session.sh`: PASS.
- `apps/api` production source unchanged.

## Invariants

- `/me` API path, response shape, status taxonomy, D1 schema, and Google Form schema are unchanged.
- `API_SERVICE` remains the staging / production primary transport. HTTP fallback remains local/test or explicitly configured base URL only.
- `server_fetch_failed` logs host/status/transport metadata only; member identifiers, cookies, tokens, and secrets are not emitted.

## User Gate

Staging deploy, `wrangler tail` confirmation of `server_fetch_failed { transportKind, baseHost, status }`, root-cause remediation after status confirmation, commit, push, and PR remain user-gated.

## Lessons Learned

- **L-PSTO-001（実装仕様書は実装同波で閉じる）**: `implementation / NON_VISUAL` で T01〜T04 が具体実装ファイルまで確定している場合、`spec_created` のままコード実装を後続へ送ると CONST_004 / CONST_005 と衝突する。外部 runtime confirmation は user-gated に残せるが、local code / focused tests / system spec sync は同一 cycle で完了させる。
- **L-PSTO-002（transport observability は error object に載せる）**: `safeServerFetch()` の option を増やすより、`FetchAuthedError` / `ApiTransportError` に診断メタを持たせる方が呼び出し側の責務を増やさず、410/5xx/transport failure の全経路で同じ log shape を保てる。
- **L-PSTO-003（暗黙 local と明示 local を分ける）**: `getEnvironment()` 互換値だけでは ENVIRONMENT 未注入と明示 local を区別できない。`getEnvironmentResolution()` の `{ environment, explicit }` を transport 境界へ渡すことで、local 開発互換と staging/production fail-closed を両立できる。
