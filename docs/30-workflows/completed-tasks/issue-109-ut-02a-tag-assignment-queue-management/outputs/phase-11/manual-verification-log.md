# Manual Verification Log

## メタ

- 実行日時: 2026-05-01
- 実行者: claude-opus-4-7（自律実行）
- branch: HEAD（worktree: task-20260501-172346-wt-6）
- 検証環境: ローカル（vitest + fakeD1 + setupD1 in-memory）
- screenshot: 不作成（visualEvidence=NON_VISUAL）

## 主証跡

### 自動テスト

```
$ mise exec -- pnpm --filter @ubm-hyogo/api test
...
✓ apps/api/src/repository/tagQueue.test.ts (9 tests) 37ms
✓ apps/api/src/repository/tagQueueIdempotencyRetry.test.ts (13 tests) 55ms
✓ apps/api/src/workflows/tagCandidateEnqueue.test.ts (4 tests) 5923ms
✓ apps/api/src/workflows/tagQueueResolve.test.ts (12 tests) 19165ms
✓ apps/api/src/repository/__tests__/memberTags.test.ts (5 tests) 11ms
✓ apps/api/src/schemas/tagQueueResolve.test.ts (6 tests) 28ms

Test Files  81 passed | 1 failed (82)
Tests       497 passed | 2 failed (499)
```

本タスク追加・関連: **49/49 PASS**。
全体 fail 2 件は `apps/api/src/repository/schemaDiffQueue.test.ts`（既存問題、本タスク無関係）。

### typecheck

```
$ mise exec -- pnpm --filter @ubm-hyogo/api typecheck
> tsc -p tsconfig.json --noEmit
(エラーなし)
```

### grep evidence

- `grep/web-direct-d1.txt` — 0 件（不変条件 #5）
- `grep/membertags-write.txt` — 既存 allow list のみ（不変条件 #13）
- `sql/migration-grep.txt` — 0002 + 0009 migration grep

## screenshot を作らない理由

- artifacts.json で `visualEvidence: NON_VISUAL` 確定
- 本タスクは repository / workflow（バックエンド層）であり UI 成果物が無い
- false green を防ぐため screenshot 生成は構造的に禁止

## 不変条件最終確認

| # | 不変条件 | 結果 |
| --- | --- | --- |
| #5 | D1 直接アクセスは apps/api 内に閉じる | ✅ grep 0 件 |
| #13 | member_tags 書込みは 07a queue resolve 経由のみ | ✅ 本タスク追加分 0 件 |
| 02a read-only | memberTags.ts の write 系 export 規約 | ✅ type-level test PASS |
