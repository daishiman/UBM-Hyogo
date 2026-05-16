# Phase 11 — Evidence 収集（NON_VISUAL）

## evidence canonical paths

```
outputs/phase-11/evidence/typecheck.txt
outputs/phase-11/evidence/lint.txt
outputs/phase-11/evidence/test-tagQueue.txt
outputs/phase-11/evidence/test-memberTags-readonly.txt
outputs/phase-11/evidence/test-memberTags-repository.txt
outputs/phase-11/evidence/test-repository-providers.txt
outputs/phase-11/grep-assignTagsToMember.txt
outputs/phase-11/grep-jsdoc-marker.txt
outputs/phase-11/git-diff-memberTags.txt
```

## 取得コマンド（実装後に実行）

```bash
cd <repo-root>
mkdir -p docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/evidence

mise exec -- pnpm typecheck \
  > docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/evidence/typecheck.txt 2>&1

mise exec -- pnpm lint \
  > docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/evidence/lint.txt 2>&1

mise exec -- pnpm --filter @ubm-hyogo/api test -- tagQueue \
  > docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/evidence/test-tagQueue.txt 2>&1

mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.readonly \
  > docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/evidence/test-memberTags-readonly.txt 2>&1

mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.repository \
  > docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/evidence/test-memberTags-repository.txt 2>&1

mise exec -- pnpm --filter @ubm-hyogo/api test -- repository-providers \
  > docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/evidence/test-repository-providers.txt 2>&1

rg "assignTagsToMember" apps/api/src packages/shared/src \
  > docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/grep-assignTagsToMember.txt

rg -n "tagQueueResolve workflow|直接呼び出し禁止|不変条件 #13|@internal" apps/api/src/repository/memberTags.ts \
  > docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/grep-jsdoc-marker.txt

git diff apps/api/src/repository/memberTags.ts apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts apps/api/src/repository/__tests__/memberTags.repository.spec.ts \
  > docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-11/git-diff-memberTags.txt
```

## PASS 判定

- typecheck.txt / lint.txt / test-*.txt の最終行が exit 0 相当（FAIL 表記なし）
- grep-assignTagsToMember.txt が分類判定で一致（production caller は `tagQueueResolve.ts` の 1 箇所のみ。JSDoc / provider binding / test hit は許容分類）
- grep-jsdoc-marker.txt が 6 hit 以上（「tagQueueResolve workflow」3+、「直接呼び出し禁止」2+、「不変条件 #13」1+、「@internal」2+）
- git-diff-memberTags.txt の `+` 行が JSDoc / コメント行のみ（関数 body / SQL / type に追加なし）

## state vocabulary

実装完了かつ全 local evidence 取得済み → `implemented_local_evidence_captured`
runtime evidence 未取得 → `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（本タスクではランタイム挙動変化なしのため、staging deploy 待ちにせず Phase 12 へ進んでよい）
