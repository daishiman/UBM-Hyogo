# Documentation Changelog

| Path | Change |
| --- | --- |
| `.github/workflows/backend-ci.yml` | Replaced shared Cloudflare token with D1 and Workers scope-specific secrets. |
| `.github/workflows/web-cd.yml` | Replaced shared Cloudflare token with Pages scope-specific secrets. |
| `scripts/cf.sh` | Added pre-injected token path for CI/manual scoped-token execution. |
| `scripts/__tests__/cf-token-arg.test.sh` | Added shell smoke test for the pre-injected token path. |
| `docs/30-workflows/u-fix-cf-acct-01-deriv-02-scope-split-tokens/` | Aligned task spec with existing workflows and strict Phase 12 outputs. |
| `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-02-scope-split-tokens.md` | Marked source task as consumed by this workflow. |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Added six-token deployment secret contract. |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | Added current workflow token split contract. |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | Added U-FIX-CF-ACCT-01-DERIV-02 changelog entry. |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Added U-FIX-CF-ACCT-01-DERIV-02 sync log entry. |
| `.claude/skills/task-specification-creator/SKILL.md` | Added workflow path existence gate changelog entry. |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | Added workflow path existence gate log entry. |
| `.claude/skills/task-specification-creator/references/phase-template-phase8-10.md` | Added Phase 9 workflow path existence gate. |
| `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | Promoted workflow path existence guard from skill feedback. |
| `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Added explicit artifacts parity wording for workflows where `outputs/artifacts.json` exists. |
