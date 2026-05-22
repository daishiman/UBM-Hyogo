# Skill feedback report

## Template improvements

| Item | Owner | Promotion target | Decision | Evidence |
| --- | --- | --- | --- | --- |
| Phase 12 strict 7 and verdict vocabulary | `task-specification-creator` | no change | no-op: existing `phase12-compliance-check-template.md` and validator rules already required this; the gap was local output quality | `outputs/phase-12/phase12-task-spec-compliance-check.md` remediated |
| implementation guide detail | `task-specification-creator` | no change | no-op: `validate-phase12-implementation-guide.js` already caught missing Part 1/2 content | `implementation-guide.md` now passes 12/12 |
| Phase 11 canonical paths | `task-specification-creator` | no change | no-op: existing schema/validator applied; missing manifest was added to this workflow | `outputs/phase-11/canonical-paths.json` |

## Workflow improvements

| Item | Owner | Promotion target | Decision | Evidence |
| --- | --- | --- | --- | --- |
| actionlint allowlist drift | `aiworkflow-requirements` | `references/deployment-gha.md` | promoted: all-workflows glob invariant is now canonical | `deployment-gha.md` workflow lint scope section |
| local/CI command drift | `aiworkflow-requirements` | quick-reference / resource-map / task-workflow-active | promoted: `pnpm observation:lint` and `workflow-shell-lint` share version/scope | `quick-reference.md`, `resource-map.md`, `task-workflow-active.md` |
| branch protection mutation | governance/user gate | no change | no-op: out of this cycle; mutation requires explicit approval | Phase 13 user gate |

## Documentation improvements

| Item | Owner | Promotion target | Decision | Evidence |
| --- | --- | --- | --- | --- |
| yamllint non-adoption | `aiworkflow-requirements` | lessons + task output | promoted: decision recorded to avoid repeated N/A debate | `outputs/phase-02/yamllint-decision.md`, `lessons-learned-issue-290-workflow-lint-gate-2026-05.md` |
| lessons hub registration | `aiworkflow-requirements` | `references/lessons-learned.md` | promoted: child lesson added to parent index | `references/lessons-learned.md` |
| generated indexes | `aiworkflow-requirements` | `indexes/topic-map.md`, `indexes/keywords.json` | promoted by regeneration | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` |
