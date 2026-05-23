# 2026-05-15 UT-07A-FU-01 memberTags.assignTagsToMember cleanup

UT-07A-01 を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期した。
Issue #294 の「production caller なし」前提は stale で、現行 `apps/api/src/workflows/tagQueueResolve.ts` が唯一の production caller として存在するため、削除ではなく `apps/api/src/repository/memberTags.ts` の JSDoc/comment 3 箇所で `tagQueueResolve` workflow 専用 helper と明示した。
同時に `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` の `assign*` 派生禁止 gate と `apps/api/src/repository/__tests__/memberTags.repository.spec.ts` の production caller boundary gate を追加した。

同期内容:

- workflow root `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/`
- root/output `artifacts.json`
- Phase 11 tracked `.txt` evidence
- Phase 12 strict 7 outputs
- source completed consumed trace
- quick-reference / resource-map / topic-map / keywords / task-workflow-active / artifact inventory

Commit / push / PR / issue mutation は user-gated。
