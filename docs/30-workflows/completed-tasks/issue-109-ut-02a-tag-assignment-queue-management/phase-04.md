# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 02 (parallel) |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |
| 種別 | implementation, NON_VISUAL |

## 目的

`tag_assignment_queue` の CRUD / 状態遷移（candidate → confirmed/rejected, DB 実装語: queued → resolved/rejected/dlq）/ idempotency key / retry / DLQ を verify する 4 層テスト戦略を定義する。同時に、02a `apps/api/src/repositories/memberTags.ts` が **read-only** であることを type-level test で保証し、不変条件 #13（`member_tags` への書き込みは 07a queue resolve 経由のみ）が repository 層から侵されないことを担保する。

## 実行タスク

1. unit / contract / integration / type-level test の分担マトリクス整理
2. queue CRUD（create / find / list / updateStatus）の test scenario 設計
3. 状態遷移 unidirectional ガード test 設計
4. idempotency key 衝突時の test scenario 設計
5. retry / DLQ 移送 test scenario 設計
6. 02a memberTags.ts read-only 型レベル test の設計
7. mock / fixture 戦略（D1 mock, miniflare, queue fixture）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 テーブル設計 / queue schema |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | queue 管理 admin オペレーション |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | tag 状態遷移仕様 |
| 必須 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/phase-04.md | 上流 resolve 側 test 規約 |
| 推奨 | apps/api/migrations/*.sql | 実 DDL の整合確認 |
| 推奨 | outputs/phase-02/queue-state-machine.md | 状態遷移図 |
| 推奨 | outputs/phase-01/main.md | AC quantitative |

## 4 層 verify suite 設計

| layer | tool | scope | 担当 |
| --- | --- | --- | --- |
| unit | vitest | repository 関数単位（CRUD / state transition guard / idempotency / retry counter / DLQ 判定） | Phase 8a |
| contract | vitest + zod | repository 戻り値 shape / queue row schema | Phase 8a |
| integration | vitest + miniflare D1 | 実 D1 binding 越しの insert/update、idempotency key UNIQUE 制約、UPDATE WHERE status guard の race | Phase 8a |
| type-level | tsd / `expectTypeOf` | 02a `memberTags.ts` の export 型に write 関数が含まれない / `Readonly` シグネチャ維持 | Phase 8a |

## test 計画

### queue CRUD

| test name | layer | 期待 |
| --- | --- | --- |
| `tagQueueRepo.create_returns_inserted_row` | unit | 新規行が `status='queued'`, `retry_count=0`, `dlq_at=NULL` で作成される |
| `tagQueueRepo.findById_returns_row` | unit | id で 1 件取得 |
| `tagQueueRepo.listPending_filters_by_status` | unit | `status='queued'` のみ返す |
| `tagQueueRepo.listDlq_returns_dlq_rows` | unit | `status='dlq'` のみ返す |
| `tagQueueRepo.create_persists_row` | integration | miniflare D1 で行が永続化 |

### 状態遷移（unidirectional）

| test name | layer | 期待 |
| --- | --- | --- |
| `state.queued_to_resolved_ok` | unit | candidate → confirmed: changes=1 |
| `state.queued_to_rejected_ok` | unit | candidate → rejected: changes=1 |
| `state.resolved_to_rejected_blocked` | unit | confirmed → rejected: changes=0（WHERE 句で弾く） |
| `state.rejected_to_resolved_blocked` | unit | rejected → confirmed: changes=0 |
| `state.dlq_to_queued_blocked` | unit | dlq → queued: changes=0（manual 復旧のみ） |
| `state.race_only_one_wins` | integration | 並行 UPDATE で changes=1 が 1 回だけ |

### idempotency

| test name | layer | 期待 |
| --- | --- | --- |
| `idempotency.same_key_returns_existing` | unit | 同 `idempotency_key` で create 再呼び出し → 既存行を返し新規 INSERT しない |
| `idempotency.unique_constraint_enforced` | integration | UNIQUE(idempotency_key) 制約違反は repository 側で吸収して既存行を返す |
| `idempotency.distinct_keys_create_distinct_rows` | unit | 異なる key は別行 |

### retry / DLQ

| test name | layer | 期待 |
| --- | --- | --- |
| `retry.increment_retry_count` | unit | `retry_count` が +1 され、`last_error` に直近 message 保存 |
| `retry.exponential_backoff_next_visible_at` | unit | `next_visible_at = now + base * 2^retry_count` を返す |
| `retry.max_exceeded_moves_to_dlq` | unit | `retry_count >= MAX_RETRY` の retry 呼び出しで `status='dlq'`, `dlq_at=now` |
| `dlq.poison_message_isolated` | integration | DLQ 行は `listPending` に出ない |

### type-level (02a memberTags.ts read-only)

| test name | layer | 期待 |
| --- | --- | --- |
| `types.memberTagsRepo_no_insert_export` | type-level | `insert` / `update` / `delete` symbol を export しない（`expectTypeOf<typeof import('memberTags')>().not.toHaveProperty('insert')`） |
| `types.memberTagsRepo_returns_readonly` | type-level | `findByMemberId` 戻り値が `ReadonlyArray<MemberTag>` |
| `types.queueRepo_writes_only_queue_table` | type-level | tagQueue repository の write API が `member_tags` 型を引数に取らない |

## mock / fixture 戦略

| 対象 | 戦略 |
| --- | --- |
| D1 binding | unit は in-memory mock（`prepare().bind().run()` の最小 stub）、integration は miniflare の D1 emulator |
| time source | `injectClock()` で `now` を固定し、retry backoff / dlq_at を deterministic に検証 |
| idempotency key | `crypto.randomUUID()` を DI 化し fixed key を渡す |
| queue fixture | `fixtures/queue.ts` に `queued / resolved / rejected / dlq` 各状態の row factory を用意 |
| migration | integration test 起動時に `apps/api/migrations/*.sql` を順に apply |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | test 名を実装 assertion 文言に転写 |
| Phase 6 | 各 test の失敗 path を異常系 case へ |
| Phase 7 | AC × test の対応 |
| Phase 8 | 全 layer の実行 |

## 多角的チェック観点

| 不変条件 | test 観点 | 検証方法 |
| --- | --- | --- |
| #5 | repository / workflow が apps/api 内、apps/web から D1 直接呼び出しなし | grep + ESLint boundary |
| #13 | `member_tags` への INSERT/UPDATE/DELETE が本 repository から発火しない | type-level + grep |
| 02a read-only | `memberTags.ts` の export に write 関数なし | type-level test |
| idempotency | 同 key 再投入で副作用なし | unit + integration |
| retry/DLQ | max retry 超過で DLQ 移送 | unit |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 計画 | 4 | pending | CRUD / state / idempotency / retry |
| 2 | contract test | 4 | pending | row shape |
| 3 | integration test | 4 | pending | miniflare D1 |
| 4 | type-level test | 4 | pending | memberTags.ts read-only |
| 5 | mock/fixture 戦略 | 4 | pending | D1 / clock / fixture |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | サマリー |
| ドキュメント | outputs/phase-04/test-strategy.md | 4 層 + 17 test 計画 |
| メタ | artifacts.json | Phase 4 を completed |

## 完了条件

- [ ] 4 layer × 17 test 以上が確定
- [ ] AC 各項目に verify 手段が紐づく
- [ ] 不変条件 #5, #13 に test 観点
- [ ] 02a memberTags.ts read-only を type-level で担保

## タスク100%実行確認

- 全成果物が outputs/phase-04 配下
- artifacts.json で phase 4 を completed

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ: test 計画を実装 assertion 文言に
- ブロック条件: AC × test 対応漏れなら差し戻し
