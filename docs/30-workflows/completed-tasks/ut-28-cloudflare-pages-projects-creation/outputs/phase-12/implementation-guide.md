# Implementation Guide

## Part 1: 中学生レベル

Cloudflare Pages project creation is like preparing a main shop and a trial shop before opening day.

| Topic | Everyday explanation |
| --- | --- |
| Production project | The main shop. Customers visit `ubm-hyogo-web`, and only the `main` branch supplies it. |
| Staging project | The trial shop. Staff test changes at `ubm-hyogo-web-staging`, and only the `dev` branch supplies it. |
| `production_branch` | The warehouse each shop uses. Main shop = `main`; trial shop = `dev`. Mixing them makes trial goods appear in the main shop. |
| `compatibility_date` | The shop rule date. Pages and Workers both use `2025-01-01` so the floor and kitchen follow the same rules. |
| Pages Git integration OFF | One delivery route. GitHub Actions delivers releases; Cloudflare Pages must not also auto-deliver from Git. |
| `CLOUDFLARE_PAGES_PROJECT` | The base shop name. Store `ubm-hyogo-web` only; the workflow adds `-staging` for the trial shop. |
| `bash scripts/cf.sh` | The safe key handler. It loads the Cloudflare token from 1Password at execution time and avoids direct `wrangler` use. |
| OpenNext output | The serving tray. `.next` and `.open-next/assets` are different trays; the deploy must use the one the runtime expects. |

## Part 2: Technical Detail

| Area | Contract |
| --- | --- |
| Production project | `ubm-hyogo-web`, `production_branch=main` |
| Staging project | `ubm-hyogo-web-staging`, `production_branch=dev` |
| Compatibility | `compatibility_date=2025-01-01`, `compatibility_flags=["nodejs_compat"]`, aligned with `apps/api/wrangler.toml` |
| Git integration | OFF. GitHub Actions remains the only deploy initiator. |
| Variable handoff | UT-27 receives `CLOUDFLARE_PAGES_PROJECT=ubm-hyogo-web`; staging is derived as `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging`. |
| Command path | `bash scripts/cf.sh` only. Direct `wrangler` execution is out of contract. |
| Secret handling | Do not write Account ID, API Token, Project ID, or raw dashboard values into workflow outputs. |
| OpenNext preflight | If `pages_build_output_dir = ".next"` remains without a UT-05 exception, real apply is blocked. Either UT-05 records Pages-form compatibility or migrates to `.open-next/assets` + `_worker.js`. |
| Phase 11 evidence | NON_VISUAL walkthrough only in this PR. Actual `pages project list`, deploy run URLs, commit SHA, and HTTP 200 evidence are captured after Phase 13 approval. |

## Edge Cases

| Case | Required handling |
| --- | --- |
| Variable accidentally set to `ubm-hyogo-web-staging` | Stop. The workflow would derive `ubm-hyogo-web-staging-staging`. |
| `production_branch` reversed | Stop. Production could behave as preview and staging could receive main semantics. |
| Pages Git integration turned ON | Stop or turn it OFF before smoke. Dual deploy sources make logs and rollback ambiguous. |
| `.next` deploy fails with `_worker.js` or OpenNext runtime errors | Do not patch UT-28. Feed the output-form blocker to UT-05 / `task-impl-opennext-workers-migration-001`. |
| Existing project name collision | Inspect masked `pages project list`, then either reuse only if settings match or create a new naming decision task. |

## References

- `docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-10/handoff-to-ut27.md`
- `docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/manual-smoke-log.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
