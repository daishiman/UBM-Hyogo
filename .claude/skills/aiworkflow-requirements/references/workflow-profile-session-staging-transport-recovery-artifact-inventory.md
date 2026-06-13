# workflow-profile-session-staging-transport-recovery artifact inventory

## Metadata

| Field | Value |
| --- | --- |
| workflow | `profile-session-staging-transport-recovery` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| canonical root | `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/` |
| date | 2026-06-12 |

## Summary

Staging `/profile` の `MEMBER_SESSION_FAILED` transport failure を local 実装で多層防御化した。`getAuthEnv` は field-tolerant にし、API transport は service-binding → internal URL → public URL の chain fallback を GET/HEAD の transport throw に限定して実行する。HTTP error Response、`/me` path/shape/status、apps/api、D1 schema、Google Form、`/profile` UI 文言は不変。

## Implemented Targets

| Area | Files |
| --- | --- |
| env / transport | `apps/web/src/lib/env.ts`, `apps/web/src/lib/fetch/transport.ts`, `apps/web/src/lib/fetch/authed.ts`, `apps/web/src/lib/server-fetch/safe-fetch.ts`, `apps/web/app/api/me/[...path]/route.ts` |
| diagnostics | `scripts/diagnose-profile-session.sh` |
| focused tests | `apps/web/src/lib/__tests__/env.spec.ts`, `apps/web/src/lib/fetch/transport.spec.ts`, `apps/web/src/lib/fetch/authed.spec.ts`, `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`, `apps/web/app/(member)/profile/page.spec.tsx` |
| workflow package | `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/**` |

## Evidence

| Evidence | Result |
| --- | --- |
| focused Vitest | `apps/web/src/lib/__tests__/env.spec.ts`, `apps/web/src/lib/fetch/transport.spec.ts`, `apps/web/src/lib/fetch/authed.spec.ts`, `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`, `apps/web/app/(member)/profile/page.spec.tsx`: 5 files / 72 tests PASS |
| diagnose syntax | `bash -n scripts/diagnose-profile-session.sh` PASS |
| diagnose dry run | unreachable web/API hosts return `web_api_me_status=000`, `api_me_status=000`, `candidate=dual_transport_failure` without secret output |
| artifacts parity | `cmp -s docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/artifacts.json docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/outputs/artifacts.json` exit 0 |

## User-Gated Boundary

Staging deploy, authenticated `/profile` recovery screenshot, Cloudflare tail based S1-S4 final sub-cause confirmation, commit, push, and PR are user-gated. If RT-D confirms S3, the formalized backlog item is `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/unassigned-task/task-api-worker-hard-error-root-fix.md`.

## Lessons Learned

- L-PSTR-001: `getAuthEnv` for auth/server transport must not be all-or-nothing; parse field-by-field and warn only key names for dropped invalid fields.
- L-PSTR-002: Worker-to-worker session fetch can recover from transport throw with ordered fallback, but only for GET/HEAD and never for HTTP error Response.
- L-PSTR-003: Staging diagnosis must probe the web proxy route and API direct route separately; web `/me` is not the actual Next.js proxy path.
- L-PSTR-004: A partial focused-test run that reports green hides failures in unexecuted specs; an earlier "3 files / 52 tests PASS" claim missed a safe-fetch.spec T01 transport-log integration failure because the spec defines 5 files / 72 tests. Always reconcile reported N files / M tests against the spec-defined set before accepting a PASS.
- L-PSTR-005: Sub-cause discrimination (S1-S4) from logs alone is only possible because `ApiTransportError` / `describeTransport` carry `transportKind` x `baseHost` x message as structured PII-free attributes; fixing this exclusive decision flow at spec time (Phase 11 RT-D) removes guesswork from staging runtime verification.
