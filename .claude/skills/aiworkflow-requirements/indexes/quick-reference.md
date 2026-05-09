# クイックリファレンス

> 最重要情報への即時アクセス
> 詳細は resource-map.md → 該当ファイル を参照

---

### Issue #577 API full coverage rerun / Miniflare port exhaustion triage（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/` |
| 状態 | `implemented_local_pending_pr / implementation / NON_VISUAL / runtime completed / PR pending_user_approval` |
| parent | Issue #532 CLOSED / `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/` |
| source unassigned | `docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` |
| GitHub Issue | #577 CLOSED（2026-05-08T21:36:04Z）。PR は `Refs #577` で追跡 |
| coverage command | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` |
| evidence | `outputs/phase-11/evidence/{baseline-rerun-*.log,full-coverage-rerun.log,triage-summary.md,env-snapshot.txt}` |
| close-out mode | triage patch adopted: `apps/api/package.json#scripts.test:coverage` に `--maxWorkers=1 --minWorkers=1` を追加、post-patch 133/133 PASS / 0 EADDRNOTAVAIL |
| guardrail | `coverage-guard.sh` no-op is not full coverage PASS; Issue #532 remains `Refs #532` only |
| boundary | runtime rerun and Issue #532 evidence sync are completed locally; commit, push, PR are user-gated |

### Issue #554 audit-correlation required status check（2026-05-08）
### Issue #559 Sentry Staging Runtime Evidence（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-559-task-03-followup-001-sentry-staging-runtime-evidence/` |
| 状態 | `spec_created / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| parent canonical | `docs/30-workflows/completed-tasks/task-03-w2-par-sentry-workers-sdk-unify/` |
| parent source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` |
| scope | parent task-03 の staging runtime evidence（Cloudflare secret placement、staging deploy、curl 200、Sentry server/browser event、OpenNext worker grep gate） |
| local evidence | `outputs/phase-11/main.md`, `outputs/phase-11/evidence/preflight-g0.log`, `grep-gate-runtime.log`, `dsn-leak-scan.log` |
| deferred evidence | `secret-list-staging.log`, `deploy-staging.log`, `curl-staging.log`, `sentry-staging-server-event.png`, `sentry-staging-browser-event.png` |
| blocker | 1Password `UBM-Hyogo` vault / `Sentry Web DSN (staging|production)` item 未 provisioning |
| follow-up | `docs/30-workflows/unassigned-task/task-issue-559-sentry-project-1password-dsn-provisioning-001.md` |
| inventory | `references/workflow-issue-559-task-03-followup-001-sentry-staging-runtime-evidence-artifact-inventory.md` |
| boundary | secret put / deploy / dashboard observation / state promotion / commit / push / PR は user approval and provisioning 後のみ |

### Issue #547 Cloudflare Audit Logs Redacted Feature Export（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/` |
| 状態 | `implemented_local_runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| CLI | `scripts/cf.sh audit-log feature-export` |
| implementation | `scripts/cf-audit-log/feature-export.ts`, `scripts/cf-audit-log/feature-export/schema-validation.ts`, `scripts/cf-audit-log/feature-export/manifest.ts` |
| D1 boundary | `readEventsForFeatureExport()` returns `AuditLogEvent[]`; `raw_json` does not cross module boundary |
| evidence | `outputs/phase-11/main.md`, `fixture-exported-features.jsonl`, `fixture-export-manifest.json`, `secret-leakage-grep.log`, `schema-validation.log` |
| production gate | `outputs/phase-11/production-pending-user-gate.md`; production export is `PENDING_RUNTIME_EVIDENCE` until approval |
| PR wording | Issue #547 is CLOSED; use `Refs #547` only |

### Issue #560 Next Standalone Instrumentation Patch（2026-05-08）

| workflow root | `docs/30-workflows/issue-560-task-03-followup-002-next-standalone-instrumentation-patch/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| source follow-up | `docs/30-workflows/completed-tasks/task-03-followup-002-next-standalone-instrumentation-patch-001.md` |
| parent | `docs/30-workflows/completed-tasks/task-03-w2-par-sentry-workers-sdk-unify/` |
| current script | `scripts/patch-next-standalone-instrumentation.mjs` |
| current copy path | `.next/server/instrumentation.js` -> `.next/standalone/apps/web/.next/server/instrumentation.js` plus `.map`, `.nft.json`, trace files |
| implemented hardening | `cwd` guard, `--verify-only`, regression test, trace parse failure handling, `.github/workflows/pr-build-test.yml` `build-test` gate, runbook |
| command | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` then `cd apps/web && node ../../scripts/patch-next-standalone-instrumentation.mjs --verify-only` |
| boundary | `web-cd.yml` Pages deploy cutover and production deploy are out of scope. Commit / push / PR are user-gated |
| artifact inventory | `references/workflow-issue-560-next-standalone-instrumentation-patch-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-560-next-standalone-instrumentation-patch-2026-05.md` |

