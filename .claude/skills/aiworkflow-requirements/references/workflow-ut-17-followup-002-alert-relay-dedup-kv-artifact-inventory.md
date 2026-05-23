# Workflow Artifact Inventory: UT-17 Follow-up 002 Alert Relay Dedup KV

## Canonical Workflow

| Artifact | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/` | Canonical successor workflow root |
| `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/artifacts.json` | Root artifact metadata |
| `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/outputs/artifacts.json` | Mirror artifact metadata |
| `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/outputs/phase-12/main.md` | Phase 12 strict 7 aggregate |
| `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv-persistence.md` | Source task, transferred to successor workflow |

## Planned Implementation Artifacts

| Artifact | Role |
| --- | --- |
| `apps/api/src/env.ts` | Adds `ALERT_DEDUP_KV: KVNamespace` binding type |
| `apps/api/src/routes/internal/alert-relay.ts` | Replaces isolate-local `Map` dedup with KV get/put |
| `apps/api/src/index.ts` | Narrows `buildFormsClient` env type after `Env` required binding addition |
| `apps/api/wrangler.toml` | Holds commented staging / production KV namespace binding templates until user-approved namespace creation |
| `apps/api/test/helpers/kv-stub.ts` | Test-only Miniflare-compatible KV stub |
| `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | Canonical focused test path |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | Adds KV healthcheck step |

## State Boundary

Current state is `implemented-local-runtime-pending / implementation / NON_VISUAL`. Code implementation and local evidence are complete. KV namespace creation, real namespace id insertion, deploy, Slack runtime smoke, commit, push, and PR are user-gated.
