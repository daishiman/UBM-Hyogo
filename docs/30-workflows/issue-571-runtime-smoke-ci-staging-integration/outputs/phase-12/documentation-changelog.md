# Documentation Changelog

| Path | Change | Reason |
| --- | --- | --- |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/index.md` | Added current cycle boundary; aligned production follow-up timing | Resolve lifecycle and follow-up contradictions |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/artifacts.json` | Reclassified current cycle to `implementation / NON_VISUAL / implemented-local`; marked local outputs completed and runtime evidence blocked | Match actual workflow/script/ADR diff |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-01.md` | Clarified current cycle as spec authoring | Avoid implementation false green |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-02.md` | Added path existence gate, `--ci-summary`, and secret category boundary | Fix workflow execution contradiction |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-05.md` | Added path gate, summary generation grep, and secret boundary | Make implementation runbook deterministic |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-06.md` | Strengthened Environment mix-up detection beyond name check | Reduce production/staging cross-env risk |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-09.md` | Split authoring vs implementation path existence gates | Avoid false PASS in spec-only cycle |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-10.md` | Replaced false green with `設計上充足 / runtime 未実証` | Keep runtime PASS user-gated |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-11.md` | Added staging marker check and `--ci-summary` runtime evidence check | Close execution gap |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-12.md` | Fixed CONST_005 wording and production follow-up timing | Align with user constraints |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-13.md` | Replaced checked PASS template with pending gate-specific checklist | Avoid unearned PASS |
| `.github/workflows/runtime-smoke-staging.yml` | Added implemented workflow | CI runtime smoke integration |
| `.github/workflows/backend-ci.yml` | Added reusable workflow call with `[skip runtime-smoke]` escape valve | Trigger smoke after API staging deploy |
| `scripts/smoke/runtime-attendance-provider.sh` | Added `--out-dir`, `--ci-summary`, and normalized curl transport failure status to `000` | CI artifact and deterministic failure evidence |
| `scripts/smoke/ci-summary-post.sh` | Added failure-only Slack summary helper | Incident notification without raw body leakage |
| `scripts/smoke/__tests__/*.test.sh` | Added shell regression tests | Redaction, runner, and Slack helper contracts |
| `docs/40-architecture/adr/*.md` | Added ADRs for secret injection and required check promotion | Decision record sync |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Added Issue #571 staging runtime smoke CI section | System spec sync |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Added `staging-runtime-smoke` Environment secret section | Secret management sync |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added Issue #571 active workflow entry | Workflow inventory sync |
| `.claude/skills/aiworkflow-requirements/indexes/*.md` and `keywords.json` | Added lookup entries | Index sync |
| `.claude/skills/aiworkflow-requirements/changelog/20260508-issue571-runtime-smoke-ci-staging-integration.md` | Added changelog fragment | LOGS/changelog sync |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Added one-line headline | Mirror uses `LOGS/_legacy.md`, not `LOGS.md` |
