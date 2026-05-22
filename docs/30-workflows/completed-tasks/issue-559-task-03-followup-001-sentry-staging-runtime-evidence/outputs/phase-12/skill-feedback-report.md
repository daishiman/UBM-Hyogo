# Skill Feedback Report

## Template Improvement

| Item | Feedback | Promotion target | Evidence path |
| --- | --- | --- | --- |
| T-1 | Runtime evidence follow-up specs should include a G0 preflight row before user-approved mutation gates. G0 must verify parent implementation files, canonical dependency files, executable command names, and artifact parity before secret/deploy operations. | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | `phase-05.md`, `outputs/phase-11/evidence/preflight-g0.log` |
| T-2 | G1 secret gates should have a pre-G1 provisioning check for external secret source existence, not only a secret put command. | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | `phase-05.md` Step 5 |

## Workflow Improvement

| Item | Feedback | Promotion target | Evidence path |
| --- | --- | --- | --- |
| W-1 | For Sentry browser evidence, distinguish public DSN delivery from secret hygiene. `NEXT_PUBLIC_*` values can be public to browsers, but repository/log/screenshot evidence must still avoid raw DSN values. | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `outputs/phase-11/evidence/dsn-leak-scan.log` |
| W-2 | OpenNext grep gate scope must target `apps/web/.open-next/worker.js`; scanning the whole `.open-next/` tree creates false positives from browser static bundles. | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` or Phase 11 runtime evidence guide | `outputs/phase-11/evidence/grep-gate-runtime.log` |

## Documentation Improvement

| Item | Feedback | Promotion target | Evidence path |
| --- | --- | --- | --- |
| D-1 | Phase 11 evidence lists must separate canonical reserved paths from materialized evidence. Missing deployment/curl/Sentry files must be `deferred` / `blocked_runtime_evidence`, not parity PASS. | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| D-2 | Runtime pending specs need same-wave quick-reference / resource-map / task-workflow-active registration even when final observability spec promotion is deferred to G5. | `.claude/skills/aiworkflow-requirements/references/spec-guidelines.md` | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`, `indexes/resource-map.md`, `references/task-workflow-active.md` |

## Provisioning preflight (added 2026-05-08, this cycle)

G0 preflight should also check 1Password vault/item presence (`op vault list` + `op item get --vault <vault> '<item>'` smoke) before reaching the user-approved G1 secret put gate. Today, `op://UBM-Hyogo/Sentry Web DSN (staging)/dsn` was assumed to exist by spec but was unprovisioned, causing G1 halt mid-cycle. Adding a provisioning preflight ahead of G1 lets the workflow fail fast with a clear actionable item rather than approaching the secret put step before noticing.

Promotion target: `.claude/skills/task-specification-creator/references/phase-template-phase11.md`.
Evidence path: `outputs/phase-11/main.md` G1 section.

## Worktree base policy reminder

This worktree was originally based on `origin/main` rather than `origin/dev`, which placed parent task-03's runtime files outside the working tree and forced a `git reset --hard origin/dev`. CLAUDE.md and memory both state「PR base・worktree 起点・同期対象すべて dev」, but `bash scripts/new-worktree.sh` should enforce dev-base by default and refuse main-base creation unless an explicit production release flag is passed.

Promotion target: existing worktree creation documentation / script owner, not this workflow. No-op reason for this cycle: outside Issue #559 runtime evidence scope.
Evidence path: `outputs/phase-11/evidence/preflight-g0.log` pre-rebase FAIL and post-rebase PASS.

## OpenNext build artifact path scope

The grep gate intent is server runtime artifact (`apps/web/.open-next/worker.js`), not the entire `apps/web/.open-next/` directory which includes `assets/_next/static/chunks/*` (browser bundles legitimately containing Web API references like `requestIdleCallback`). The phase-05 runbook line `rg ... apps/web/.open-next/` should be tightened to `apps/web/.open-next/worker.js` to avoid false positives.

Promotion target: `.claude/skills/task-specification-creator/references/phase-template-phase11.md`.
Evidence path: `phase-05.md` Step 4 and `outputs/phase-11/evidence/grep-gate-runtime.log`.
