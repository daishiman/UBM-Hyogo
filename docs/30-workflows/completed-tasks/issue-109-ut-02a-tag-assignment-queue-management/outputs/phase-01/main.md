# Phase 1: 要件定義 — 成果物

## メタ

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| visualEvidence | NON_VISUAL |
| 状態 | completed |

## scope（入出力 / status code）

- 入力（enqueue）: `{ memberId, responseId, source: 'forms_sync' }`（既存 02b 実装は `suggestedTagsJson` も受ける）。
- 出力: `{ enqueued: boolean, queueId?, reason?: 'has_tags' | 'has_pending_candidate' }`（既存 `enqueueTagCandidate` の戻り値と整合）。
- 状態: 既存 02b では `queued / reviewing / resolved / rejected`、本タスクでは仕様語 `candidate / confirmed / rejected (+ dlq)` を alias で扱う。
- error: 400（zod 違反）/ 409（state conflict）/ 422（FK 不整合）/ 500（D1 エラー）。

## 状態遷移表（要件レベル）

| from | to | 条件 | 担当 |
| --- | --- | --- | --- |
| (none) | queued | enqueue valid + idempotency miss | 本タスク |
| (none) | queued (existing) | idempotency hit（`(memberId)` 既存 pending row 返却。実装上は `has_pending_candidate` 拒否） | 本タスク |
| queued | reviewing | admin が手動でレビュー開始 | 既存 02b |
| queued | resolved | 07a confirm | 07a（実装済み） |
| queued | rejected | 07a reject | 07a（実装済み） |
| queued | dlq | retry 上限超過（本タスクで導入） | 本タスク |
| resolved → * | × | 不可（不変条件 #13） | 拒否 |
| rejected → * | × | 不可 | 拒否 |
| dlq → queued | 手動 requeue（将来） | 別 Issue |

## AC quantitative 化

- AC-1: `enqueue / findById / listQueue / transitionStatus` の各関数が repository から提供される（既存）。本タスクで `findByIdempotencyKey / listPending / listDlq / moveToDlq / incrementRetry` を新規追加。
- AC-2: 不正遷移は throw（既存 `transitionStatus` で `RangeError`）。
- AC-3: 同一 memberId の pending 二重投入は新規行を作らず既存 `enqueueTagCandidate` の `has_pending_candidate` で吸収。本タスク追加: `idempotency_key` UNIQUE による厳密な重複防止。
- AC-4: retry が指数バックオフ（30s, 60s, 120s）で 3 回まで、4 回目で DLQ 移送。
- AC-5: 02a `memberTags.ts` の export に `insert*/update*/delete*` などの命名による write API を追加しないことを type-level test で固定。**既存に `assignTagsToMember` が存在するため、本 read-only 制約は名前空間規則で再定義し、既存関数は 07a workflow 専用 helper として後方互換維持**（差分は spec-extraction-map に記録）。
- AC-6: dependency-cruiser / grep で `apps/web` から repository を import しないことを担保。
- AC-7: `audit_log` に `admin.tag.queue_enqueued / queue_resolved / queue_rejected / queue_dlq_moved` を記録（既存 07a workflow 内）。
- AC-8: 仕様語↔実装語対応表を phase-02 spec-extraction-map.md に固定。
- AC-9: migration grep 表を phase-02 migration-grep-table.md に固定。
- AC-10: `enqueueTagCandidate(env, payload)` を public API として export（既存実装済み、03b sync hook から呼ばれる）。

## visualEvidence

- `NON_VISUAL`（artifacts.json で固定済）。screenshot 不要。
- artifact: vitest 出力 / SQL grep / type test 結果。

## true issue（4 件）

1. **idempotency 単位**: 採用 `(memberId, responseId)`。現行 candidate row は `suggested_tags_json='[]'` で admin が tagCode を後から確定するため、投入時点では tagCode を key に含めない。本タスクで `idempotency_key` 列追加 (`<memberId>:<responseId>`) して厳密化。
2. **retry / DLQ 保存形態**: 同一 table の `status='dlq'` + `attempt_count` / `last_error` / `next_visible_at` / `dlq_at` 列を ALTER TABLE で追加（migration コスト最小）。
3. **02a read-only 制約**: 既存 `memberTags.ts` には `assignTagsToMember` write 関数が既存。これは 07a `tagQueueResolve` workflow で利用される。仕様書の「read-only」は厳密には「`apps/web` から呼び出し不可・workflow 経由のみ」を意味すると再解釈。新規 write 関数の追加禁止を type-level test で担保。
4. **enqueue 同期/非同期**: forms sync 完了 hook で同期実行（無料枠内・即時性優先）。

## 完了条件

- [x] AC 10 件すべて quantitative
- [x] 状態遷移表が 6 行以上
- [x] visualEvidence = `NON_VISUAL`
- [x] true issue 4 件
- [x] 02a read-only 担保方針の明示

## 既存実装との差分（重要）

| 項目 | 仕様書 | 既存実装 | 採用方針 |
| --- | --- | --- | --- |
| repository path | `apps/api/src/repositories/tagAssignmentQueue.ts` | `apps/api/src/repository/tagQueue.ts` | **既存規約 `repository/`（単数）に合わせる** |
| 状態語 | candidate / confirmed / rejected | queued / reviewing / resolved / rejected | alias で吸収（既存値を維持） |
| idempotency_key 列 | 必須 | 未存在 | 新規 ALTER TABLE で追加 |
| retry/DLQ 列 | 必須 | 未存在 | 新規 ALTER TABLE で追加 |
| memberTags read-only | strict | `assignTagsToMember` 既存 | 新規 write 追加禁止に再解釈 |

## 4 条件

| 条件 | 判定 |
| --- | --- |
| 価値性 | PASS — Forms→tag 反映の左半分を成立 |
| 実現性 | PASS — 既存 02b schema を ALTER TABLE で拡張可能 |
| 整合性 | PASS — 不変条件 #5 / #13 維持 |
| 運用性 | PASS — retry / DLQ / idempotency が運用に耐える |
