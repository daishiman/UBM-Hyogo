# task-spec-skill-workflow-state-hook-enforcement

## Metadata

| Field | Value |
| --- | --- |
| status | unassigned |
| priority | medium |
| parent_task | `docs/30-workflows/issue-534-skill-workflow-state-guidance/` |
| source | Issue #534 Phase 12 |

## Scope

Implement a deterministic local hook or repository script that checks
`artifacts.json.metadata.workflow_state`, `index.md` state rows, and
`phases[].status` for drift.

## 苦戦箇所

The vocabulary exists in skill documentation, but enforcement is still manual.
The hook must distinguish root `workflow_state` from phase status.

## リスクと対策

| Risk | Mitigation |
| --- | --- |
| False positives on docs-only/spec roots | Read `taskType`, `docs_only`, and `visualEvidence` before enforcing implementation states. |
| Blocking unrelated worktrees | Provide an explicit path argument and only inspect changed workflow roots. |

## 検証方法

- Add fixture workflow roots for `spec_created`, `implemented_local_evidence_captured`, and runtime-pending cases.
- Run the script in pass/fail fixtures.
- Wire into hook/CI only after fixtures are green.

## スコープ外

Changing workflow vocabulary names.
