# Phase 10: 単体テスト実装仕様（vitest）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 作成日 | 2026-05-07 |
| 状態 | spec_created |
| 親 Issue | #503 |

## 目的

`schemaAliasBackfillBatch` の cursor mode / parity / fallback を vitest で決定論的に検証する。
shadow flag `BACKFILL_CURSOR_MODE`（`remaining-scan` / `cursor` / 不正値）の 3 経路に対し、cursor 進行・cursor null 開始・不正 env fallback・失敗 row 含む batch・dedupe 衝突 の最低 5 ケースを追加する。

## Step 0: P50 チェック（必須）

- [ ] `apps/api/src/workflows/schemaAliasBackfillBatch.ts` 存在
- [ ] `apps/api/src/repository/schemaDiffQueue.ts` 存在
- [ ] `apps/api/src/workflows/__tests__/schemaAliasBackfillBatch.test.ts`（または同等 spec ファイル）の場所確認
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test --run --list` で対象 suite が解決される
- [ ] log: `outputs/phase-10/p50-precheck.log`

## vitest テストケース仕様

| # | test case 名 | 経路 | 入力 | 期待 |
| --- | --- | --- | --- | --- |
| TC-01 | `cursor mode advances last_processed_id deterministically` | `BACKFILL_CURSOR_MODE=cursor` | 初期 `last_processed_id=null` の queue 行 100 件、batch size=20 | 1 batch 後 cursor が 20 番目の row id に進行 / `retry_count=0` / 同一入力 2 回実行で diff 空 |
| TC-02 | `cursor mode starts from null on first invocation` | `BACKFILL_CURSOR_MODE=cursor` | cursor 列が NULL の初回 batch | NULL → 最小 id から順に処理 / cursor が batch 完了時に確定 |
| TC-03 | `invalid env value falls back to remaining-scan` | `BACKFILL_CURSOR_MODE=invalid_xxx` | 任意の queue 行 | remaining-scan 経路で処理完了 / warning log 出力 / test exit code 0 |
| TC-04 | `failed rows in batch leave cursor at last successful id` | `BACKFILL_CURSOR_MODE=cursor` | 5/20 row が失敗するよう mock | cursor は最後に成功した row id に留まる / `failed_items_json` に 5 件記録 / `retry_count` インクリメント / 次 batch で失敗 row も再対象に含まれる |
| TC-05 | `dedupe collision does not skip cursor advance` | `BACKFILL_CURSOR_MODE=cursor` | 同一 dedupe key を持つ row が batch 内に重複 | dedupe で skip された row があっても cursor は batch 末尾まで進行 / dedupe が cursor 進行を阻害しない |

## 実行コマンド

```bash
mkdir -p outputs/phase-10
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaAliasBackfillBatch \
  2>&1 | tee outputs/phase-10/vitest-result.log
echo "exit=$?" | tee -a outputs/phase-10/vitest-result.log
# 期待: 全 TC PASS / exit=0
```

## parity 要件

- remaining-scan 経路で実行した場合の最終 row 処理結果（成功 / 失敗の集合）と cursor 経路で実行した場合の最終 row 処理結果が一致する（順序差は許容）。
- 既存 vitest（remaining-scan 想定）が壊れていないこと（regression 防止）。

## 期待 coverage 増分

best-effort（強制値は要求しない）:
- `schemaAliasBackfillBatch.ts` の line coverage が現行から +5pt 程度
- cursor 関連 branch（env 分岐 / cursor null / failed row）が 100% カバーされる

## assert すべき決定論性

- `retry_count` の値（成功時 0、失敗時インクリメント値）
- `last_processed_id` cursor 値（batch 完了時の確定値）
- `failed_items_json` の長さと内容

## 成果物

- `outputs/phase-10/phase-10.md`（本ファイル）
- `outputs/phase-10/vitest-result.log`（Phase 11 / 12 実行で生成）

## 次 Phase の前提条件

vitest が exit 0 となること。Phase 11 で staging runtime evidence 取得の前提条件として使用する。
