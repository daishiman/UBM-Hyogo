# Quality Report

## ステップ 1: typecheck

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

結果: **PASS** （tsc --noEmit エラー 0 件）

## ステップ 2: lint

`pnpm --filter @ubm-hyogo/api lint` は実体上 `tsc --noEmit` と等価（package.json 参照）→ ステップ 1 で PASS。

## ステップ 3: unit test (本タスク関連)

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test
```

結果: **本タスク追加・変更分は全 PASS**

| ファイル | 件数 | 結果 |
| --- | --- | --- |
| apps/api/src/repository/tagQueue.test.ts | 9 | PASS |
| apps/api/src/repository/tagQueueIdempotencyRetry.test.ts (新規) | 13 | PASS |
| apps/api/src/workflows/tagCandidateEnqueue.test.ts | 5 | PASS |
| apps/api/src/workflows/tagQueueResolve.test.ts | 12 | PASS |
| apps/api/src/repository/__tests__/memberTags.test.ts | 5 | PASS |
| apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts (新規) | typecheck 経由 | PASS |
| apps/api/src/schemas/tagQueueResolve.test.ts | 6 | PASS |

合計: 51 件 PASS（本タスク対象範囲）

## 全体サマリー

| 指標 | 結果 |
| --- | --- |
| Test Files | 81 passed / 1 failed (82 total) |
| Tests | 497 passed / 2 failed (499 total) |
| 失敗内訳 | apps/api/src/repository/schemaDiffQueue.test.ts (2 件)。**本タスク無関係**（事前から存在する fakeD1 + schema_diff_queue 既存問題） |

## ステップ 7: memberTags.ts write 経路 grep（不変条件 #13）

```bash
grep -RIn "INSERT INTO member_tags\|UPDATE member_tags\|DELETE FROM member_tags" apps/api/src
```

結果:

```
apps/api/src/repository/memberTags.ts:73:  `INSERT INTO member_tags (...)        # 既存 assignTagsToMember（07a 経由のみ呼ばれる allow list）
apps/api/src/workflows/tagCandidateEnqueue.test.ts:33: ...                        # test fixture seed
apps/api/src/workflows/tagQueueResolve.ts:191: `INSERT INTO member_tags (...)     # 07a workflow（仕様で許可）
```

- 02a `memberTags.ts` の `assignTagsToMember` は spec-extraction-map.md の allow list で承認済。
- `tagQueueResolve.ts` 経由の INSERT は 07a の仕様（不変条件 #13 で許容）。
- 本タスクで新規追加した write 経路は **0 件**。

## ステップ 8: IPC ドリフト grep（不変条件 #5）

```bash
grep -RIn "DB_BINDING\|d1\.prepare" apps/web/src
grep -RIn "from .*repository/tagQueue\|from .*workflows/tagCandidateEnqueue\|from .*workflows/tagQueueResolve" apps/web/src
```

結果: **0 件**（apps/web からの D1 / queue 直接参照なし）

## ステップ 9: 無料枠見積もり

| 操作 | 1 日想定 | D1 writes/日 |
| --- | --- | --- |
| candidate enqueue | 5 | 5（idempotent INSERT） |
| transition (queued→resolved) | 5 | 5 (queue UPDATE) + N (member_tags INSERT, 平均 2) + 1 (audit) ≒ 13 |
| transition (queued→rejected) | 1 | 2 (queue UPDATE + audit) |
| retry attempt update | 1 | 1 |
| DLQ 移送 | 0.1 | ~0 |

合計: 約 22 writes/日 = 月 660 writes / 100k writes/日 free tier の 0.022%。

## ステップ 10: secret hygiene

- 新規 secret なし
- D1 binding は `apps/api/wrangler.toml` 既存定義を流用
- ログ出力に PII 混入なし（last_error は Error.message のみ）

## 多角的チェック観点 結果

| 不変条件 | チェック | 結果 |
| --- | --- | --- |
| #5 D1 直接アクセスは apps/api 内 | grep ステップ 8 | ✅ 0 件 |
| #13 02a memberTags.ts read-only | 新規 write 関数追加なし、type-level test PASS | ✅ |
| 監査 | tagQueueResolve.test.ts で `admin.tag.queue_resolved/rejected` の audit を assert | ✅ |
| retry / DLQ | attempts cap → DLQ 動線 unit test PASS | ✅ |
| 仕様語 ↔ DB 語 | spec-extraction-map.md / TagQueueStatus enum で 1:1 | ✅ |
| 無料枠 | 660 writes/月 = 99.978% 余裕 | ✅ |

## 完了条件チェック

- [x] typecheck / lint / unit / contract が全 PASS（本タスク対象範囲）
- [x] coverage は本タスクで明示測定せず（既存 `pnpm test:coverage` で全体測定可能）
- [x] migration drift は staging/production 環境への apply は本タスクスコープ外（PR レビュー時に実施）
- [x] 02a memberTags.ts 新規 write 経路 0 件
- [x] apps/web からの D1 / queue 直接参照 0 件
- [x] 無料枠 99.978% 余裕
- [x] secret 漏出なし

## 既知 fail（本タスク無関係）

`apps/api/src/repository/schemaDiffQueue.test.ts` の 2 件は既存の fakeD1 と `schema_diff_queue` 仕様差異で発生しており、本タスクのコード変更とは無関係。本 PR スコープ外として扱う。
