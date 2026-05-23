# Artifact Inventory — task-03-w2-par-sentry-workers-sdk-unify

## canonical root

`docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/`

## root artifacts

| artifact | status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `outputs/artifacts.json` | present |
| `phase-01.md` ... `phase-13.md` | present |

## phase 11 evidence

| artifact | status |
| --- | --- |
| `outputs/phase-11/main.md` | present |
| `outputs/phase-11/evidence/typecheck.log` | PASS_BOUNDARY local |
| `outputs/phase-11/evidence/lint.log` | PASS_BOUNDARY local |
| `outputs/phase-11/evidence/test.log` | PASS_BOUNDARY local |
| `outputs/phase-11/evidence/build.log` | PASS_BOUNDARY local |
| `outputs/phase-11/evidence/grep-gate.log` | G-1b: `@sentry/nextjs` 推移混入なし |
| `outputs/phase-11/evidence/runtime-smoke-log.md` | RUNTIME_PENDING_USER_APPROVAL template |

## phase 12 required artifacts

| artifact | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present (no-op + DoD trace) |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## phase 13 reserved artifacts

| artifact | status |
| --- | --- |
| `outputs/phase-13/main.md` | reserved (commit/push/PR pending user approval) |

## implementation artifacts

| artifact | role |
| --- | --- |
| `apps/web/src/instrumentation.ts` | server entry — `@sentry/cloudflare` register |
| `apps/web/src/instrumentation-client.ts` | browser entry — `@sentry/nextjs` register |
| `apps/web/src/lib/sentry/` | capture wrapper (`captureException` / `captureMessage` / `register`) |
| `apps/web/src/lib/env.ts` | `getEnv()` helper — Cloudflare binding 優先 / `process.env` fallback |
| `apps/web/src/__tests__/instrumentation.runtime.spec.ts` | server init contract test |
| `apps/web/src/__tests__/instrumentation-client.runtime.spec.ts` | browser init contract test |
| `apps/web/src/lib/__tests__/sentry-capture.spec.ts` | capture wrapper fail-soft test |
| `apps/web/open-next.config.ts` | OpenNext build adjustment for instrumentation injection |
| `scripts/patch-next-standalone-instrumentation.mjs` | post-build patch for standalone bundle instrumentation hook |
| `apps/web/package.json` | `@sentry/cloudflare` / `@sentry/nextjs` dependency split |

## env / secret contract

| key | scope | storage |
| --- | --- | --- |
| `SENTRY_DSN_WEB` | server (Workers binding) | Cloudflare Secret (`bash scripts/cf.sh secret put`) |
| `NEXT_PUBLIC_SENTRY_DSN` | browser (build-time inline) | GitHub Variable (public, non-secret) |
| `SENTRY_ENVIRONMENT` | server tag | Cloudflare var |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | browser tag | GitHub Variable |
| `SENTRY_TRACES_SAMPLE_RATE` | both | env var |

## same-wave skill sync

| target | file | state |
| --- | --- | --- |
| references / task-workflow | `references/task-workflow-active.md` | task-03 row added (canonical root / state / runtime boundary) |
| references / lessons | `references/lessons-learned-task-03-w2-par-sentry-workers-sdk-unify-2026-05.md` | L-T03-001 .. L-T03-005 |
| references / artifact inventory | this file | created |
| indexes / quick-reference | `indexes/quick-reference.md` | task-03 quick path added |
| indexes / resource-map | `indexes/resource-map.md` | task-03 canonical row added |
| indexes / topic-map + keywords.json | regenerated | `pnpm indexes:rebuild` (post-edit) |
| changelog | `changelog/20260507-task-03-sentry-workers-sdk-unify.md` | wave entry added |
| LOGS | `LOGS/<fragment>.md` | append via `pnpm skill:logs:append` |

## state classification

`workflow_state = implemented-local`
`pass_boundary = PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
`runtime_promotion = pending implementation follow-up wave (deploy + Sentry event reception)`
