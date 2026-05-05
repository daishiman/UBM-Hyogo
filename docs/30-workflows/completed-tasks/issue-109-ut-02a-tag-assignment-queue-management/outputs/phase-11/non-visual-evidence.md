# Non-Visual Evidence

## シナリオ別 evidence テーブル

| # | シナリオ | 実行コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 1 | queue enqueue 正常系 (idempotency miss) | tagQueueIdempotencyRetry.test.ts > `createIdempotent: 新規 key で行を作成` | INSERT 成功、isExisting=false | PASS | ✅ |
| 2 | idempotency 衝突（同一 key） | `createIdempotent: 同一 key で 2 度目は isExisting=true` | INSERT なし、既存行返却、tables 行数 1 | PASS | ✅ |
| 3 | findByIdempotencyKey | `findByIdempotencyKey: 該当行を返す` / `null` | 1 件 / null | PASS | ✅ |
| 4 | retry 1 回目 backoff | `incrementRetry: attempt < N で next_visible_at が指数バックオフ` | attempt=1, next=now+30s | PASS | ✅ |
| 5 | retry 2 回目 backoff | `incrementRetry: 2 回目はバックオフ 60s` | attempt=2, next=now+60s | PASS | ✅ |
| 6 | retry → DLQ 移送 | `incrementRetry: 上限超過で DLQ へ移送` | status='dlq', dlq_at 設定 | PASS | ✅ |
| 7 | terminal 行への retry no-op | `incrementRetry: terminal 行（resolved/rejected/dlq）には触らない` | moved='noop' | PASS | ✅ |
| 8 | moveToDlq 直接呼び出し | `moveToDlq: queued のみ DLQ 化` / `terminal は changed=false` | guarded | PASS | ✅ |
| 9 | listPending filter | `listPending: status='queued' かつ next_visible_at が now 以下のみ返す` | dlq / future を除外 | PASS | ✅ |
| 10 | listDlq filter | `listDlq: status='dlq' のみ返す` | 1 件のみ | PASS | ✅ |
| 11 | unidirectional violation | tagQueue.test.ts > `transitionStatus: resolved → reviewing は throw` | RangeError | PASS | ✅ |
| 12 | resolve confirmed (07a) | tagQueueResolve.test.ts > `T1 confirmed` | member_tags +N + audit 記録 | PASS | ✅ |
| 13 | resolve rejected (07a) | tagQueueResolve.test.ts > `T2 rejected` | reason 記録 + audit | PASS | ✅ |
| 14 | enqueue hook（03b 互換） | tagCandidateEnqueue.test.ts > `AC-8: enqueued=true` 等 | 4 ケース | PASS | ✅ |
| 15 | memberTags read-only 規約 | memberTags.readonly.test-d.ts (typecheck) | insert*/update*/delete*/upsert* 接頭辞の export なし | PASS | ✅ |
| 16 | aliasMap 仕様語 ↔ DB 語 | spec-extraction-map.md の固定 + TagQueueStatus enum | 1:1 対応 | PASS | ✅ |
| 17 | grep 不変条件 #5 | `grep -RIn "DB_BINDING\|d1\.prepare" apps/web/src` | 0 件 | grep/web-direct-d1.txt 参照 | ✅ |
| 18 | grep 不変条件 #13 | `grep -RIn "INSERT INTO member_tags ..." apps/api/src` | 既存 allow list（07a 経路）のみ | grep/membertags-write.txt 参照 | ✅ |
| 19 | migration 整合 | `grep tag_assignment_queue apps/api/migrations/*.sql` | 0002 + 0009 で全列定義済 | sql/migration-grep.txt 参照 | ✅ |

## 主証跡サマリー

- vitest: 49/49 PASS（本タスク対象範囲）
- typecheck: tsc --noEmit エラー 0 件（type-level test 含む）
- grep（#5）: 0 件
- grep（#13）: 本タスク新規 write 経路 0 件（既存 allow list のみ）
- migration grep: 全列が repository TypeScript 型と 1:1 対応

## screenshot 生成

なし（NON_VISUAL タスクのため、構造的に screenshot 不要）。
