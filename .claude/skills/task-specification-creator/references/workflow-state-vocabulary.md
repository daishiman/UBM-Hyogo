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
| `implemented_local_runtime_pending` | Sub-state of `implemented_local_evidence_captured` for time-deferred runtime tasks (N-day close-out, post-switch observation). Local境界は完成し、production runtime 観測そのものが merge を起点とする時間経過に依存するため未開始の段階。 | `implemented_local_evidence_captured` 必須要件 + 「runtime は merge 後に時間経過で開始」が明示された Phase 12 implementation-guide / `system-spec-update-summary.md` の昇格パス。 | `pass_boundary_synced_runtime_pending` after merge (runtime started but observation window not closed). |
| `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `pass_boundary_synced_runtime_pending` | Local/spec boundary is synchronized, but staging/production/runtime evidence still needs user approval or external time. | Local PASS evidence plus explicit `PENDING_RUNTIME_EVIDENCE` files and user gate. | `completed` after approved runtime evidence and merge/close-out. For N-day close-out tasks, advances to `pass_runtime_synced` after observation window closes and evidence PR is approved. |
| `pass_runtime_synced` | N-day close-out terminal state. Production runtime evidence の observation window が完走し、aggregate gate（4 観測軸: actualSnapshots / fallbackRateMean / leakageHits / mlSnapshots など）が PASS した上で evidence PR が user-approved された状態。 | merge 後 D+N の cross-run aggregate JSON + evidence PR + user approval。skeleton zero metrics gate を含む aggregate gate が PASS。 | `completed`（merge 完了 / PR 承認後）。 |
| `implemented_local_build_blocked` | `VISUAL_ON_EXECUTION` 専用サブステート。local typecheck / lint / focused test は PASS だが、`build:cloudflare` 等の build toolchain blocker により runtime visual / axe evidence が取得できない段階。 | local PASS evidence + blocker の原因解析 + follow-up unassigned-task（build 修復タスク）の起票。 | `runtime-evidence-captured` after blocker is resolved and runtime screenshot / axe evidence is captured in the parent task `outputs/phase-11/evidence/` directory. |
| `runtime_evidence_captured` | `VISUAL_ON_EXECUTION` の runtime gate を通過した状態。runtime screenshot と axe report が親 task の `outputs/phase-11/evidence/` に集約済み。 | local PASS + `outputs/phase-11/evidence/screenshots/*.png` + `outputs/phase-11/evidence/axe-report.json` + Phase 12 strict 7 outputs + artifacts parity。 | Phase 13 user gate (commit / push / PR / merge)。 |
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
| Runtime observation depends on time elapsed after merge (N-day close-out, post-switch observation) | Use `implemented_local_runtime_pending` before merge. After merge, advance to `pass_boundary_synced_runtime_pending`. After observation window closes and evidence PR is approved, advance to `pass_runtime_synced`. Document the 3-stage promotion in `system-spec-update-summary.md` Step 1-B. |
| `VISUAL_ON_EXECUTION` task is blocked by build toolchain (`build:cloudflare` fail, esbuild host/binary mismatch, etc.) before runtime screenshot / axe can run | Mark root as `implemented_local_build_blocked`, file a follow-up unassigned-task for the build fix, and split visual evidence into a separate same-cycle or follow-up task. After blocker resolves and evidence is captured under parent task `outputs/phase-11/evidence/`, advance to `runtime-evidence-captured`. Local PASS alone is NOT a substitute for runtime evidence. |
| Same-cycle follow-up task is executed and the original unassigned-task `.md` is consumed | Rename the spec file from `docs/30-workflows/unassigned-task/*.md` to `docs/30-workflows/completed-tasks/*.md` in the same wave, prefix the title with `SUPERSEDED:` or `COMPLETED:`, and ensure the `## メタ情報` heading appears only once with `Issue #NNN` as a table row rather than as a separate yaml block. Update aiworkflow-requirements indexes / lessons / changelog in the same wave. |
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

## State Aliases

ledger / changelog / unassigned-task の自然文では、`metadata.workflow_state` の identifier を kebab-case で表記する慣習がある。両表記は **同一の状態** を指すため、ledger 検索時は両方を grep する。

| Canonical (artifacts.json) | Kebab alias (prose / changelog) | 用途 |
| --- | --- | --- |
| `implemented_local_evidence_captured` | `implemented-local-evidence-captured` | 自然文で言及する場合 |
| `implemented_local_runtime_pending` | `implemented-local-runtime-pending` | task-15 admin dashboard 系のように staging/production 実機 smoke が **別タスク gate で pending** な状態を自然文で示すとき |
| `implemented_local_build_blocked` | `implemented-local-build-blocked` | `VISUAL_ON_EXECUTION` task で build toolchain blocker により runtime visual が取得できない段階（task-10 で導入） |
| `runtime_evidence_captured` | `runtime-evidence-captured` | `VISUAL_ON_EXECUTION` の runtime gate 通過、screenshot / axe が親 task `outputs/phase-11/evidence/` 配下に集約済み |
| `pass_boundary_synced_runtime_pending` | `pass-boundary-synced-runtime-pending` | merge 後 runtime 観測中 |
| `pass_runtime_synced` | `pass-runtime-synced` | N-day close-out 完了 |

`implemented-local-runtime-pending` は `spec_created` / `implemented_local_evidence_captured` / `pass_boundary_synced_runtime_pending` との関係上、以下のように位置付ける:

- `spec_created` から直接遷移しない。必ず `implemented_local_evidence_captured`（local PASS 5 点取得済み）を経由してから、staging/production smoke が **別 unassigned-task gate** に分離されている場合に限って alias として使う。
- merge 後に runtime 観測そのものが開始されるならば `pass_boundary_synced_runtime_pending` へ昇格。
- runtime smoke が完走し evidence PR が user-approved されたら `pass_runtime_synced` または `completed`。

## State × External Ops Verdict Combination

外部副作用必須かつ user-approval gate な resource（Cloudflare KV namespace 作成 / R2 bucket / Queue / Service Binding 受け入れ等）の provisioning が pending の場合、root state と verdict suffix を **必ずペアで併記**する。単独表記（`PASS` 単独 / `PASS_WITH_EXTERNAL_OPS_PENDING` 単独 / `implemented-local-runtime-pending` 単独）は禁止。

| root state | verdict suffix | 想定境界 |
| --- | --- | --- |
| `implemented_local_evidence_captured` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | local 5 点 PASS / runtime CI / staging deploy / fresh GET いずれか未完 |
| `implemented_local_runtime_pending` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING (external resource: <KV namespace creation> 等)` | local 5 点 PASS / 外部 resource provisioning が user gate 待ち / merge 後の時間経過で runtime 観測開始 |
| `CONTRACT_READY_IMPLEMENTATION_PENDING` | `CONTRACT_READY_RUNTIME_PENDING` | code skeleton + binding 名 / shape は確定済、resource 作成前で build/deploy 不可 |

`system-spec-update-summary.md` Step 1-B の close-out 記述例:

```
workflow_state: implemented_local_runtime_pending
verdict: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING (external resource: KV namespace `alert_relay_dedup` creation pending user approval)
```

## Forbidden Wording

- Do not write `PASS` alone when runtime or production evidence is pending.
- Do not write `PASS_WITH_EXTERNAL_OPS_PENDING` or `implemented-local-runtime-pending` alone without the paired root state + verdict suffix.
- Do not use absolute wording (`guarantee` / `exactly-once` / `必ず抑制する` / `完全に防止`) for KV / 分散 cache backed dedup. Use eventual-consistency-aware wording instead (例: 「実用上大幅に低減」「同一 region 内では数秒以内に伝播」「edge cache の eventual consistency により短時間の重複を完全には排除しない」). 詳細: `references/phase-12-pitfalls.md` UBM-035.
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
