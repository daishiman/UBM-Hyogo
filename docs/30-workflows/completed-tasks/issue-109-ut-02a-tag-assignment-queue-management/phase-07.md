# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 02 (parallel) |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | completed |
| 種別 | implementation, NON_VISUAL |

## 目的

index.md / Issue #109 で定義する AC を、test（Phase 4）× 実装（Phase 5）× 異常系（Phase 6）× 不変条件 で一対一対応させ、抜け漏れゼロを担保する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | 本タスクの scope / AC / 依存関係 |
| 必須 | outputs/phase-04/test-strategy.md | test 名 |
| 必須 | outputs/phase-05/implementation-runbook.md | code 配置 |
| 必須 | outputs/phase-06/main.md | 異常系 case |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | state alias 仕様 |
| 推奨 | ../README.md | Wave 全体の実行順 |

## AC マトリクス（AC × 検証手段 × 担当 Phase）

| AC | 内容 | 検証 (Phase 4 test) | 実装 (Phase 5 code) | 異常系 (Phase 6 case) | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | queue CRUD: create / findById / findByIdempotencyKey / listPending / listDlq | unit `tagQueueRepo.create_returns_inserted_row` / `findById_returns_row` / `listPending_filters_by_status` / `listDlq_returns_dlq_rows`、integration `create_persists_row` | `apps/api/src/repositories/tagAssignmentQueue.ts` (CRUD) | case #1 DB error | #5 |
| AC-2 | 状態遷移 unidirectional: candidate(queued) → confirmed(resolved) / rejected | unit `state.queued_to_resolved_ok` / `state.queued_to_rejected_ok` / `state.resolved_to_rejected_blocked` / `state.rejected_to_resolved_blocked` / `state.dlq_to_queued_blocked` | `markResolved` / `markRejected`（guarded WHERE `status='queued'`） | case #7-#9 race / unidirectional 違反 | #13 |
| AC-3 | idempotency key で同一投入の副作用なし | unit `idempotency.same_key_returns_existing` / `idempotency.distinct_keys_create_distinct_rows`、integration `idempotency.unique_constraint_enforced` | `createIdempotent`（INSERT ... ON CONFLICT DO NOTHING + SELECT） | case #2 / #3 idempotency conflict | #5 |
| AC-4 | retry は指数バックオフで 3 回まで再試行し、最終失敗を DLQ として pending から隔離 | unit `retry.increment_retry_count` / `retry.exponential_backoff_next_visible_at` / `retry.max_exceeded_moves_to_dlq`、integration `dlq.poison_message_isolated` | `incrementRetry` + `tickRetry` workflow（MAX_RETRY=3） | case #4 transient error / #5 retry exhausted / #6 DLQ poison | fail-closed |
| AC-5 | 02a `memberTags.ts` は read-only のまま維持 | type-level `types.memberTagsRepo_no_insert_export` / `types.memberTagsRepo_returns_readonly` / `types.queueRepo_writes_only_queue_table` | `memberTags.ts` に write 関数を export しない（02a 既存） | case #10 read-only 違反 | #13 |
| AC-6 | D1 直接アクセスは `apps/api` 内に閉じ、`apps/web` から本 repository を import しない | boundary lint + grep | repository / workflow を apps/api 配下に配置 | case #11 boundary violation | #5 |
| AC-7 | enqueue / status 遷移 / DLQ 移送は audit_log に観測点を残す | unit (audit 観点で each enqueue / transition / retry / dlq event を assert) | repository write 後に audit_log INSERT（fail-closed: queue 進行と同 tx） | case #12 audit INSERT 失敗 | 監査 |
| AC-8 | 仕様語 `candidate / confirmed / rejected` と実装語 `queued / resolved / rejected / dlq` の対応表を route / repository / migration で固定 | aliasMap unit + grep `queued\\|resolved\\|rejected\\|dlq` | `aliasMap.ts` + shared schema + migration CHECK | case #13 alias drift | #13 |
| AC-9 | migration SQL と repository column / type が完全一致 | grep table + migration dry-run | `apps/api/migrations/NNNN_tag_assignment_queue.sql` + `tagAssignmentQueue.ts` | case #1 migration drift | #5 |
| AC-10 | 03b Forms sync hook から `enqueueTagCandidate(env, payload)` を 1 行で呼べる public API を export | contract test `formsSync_can_call_enqueueTagCandidate` | `apps/api/src/workflows/tagAssignmentQueue.ts` export | case #14 hook signature drift | #5 / #13 |

## 不変条件 → AC マッピング

| 不変条件 | 内容 | 対応 AC | 担保 |
| --- | --- | --- | --- |
| #5 | D1 直接アクセスは `apps/api` に閉じる | AC-1, AC-3, AC-6, AC-9, AC-10 | repository / workflow / migration を apps/api 配下に集約、boundary lint |
| #13 | `member_tags` への書込みは 07a queue resolve 経由のみ（02a memberTags.ts は read-only） | AC-2, AC-5, AC-8, AC-10 | 02a memberTags.ts に write export を持たせず type-level で固定、本 repository は queue table のみ操作、unidirectional guard |

## 検証手段サマリー（3 列）

| AC | 検証手段 | 担当 Phase |
| --- | --- | --- |
| AC-1 | unit + integration | 4 / 8a |
| AC-2 | unit (state) | 4 / 8a |
| AC-3 | unit + integration | 4 / 8a |
| AC-4 | unit | 4 / 8a |
| AC-5 | type-level | 4 / 8a |
| AC-6 | boundary lint + grep | 4 / 10 (gate) |
| AC-7 | unit (audit) | 4 / 8a |
| AC-8 | aliasMap unit + grep | 4 / 9 |
| AC-9 | migration dry-run + grep table | 5 / 11 |
| AC-10 | contract test | 4 / 8a |

## 抜け漏れチェック

- [x] 全 10 AC に検証手段
- [x] 全 10 AC に実装位置
- [x] 不変条件 #5 / #13 に対応 AC 紐付け
- [x] 02a memberTags.ts read-only を type-level + 異常系 case で二重担保
- [x] retry / DLQ / idempotency すべてに test と異常系 case
- [x] race condition に対応する integration test と異常系 case

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化対象（state guard / audit emit の共通化） |
| Phase 10 | gate 判定（CI で全 AC 検証通過） |

## 多角的チェック観点

| 不変条件 | チェック | 結果 |
| --- | --- | --- |
| #5 | AC-6, AC-9, AC-10 で apps/api 集約 | pending |
| #13 | AC-2, AC-5, AC-8, AC-10 で member_tags 不可侵 | pending |
| 監査 | AC-7 で全 transition / failure に audit | pending |
| idempotency / retry / DLQ | AC-3, AC-4 でカバー | pending |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC マトリクス（5 列） | 7 | pending | AC × test × code × 異常系 × 不変条件 |
| 2 | 不変条件 → AC マッピング | 7 | pending | #5 / #13 |
| 3 | 検証手段 3 列サマリー | 7 | pending | AC × 手段 × Phase |
| 4 | 抜け漏れチェック | 7 | pending | 6 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリー |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 × 異常系 × 不変条件 |
| メタ | artifacts.json | Phase 7 を completed |

## 完了条件

- [ ] AC 10 件 × 5 列マトリクス
- [ ] 不変条件 #5 / #13 → AC マッピング
- [ ] AC × 検証手段 × 担当 Phase の 3 列マトリクス
- [ ] 抜け漏れ 0

## タスク100%実行確認

- 全 AC に行
- artifacts.json で phase 7 を completed

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ: AC が同 module に集中する箇所（state guard / audit emit）を抽出
- ブロック条件: 抜け漏れ未解消なら差し戻し

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する
