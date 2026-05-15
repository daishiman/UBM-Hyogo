# 2026-05-15 Issue #324 Shared Package Type Contracts

Issue #324 / UT-08A-05 を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期。

## 反映内容

- `packages/shared/src/__tests__/type-contracts.spec.ts` を追加し、`@ubm-hyogo/shared` public barrel 経由で brand 型 / view-model schema / admin body schema の compile-time 型契約を 5 describe / 15 it で固定。
- `@ubm-hyogo/shared` focused typecheck / lint / test を local evidence として取得（18 files / 210 tests PASS）。
- source unassigned `UT-08A-05-shared-package-type-test.md` を `completed-tasks/` へ移動し、完了記録を追加。
- `docs/30-workflows/completed-tasks/issue-324-shared-package-type-contracts/` に root/output artifacts parity、Phase 11 evidence、Phase 12 strict 7 outputs を追加。
- quick-reference / resource-map / task-workflow-active / 08a artifact inventory / LOGS を同一 wave で同期。

## 境界

- Issue #324 は CLOSED 維持。PR 文脈は `Refs #324` のみ。
- runtime schema / API / D1 / apps/api / apps/web は変更しない。
- `tsd` / vitest typecheck mode / dependency 追加なし。
