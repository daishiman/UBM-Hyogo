# Phase 12 Task Spec Compliance Check — task-a-density-toggle-ux-clarity

> parent + sub-workflow 構造のため Phase 12 strict 7 は親 root
> `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/` に集約している。
> 本 sub-task は canonical 9 heading を保ちつつ親集約への参照のみを記載する。

## 1. Summary verdict

PASS_WITH_LOCAL_VISUAL_EVIDENCE (parent 集約)。本 sub-task の実装範囲（`DensityToggle.client.tsx` + `Segmented.tsx` 拡張 + focused spec）は親 Phase 12 の集約 verdict に含まれる。

## 2. Changed-files classification

| Classification | Path | Status |
| --- | --- | --- |
| implementation | apps/web/src/components/public/DensityToggle.client.tsx | present |
| implementation | apps/web/src/components/ui/Segmented.tsx | present |
| tests | apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx | present |

## 3. `workflow_state` and phase status consistency

Sub-task `workflow_state` は親 workflow `implemented_local_runtime_pending` と同期。Commit / push / PR / staging visual baseline は user-gated。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| parent aggregated evidence | outputs/phase-11/parent-aggregated.md | n/a |

## 5. Phase 12 strict 7 file inventory

| Path | Status |
| --- | --- |
| outputs/phase-12/main.md | n/a (parent root 集約) |
| outputs/phase-12/implementation-guide.md | n/a (parent root 集約) |
| outputs/phase-12/system-spec-update-summary.md | n/a (parent root 集約) |
| outputs/phase-12/documentation-changelog.md | n/a (parent root 集約) |
| outputs/phase-12/unassigned-task-detection.md | n/a (parent root 集約) |
| outputs/phase-12/skill-feedback-report.md | n/a (parent root 集約) |
| outputs/phase-12/phase12-task-spec-compliance-check.md | present |

## 6. Skill/reference/system spec same-wave sync

aiworkflow-requirements indexes (quick-reference, resource-map, task-workflow-active) と artifact-inventory が同 wave で更新済。

## 7. Runtime or user-gated boundary

Staging deploy / authenticated visual baseline / commit / push / PR は user-gated。Local focused spec で実装証跡を担保。

## 8. Archive/delete stale-reference gate

No workflow root was deleted or moved.

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | DensityToggle 拡張は親 AC と整合 |
| 漏れなし | PASS | strict 7 を親 root へ集約 |
| 整合性あり | PASS | Segmented optional prop 拡張で後方互換維持 |
| 依存関係整合 | PASS | Task B/C は本 sub-task の prop 拡張に依存しない |
