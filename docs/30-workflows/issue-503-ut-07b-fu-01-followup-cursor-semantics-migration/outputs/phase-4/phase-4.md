# Phase 4: 統合テスト設計（cursor / remaining-scan A/B parity）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-05-07 |
| 状態 | spec-confirmed |
| 対象 | `apps/api/src/workflows/__tests__/schemaAliasBackfillBatch.test.ts`（既存ファイルへの追加 describe） |

## 目的

`BACKFILL_CURSOR_MODE` env で切り替えた cursor mode と既存 remaining-scan mode の双方が、`runBackfillBatch` の戻り値（公開契約 `BackfillBatchResult`）として完全に同一の出力を返すことを vitest シナリオで保証する。Phase 11 の staging evidence 取得前に、unit test 層で「内部実装が分岐しても外部契約は不変」であることを契約として確定する。

## Step 0: P50 チェック（必須）

```bash
mkdir -p outputs/phase-4

# 1) 既存 test ファイルの構造確認（追加挿入位置の把握）
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaAliasBackfillBatch \
  --reporter=verbose | tee outputs/phase-4/baseline-test.log

# 2) 既存 fixture 一覧
ls apps/api/src/workflows/__tests__/__fixtures__/ 2>/dev/null \
  | tee outputs/phase-4/fixture-listing.log
```

## 変更対象ファイル

| パス | 変更種別 |
| --- | --- |
| `apps/api/src/workflows/__tests__/schemaAliasBackfillBatch.test.ts` | 既存編集（describe 追加） |
| `apps/api/src/workflows/__tests__/__fixtures__/cursor-parity.ts`（新規予定） | 新規追加（fixture seed helper） |

> 既存 `apps/api/src/workflows/schemaAliasBackfillBatch.test.ts` の隣接配置でも可。Phase 13 で最終配置を決める。

## 追加 describe ブロック

| describe | 目的 | 対象 mode |
| --- | --- | --- |
| `BACKFILL_CURSOR_MODE=cursor` | cursor mode 単独で 100 / 1,000 行を処理し completed まで進むこと | cursor |
| `BACKFILL_CURSOR_MODE=remaining-scan`（既存 describe を流用） | 既存 baseline | remaining-scan |
| `A/B parity` | 同一 fixture を両 mode で実行し戻り値が deep equal | 両方 |
| `cursor mode dedupe collision` | dedupe_key 衝突時、cursor 更新が冪等であること | cursor |
| `cursor mode failed_items_json carryover` | 前回 batch で failed_items_json 残存時、次 batch でも cursor を進めず再試行対象に含めること | cursor |

## fixture シナリオ

| ID | 行数 | 特徴 | 期待 |
| --- | --- | --- | --- |
| FX-1 | 100 | 通常成功 | 1 batch で `status=completed` / `processed=100` |
| FX-2 | 1,000 | CPU budget 内で処理可 | 2-3 batch で completed、`needsReEnqueue` の遷移が両 mode で一致 |
| FX-3 | 1,000 + dedupe 衝突 1 件 | 同一 dedupe_key を持つ row 混在 | 衝突 row は skip、完了 row 数が両 mode で一致 |
| FX-4 | 100 + failed_items_json 残存 | 前 batch の failure 跡を seed | `retryCount` がインクリメントされ、`needsReEnqueue=true` |

## 期待値（A/B parity の deep equal 対象）

`runBackfillBatch` の戻り値 `BackfillBatchResult` のすべてのフィールド:

- `status` (`running` | `exhausted` | `completed` | `failed`)
- `processed`
- `remaining`
- `failedItems`（順序保証は responseId 昇順で正規化してから比較）
- `retryCount`
- `lastProcessedAt`（fixed timestamp を `vi.useFakeTimers()` で固定して比較）
- `needsReEnqueue`

加えて、`schema_diff_queue` row 終端状態の以下列が両 mode で一致すること:

- `backfill_status`
- `backfill_cursor`（cursor mode は値が入る、remaining-scan は null。**parity 比較対象から除外**）
- `last_processed_id`（cursor mode のみ。同上）
- `dedupe_key` / `failed_items_json` / `retry_count` / `last_error` / `last_processed_at`

> `backfill_cursor` / `last_processed_id` は内部 cursor 表現であり、`backfill.status` 公開契約には含まれない。parity 対象から明示的に除外する。

## EXPLAIN QUERY PLAN 取得方針

unit test 層では skip。Phase 11 の staging evidence で以下を取得:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "EXPLAIN QUERY PLAN SELECT ... FROM response_fields WHERE stable_key = ?1 AND id > ?2 LIMIT ?3"
```

cursor mode が `USING INDEX` で O(batch_size) スキャンになることを確認する。

## 入出力

| 入力 | 値 |
| --- | --- |
| env | `BACKFILL_CURSOR_MODE=cursor` / `remaining-scan` / 未設定 / 不正値 |
| fixture | 上記 FX-1〜FX-4 |
| 出力 | `BackfillBatchResult` deep equal / D1 row 終端状態 deep equal |

## テスト実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaAliasBackfillBatch
```

期待: 全 describe ブロックが PASS。A/B parity describe ブロックでは両 mode の戻り値が deep equal。

## 期待 evidence ファイル（Phase 11 で実機取得）

- `outputs/phase-4/baseline-test.log`
- `outputs/phase-4/fixture-listing.log`
- `outputs/phase-11/cursor-mode-test.log`（Phase 11 取得）
- `outputs/phase-11/parity-test.log`（Phase 11 取得）

## DoD（完了定義）

- [ ] 5 describe ブロックの設計表が確定
- [ ] FX-1〜FX-4 の seed 仕様が確定
- [ ] A/B parity の deep equal 対象 / 除外フィールドが確定
- [ ] EXPLAIN QUERY PLAN は Phase 11 staging で取得する方針が明記
- [ ] 起票元 §5 機能要件「両 mode で test PASS」「API contract 不変」を充足する設計

## 次 Phase の前提条件

Phase 5 で 0015 migration を確定し、Phase 6 / 7 で repository / workflow 実装仕様を書く。Phase 4 の describe / fixture 設計が両 Phase の契約となる。
