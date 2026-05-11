# workflow_state Vocabulary

This reference is the canonical vocabulary for task workflow root state, phase
status, and evidence boundary wording in task-specification-creator workflows.
It exists to prevent Phase 12 close-out records from mixing "spec exists",
"local implementation exists", "runtime evidence is pending", and "merged" into
one ambiguous PASS label.

## State Values

| State | Meaning | Required evidence | Next state |
| --- | --- | --- | --- |
| `spec_created` | Specification exists, implementation has not started in this workflow root. | Phase files, root `artifacts.json`, `index.md`, scope and dependency table. | `CONTRACT_READY_IMPLEMENTATION_PENDING` or remains `spec_created` for docs-only/spec roots. |
| `CONTRACT_READY_IMPLEMENTATION_PENDING` | Contract and implementation plan are ready, but local implementation evidence is not complete. | Phase 1-10 decisions, ADR/test plan, changed-files plan, approval gates. | `implemented_local_evidence_captured` or `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`. |
| `implemented_local_evidence_captured` | Local implementation and deterministic local evidence are captured. | Code/spec/skill diffs, Phase 11 evidence logs, Phase 12 strict 7 files, status/index sync. | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` if runtime is external-gated, otherwise Phase 13 user gate. |
| `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | Local/spec boundary is synchronized, but staging/production/runtime evidence still needs user approval or external time. | Local PASS evidence plus explicit `PENDING_RUNTIME_EVIDENCE` files and user gate. | `completed` after approved runtime evidence and merge/close-out. |
| `verified_current_no_code_change_pending_pr` | Current baseline already satisfies the reported problem, with no code change required. | Baseline and after evidence, stale-current rationale, consumed source task trace. | Phase 13 user gate, then completed/archive policy. |
| `completed` | Workflow is fully closed according to its completion policy. | Phase 13 completion or completed-tasks policy, final ledger/index sync. | Terminal. |

`pending`, `blocked`, and `completed` inside `phases[].status` are phase status
values. They are not root `metadata.workflow_state` values except where the root
state is explicitly `completed`.

## Canonical Short-form Aliases（2026-05-10 stage-3 由来）

`phases[].status` および root `status` で許容する canonical 3-state short-form は次の通り。schema (`schemas/artifact-definition.json`) でも同 enum を強制する。

| canonical short-form | 同義の長い境界語彙 | 想定 phase |
| --- | --- | --- |
| `spec_created` | （同名） | Phase 1-4 のみ完了 / コード差分なし |
| `in_progress` | `CONTRACT_READY_IMPLEMENTATION_PENDING` 等 | コード着手済 / Phase 11 evidence 未取得 |
| `runtime_pending` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `IMPLEMENTED_LOCAL_RUNTIME_PENDING` / `PENDING_RUNTIME_EVIDENCE` | local 5 点 PASS 済 / runtime CI / staging deploy / fresh GET 未完 |
| `completed` | （同名） | runtime artifact 物理生成済 + 検証ログ記録済 |
| `blocked` | （同名） | 外部依存・user gate で停止中 |

短縮形と長い境界語彙はどちらを使ってもよいが、**1 つの artifacts.json / index.md / phase12-task-spec-compliance-check.md 内では混在させない**。混在させる場合は同 wave で統一する。

`PASS` 単独表記は禁止。compliance check / Phase 12 行レベル判定では canonical short-form を suffix する（例: `completed (runtime PASS / verified at <ISO8601>)`、`runtime_pending (CI scheduled)`）。

## Reclassify Rules

| Trigger | Required action |
| --- | --- |
| Phase 5 starts an implementation runbook from a spec-only root | Reclassify root from `spec_created` to `CONTRACT_READY_IMPLEMENTATION_PENDING`, unless the workflow is explicitly docs-only/spec formalization. |
| Local files under `apps/`, `packages/`, `.claude/skills/`, or canonical specs are changed | Do not keep a root in `spec_created` unless the task is still only a specification package. Record the new implementation state in `artifacts.json`, `index.md`, and Phase 12 compliance. |
| Phase 11 deterministic evidence is captured and Phase 12 strict files exist | Use `implemented_local_evidence_captured` for local-only implementation tasks. |
| Runtime/deploy/production evidence is intentionally external-gated | Use `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`, place `PENDING_RUNTIME_EVIDENCE`, and keep Phase 13 user approval explicit. |
| A workflow root is moved, archived, or deleted | Update active/completed ledgers, aiworkflow indexes, artifact inventory references, and quick-reference paths in the same wave. Deleting the root while indexes still point to it is a FAIL. |

## Evidence Mapping

| Evidence | `spec_created` | `CONTRACT_READY_IMPLEMENTATION_PENDING` | `implemented_local_evidence_captured` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | `completed` |
| --- | --- | --- | --- | --- | --- |
| Phase 1-13 spec files | Required | Required | Required | Required | Required |
| Changed-files plan | Optional | Required | Required | Required | Required |
| Local code/spec/skill diff | Not present unless spec package | Planned | Required | Required | Required |
| Phase 11 deterministic logs | Optional | Planned | Required | Required | Required |
| Phase 12 strict 7 files | Optional | Planned | Required | Required | Required |
| Runtime/production evidence | Not required | Planned if applicable | Optional | Pending/required later | Required if in scope |
| Phase 13 commit/PR/merge state | Pending | Pending | Pending | Pending | Complete or explicitly user-gated |

## Forbidden Wording

- Do not write `PASS` alone when runtime or production evidence is pending.
- Do not use `completed` for a phase status as evidence that root
  `metadata.workflow_state` is complete.
- Do not mix `spec_created` with implementation-complete claims in
  `index.md`, `artifacts.json`, and `phase12-task-spec-compliance-check.md`.
- Do not invent translated state names in ledgers. Use the exact identifiers
  above and explain them in prose if needed.

## Archive And Delete Gate

Before a workflow root is removed or moved, run a stale-reference check over the
skill and requirements ledgers. The close-out is not complete until all live
references either point to the new path or explicitly record the root as
withdrawn/archived.

Minimum check:

```bash
rg -n '<workflow-root-name>' docs/30-workflows .claude/skills/aiworkflow-requirements .claude/skills/task-specification-creator
git status --short
git diff --stat
```

Each remaining hit must be classified before PASS:

| Reference class | Required handling |
| --- | --- |
| Live inventory / active workflow / consumedBy trace | Keep or restore the workflow root, or update the reference to a new canonical root. |
| Historical changelog / lessons entry | Keep only if it is explicitly historical and does not advertise the root as active. |
| Generated index hit | Regenerate indexes after the live/historical classification is fixed. |
| Deleted root with live references | FAIL. Restore the root or complete the archive/move ledger update in the same wave. |

## Related References

- [phase12-compliance-check-template.md](phase12-compliance-check-template.md)
- [phase-12-spec.md](phase-12-spec.md)
- [phase-template-phase11.md](phase-template-phase11.md)
- [phase12-skill-feedback-promotion.md](phase12-skill-feedback-promotion.md)
