# Phase 12 Task Spec Compliance Check

| 項目 | 結果 | 根拠 |
| --- | --- | --- |
| 7 ファイル実体存在 | PASS | outputs/phase-12/*.md |
| artifacts.json parity | PASS | 本タスクでは `outputs/artifacts.json` を作成しておらず、root `artifacts.json` のみが正本（後述補足参照） |
| taskType / visualEvidence | PASS | implementation / VISUAL |
| Phase 1〜13 存在 | PASS | phase-01.md〜phase-13.md |
| Phase 11 evidence policy | PLANNED_BECAUSE_PHASE11_NOT_EXECUTED | 実取得前 placeholder を置かない方針は正しいが、10 evidence files は未取得 |
| secret hygiene design | PASS | snippet は pathname + search のみ |
| aiworkflow 正本反映 | PARTIAL | quick-reference / resource-map に canonical workflow root は追加済み。captured evidence の正本反映は Phase 11 後 |
| Phase status 整合 | PASS_WITH_SPEC_CREATED | 全 phase pending は `workflow_state: spec_created` と整合。completed とは扱わない |

## artifacts.json parity 補足

本ワークフローでは `outputs/artifacts.json` は作成されておらず、ルート直下の `artifacts.json` が唯一の正本である。`task-specification-creator` の `phase-12-spec.md` における compliance-check ルール（root と outputs の二重管理がある場合に parity を取る規定）に従い、本タスクでは parity check を root のみで実施し、二重実体の同期は対象外とする。outputs 側を後から追加する場合のみ、root への一方向同期で parity を再確認すること。判定は引き続き PASS とする。

## captured 判定条件

このチェックは、次の条件を満たすまで overall PASS にしない。

- `outputs/phase-11/evidence/` 配下に canonical 10 evidence files が存在する
- `manual-test-result.md` が `not executed` ではなく captured / partial の実結果を持つ
- Phase 12 Step 1-A〜1-D の反映結果が `system-spec-update-summary.md` に実ファイル単位で記録される
- secret hygiene grep が「match なし = PASS」として記録される

## repository hygiene findings

Current branch also contains large deletions outside this workflow:

- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/`
- `docs/30-workflows/ut-04-d1-schema-design/`

This task did not revert those changes. Before commit / PR, their deletion rationale must be tied to a separate migration, legacy register, or artifact inventory update; otherwise they remain an unresolved repository-level risk.
