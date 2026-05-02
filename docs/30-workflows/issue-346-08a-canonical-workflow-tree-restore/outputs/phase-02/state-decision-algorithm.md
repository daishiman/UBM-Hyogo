# 08a state decision algorithm

## Decision inputs

- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/index.md`
- `docs/30-workflows/completed-tasks/`
- `docs/30-workflows/02-application-implementation/08a-A-public-use-case-coverage-hardening/`（follow-up。canonical root の代替ではない）
- `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## Decision order

1. If the original 08a canonical root exists, keep it as current and repair only broken references.
2. If the original root is absent but a completed or successor root exists, make that successor the explicit canonical target and update all references in the same wave.
3. If neither a current nor successor root exists, classify the old root as current/partial and formalize a restore task before any 09a / 09b / 09c gate depends on it.

## Required invariant

The selected state must be represented in the workflow tree, aiworkflow-requirements references, and downstream gate references at the same time. A missing physical tree with active downstream references is FAIL.
