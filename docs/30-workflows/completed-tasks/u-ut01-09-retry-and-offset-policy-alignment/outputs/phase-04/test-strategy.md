# Phase 4 成果物: テスト戦略（机上設計）

> ステータス: spec_created / docs-only / NON_VISUAL
> 入力: Phase 2 canonical 決定 + Phase 3 GO ゲート
> 本ファイルは UT-09 実装フェーズが取り込むべき検証スイートの机上設計。本タスク内でテスト実装・実行は行わない。

---

## 1. 検証 4 軸 → スイート V1〜V4

| 軸 | スイート ID | 検証対象 |
| --- | --- | --- |
| retry 最大回数（AC1）| V1 | `withRetry` の試行回数が 3 で止まる、`SYNC_MAX_RETRIES` 上書き反映 |
| Backoff curve（AC2）| V2 | base 1s / factor 2 / cap 32s / jitter ±20% / 1 tick 内収まり |
| `processed_offset` chunk index 再開（AC3）| V3 | chunk 進捗更新、failed 時の再開、行削除耐性 |
| quota / migration（AC4-AC5）| V4 | Sheets API req カウント、migration apply / rollback dry run |

---

## 2. V1: Retry 最大回数

### V1-1: 既定値が 3 で止まる
- 入力: `SYNC_MAX_RETRIES` 未設定 + upsert モック常時失敗
- 期待: `retryCount = 3`、status = failed、4 回目の試行は発生しない
- 実装場所: `apps/api/src/jobs/__tests__/sync-sheets-to-d1.spec.ts`（仮）

### V1-2: 環境変数上書き（staging）
- 入力: `SYNC_MAX_RETRIES = "5"` + 上記同
- 期待: `retryCount = 5`
- 目的: AC6 過渡期での staging 再校正運用が可能であることの確認

### V1-3: 不正値時の fallback
- 入力: `SYNC_MAX_RETRIES = "invalid"`
- 期待: `parseIntOrDefault` により既定 3 が使われる
- 該当コード: `parseIntOrDefault` 既存ロジック

---

## 3. V2: Backoff curve

### V2-1: 段階別 wait 値
- 入力: retry=1,2,3 でそれぞれ wait
- 期待: 1s / 2s / 4s（jitter ±20% 範囲内）
- 検証手段: モックタイマー（`vi.useFakeTimers()`）+ `setTimeout` spy

### V2-2: cap 適用
- 入力: retry max を 8 に上書きし wait シーケンスを観測
- 期待: 1, 2, 4, 8, 16, 32, 32, 32（cap 32s 以降は 32s 固定）

### V2-3: 1 tick 内収まり（机上）
- batch_size 100 × 想定 2000 行 = 20 chunks
- 1 chunk 最悪 1+2+4 = 7s + upsert 1s = 8s
- 20 chunks 直列 = 160s ≪ cron 6h
- 検証手段: 単体テストではなく Phase 9 quota 算定で証跡化

---

## 4. V3: `processed_offset` chunk index 再開

### V3-1: chunk 進捗更新
- 入力: 5 chunks 連続成功
- 期待: 各 chunk 完了後に `UPDATE sync_job_logs SET processed_offset = i+1 WHERE run_id = ?`
- 検証手段: D1 mock の `UPDATE` 呼び出し回数 = 5、最終値 = 5

### V3-2: 中断時の再開
- 入力: 10 chunks のうち chunk 6 で 3 連続失敗 → status = failed → 再実行
- 期待: 再実行時 chunk 0-5 は skip、chunk 6 から開始
- 検証手段: 再実行時に最初に `SELECT processed_offset` を呼び出す、loop が `for (i = 6; i < total; i++)` で開始

### V3-3: 行削除耐性
- 入力: chunk 内で行 3 件削除 → upsert 冪等
- 期待: chunk index は維持、削除行は upsert で no-op
- 検証手段: `total_rows` mismatch alert は別ケース（Phase 6）

### V3-4: monotonicity
- 入力: 並列実行（lock で防止される想定だが防御的に）で chunk index 巻き戻り
- 期待: `processed_offset` は単調増加、巻き戻し UPDATE は拒否（WHERE `processed_offset` < new_value）

---

## 5. V4: quota / migration

### V4-1: Sheets API req カウント
- 入力: 1 sync run（successful）
- 期待: `fetcher.fetchRange` 呼び出し回数 = 1
- 検証手段: fetcher mock の call count

### V4-2: 同時 2 sync 時の req カウント
- 入力: cron + 手動同時実行（lock で skip される想定）
- 期待: 1 sync は skipped 状態で fetcher 呼び出し 0 回
- 検証手段: V3 と同 spec 内 / `acquireSyncLock` の戻り値分岐

### V4-3: migration apply（dry run）
- 検証手段: `wrangler d1 migrations apply --local`（または `scripts/cf.sh d1 migrations apply` のローカル実行）
- 期待: `0003_processed_offset.sql` 適用後、`PRAGMA table_info(sync_job_logs)` に列が出現
- ※ 本タスクでは机上設計のみ、実 apply は UT-09 / U-UT01-07

### V4-4: backfill 不要確認
- 検証手段: 既存 `success` / `failed` / `running` 行に対し SELECT で `processed_offset = 0` 確認

---

## 6. coverage 代替指標（docs-only）

本タスクは docs-only のため Vitest / Jest line coverage は計測しない。代わりに以下を coverage 相当として評価:

| 指標 | 計測方法 |
| --- | --- |
| 検証スイート V1-V4 全 ID 数 / 設計 AC 数 | 13 件 / 6 AC = 2.17 ケース/AC（カバー深さ）|
| 各 AC が V スイート 1 つ以上で言及されること | AC1→V1 / AC2→V2 / AC3→V3 / AC4→V4-3,4 / AC5→V4-1,2 / AC6→V1-2 |
| Phase 6 失敗ケースが V スイートに wire-in | Phase 6 完了条件で確認 |

---

## 7. 検証コマンド集（机上のみ・実行しない）

```bash
# V1-V3 単体テスト（UT-09 実装後）
pnpm --filter api test -- sync-sheets-to-d1
# V4-3 migration dry run（UT-09 / U-UT01-07）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
# V4-1 fetcher call count はテストフレームワーク内で確認
```

---

## 8. 実行手順（UT-09 implementor 向け参照）

1. Phase 2 確定値を実装に反映（軸 1〜3）
2. V1〜V4 スイートを実装し全 PASS を確認
3. staging で過渡期 7 日 dry-run（R1）
4. failed 件数しきい値再校正後、production rollout

---

## 9. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | UT-09 ハンドオーバーランブックの「テスト追加項目」セクションへ V1-V4 を引き継ぎ |
| Phase 6 | 失敗ケースマトリクスと V スイートの wire-in |
| Phase 7 | AC マトリクスの coverage 列に V ID を記載 |

---

## 10. 完了条件チェック

- [x] V1-V4 4 軸スイート設計
- [x] 各 AC に V スイート 1 つ以上紐付け
- [x] coverage 代替指標明記
- [x] 検証コマンド集（実行はしない）
- [x] UT-09 への申し送り
- [x] コード変更なし
