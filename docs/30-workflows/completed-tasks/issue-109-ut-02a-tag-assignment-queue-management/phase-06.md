# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 02 (parallel) |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | completed |
| 種別 | implementation, NON_VISUAL |

## 目的

`tag_assignment_queue` repository / workflow の異常系（DB error / idempotency conflict / retry exhausted / DLQ poison message / concurrent resolve race / 02a read-only 違反）を網羅し、**fail-closed**（失敗時は queue 状態を進めず audit に記録）を方針として確定する。member_tags への副次書込みは絶対に発火させない（不変条件 #13）。

## 実行タスク

1. failure case 表（10 件以上）
2. fail-closed 方針の整理
3. race condition 対策（guarded UPDATE）
4. retry/DLQ 境界（max retry 超過）
5. audit log への失敗記録ルール
6. recovery 動作

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/implementation-runbook.md | throw / changes=0 起点 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 制約 |
| 推奨 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/phase-06.md | 上流 resolve 異常系 |

## failure case 表

| # | case | trigger | 結果 | 期待動作 | recovery |
| --- | --- | --- | --- | --- | --- |
| 1 | DB error (prepare 失敗) | D1 binding 未注入 / SQL syntax | repository が throw | 呼び出し元へ伝播・queue 行は変化なし | log + retry |
| 2 | DB error (UNIQUE 衝突 / idempotency) | 同 idempotency_key で並行 INSERT | ON CONFLICT DO NOTHING で 0 行、既存行を SELECT 返却 | 副作用なし・既存 row を返す | 正常応答（idempotent） |
| 3 | idempotency conflict（payload 不一致） | 同 key で異なる payload | 既存行を返し新 payload は無視 | warn log + audit に `idempotency_payload_mismatch` | 上位で別 key 採番 |
| 4 | retry transient error | resolve 委譲先が一時失敗 | `incrementRetry` で retry_count+1, `next_visible_at` 更新 | backoff 後に再 visible | 自動 retry |
| 5 | retry exhausted | retry_count >= MAX_RETRY (=3) | `status='dlq'`, `dlq_at=now`, `last_error` 確定 | listPending から除外 | admin が DLQ console で確認 |
| 6 | DLQ poison message | DLQ row に対する誤再実行 | guarded WHERE `status='queued'` により changes=0 | 何も起きない（fail-closed） | manual 復旧時は明示的な `requeueFromDlq` API 経由 |
| 7 | concurrent resolve race | 同 id を二重 markResolved | 1 件のみ changes=1、他は changes=0 | 後勝ちなし | 敗者は no-op として 200 |
| 8 | concurrent resolve+reject race | markResolved と markRejected が並行 | 先勝ち、後者は changes=0 | 後者は ConflictError を投げず no-op | UI で list 再 fetch |
| 9 | unidirectional 違反 | resolved → rejected 直接遷移 | guarded WHERE で弾く（changes=0） | 状態変化なし | 不正経路として 409 を上流に返す（07a 側で表面化） |
| 10 | 02a memberTags.ts への write 試行 | 開発者が誤って insert/update を追加 | type-level test 失敗 / boundary lint 失敗 | CI で fail | review でブロック |
| 11 | next_visible_at 改竄 / clock skew | system clock が後退 | `now` を repository 引数で受け取り deterministic | retry 早出は単発に留まる | clock 修正 |
| 12 | audit log INSERT 失敗 | constraint violation | repository は queue 状態を **進めない**（fail-closed） | 5xx + log | log 調査・retry |
| 13 | DLQ 移送中の再衝突 | retry と DLQ 移送の並行 | guarded UPDATE 1 つのみ成功 | 整合保たれる | - |

## fail-closed 方針

- repository の write 系は **すべて guarded UPDATE / INSERT ON CONFLICT** で行い、changes=0 を「失敗ではなく no-op」として呼び出し元に返す
- `markResolved` / `markRejected` の changes=0 は **後段副作用（member_tags 書込み・audit）を発火させない**（不変条件 #13）
- retry 例外は queue 状態を `queued` のまま留め、`retry_count` だけ更新する
- DLQ 移送は終端状態であり、自動復旧経路を持たない（手動 requeue API のみ）

## race condition 対策

- 状態遷移はすべて `WHERE status='queued'` を含む guarded UPDATE
- `incrementRetry` も `WHERE status='queued'` 限定（dlq/resolved/rejected 行には触らない）
- 同 `idempotency_key` の並行 INSERT は UNIQUE 制約 + ON CONFLICT DO NOTHING で吸収
- `listPending` は `next_visible_at <= now` 条件で重複ピックを防ぎ、ピック直後に guarded UPDATE を打つ「pick→claim」パターンを採用

## audit log への失敗記録

| event | 記録項目 |
| --- | --- |
| `queue.enqueue.idempotent_hit` | id, idempotency_key, member_id, source |
| `queue.enqueue.payload_mismatch` | id, idempotency_key, diff summary |
| `queue.retry.incremented` | id, retry_count, last_error |
| `queue.retry.dlq_moved` | id, retry_count, last_error, dlq_at |
| `queue.race.lost` | id, attempted_status |
| `queue.dlq.requeue` | id, actor_user_id |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスへ |
| Phase 8 | unit / integration test で各 case 検証 |

## 多角的チェック観点

| 不変条件 | 異常系担保 | 検証 |
| --- | --- | --- |
| #5 | 全 throw / catch が apps/api 内 | grep |
| #13 | DLQ / race lost / unidirectional 違反で member_tags 書込みが発火しない | integration test |
| 02a read-only | type-level test と boundary lint | CI |
| audit | 全失敗 case に audit エントリ | unit test |
| fail-closed | changes=0 は副作用なし | unit |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 表 | 6 | pending | 13 case |
| 2 | fail-closed 方針 | 6 | pending | guarded write |
| 3 | race condition | 6 | pending | WHERE 句 + pick→claim |
| 4 | retry/DLQ 境界 | 6 | pending | MAX_RETRY |
| 5 | audit 記録 | 6 | pending | 6 event |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure case + fail-closed + recovery |
| メタ | artifacts.json | Phase 6 を completed |

## 完了条件

- [ ] failure case 13 件以上
- [ ] 各 case に recovery
- [ ] fail-closed 方針が明文化
- [ ] race / retry / DLQ 境界の対策明記
- [ ] audit log 記録ルール

## タスク100%実行確認

- 全 case に期待動作 + recovery
- artifacts.json で phase 6 を completed

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ: failure case を AC × 検証手段へ
- ブロック条件: 異常系未網羅なら差し戻し
