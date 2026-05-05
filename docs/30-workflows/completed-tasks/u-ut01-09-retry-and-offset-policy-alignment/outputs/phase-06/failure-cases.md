# Phase 6 成果物: 失敗ケース整理

> ステータス: spec_created / docs-only / NON_VISUAL
> 入力: Phase 1 苦戦箇所 4 件、Phase 2 canonical 決定、Phase 4 検証スイート、Phase 5 ランブック Step A-F

---

## 1. 失敗ケースマトリクス

| # | 失敗カテゴリ | トリガ | 検出シグナル | 自動 / 手動対応 | wire-in |
| --- | --- | --- | --- | --- | --- |
| FC-1 | Sheets API 5xx 一時障害 | upstream | `error_code = '5xx'` / retry 試行 | 自動: retry 3 回 / backoff 1-32s | V1, V2 |
| FC-2 | Sheets API quota_exhausted | quota 超過 | HTTP 429 / `error_code = 'quota_exhausted'` | 自動: backoff で時間分散、3 fail で failed 確定 | V1, V4-1 |
| FC-3 | Sheets API auth_error | SA token 失効 | HTTP 401 / `error_code = 'auth_error'` | 自動 retry 不適合 → 即 failed、手動: SA 再発行 | V1（retry skip） |
| FC-4 | D1 SQLITE_BUSY | 並列書込 / lock | `error_code = 'sqlite_busy'` | 自動: retry 3 回 | V1, V2 |
| FC-5 | Workers CPU 上限到達 | 大量 chunk 直列 | scheduled handler timeout | 自動: 部分完了 + `processed_offset` 進捗、次 tick で再開 | V3-2 |
| FC-6 | mapping_error（schema drift） | フォーム項目変更 | `error_code = 'mapping_error'` | 自動 retry 不適合 → 即 failed、手動: schema 追補 | V1（retry skip） |
| FC-7 | chunk 進捗更新失敗 | `processed_offset` UPDATE が SQLITE_BUSY | UPDATE retry または warn ログ | 自動: warn + 次回 tick で chunk 再 upsert（冪等）| V3-1 |
| FC-8 | failed → 再開時の chunk 再開 | failed status の再実行 | `processed_offset > 0` の SELECT | 自動: 該当 chunk から開始 | V3-2 |
| FC-9 | Sheets 行削除 chunk 内 | Sheets 編集 | upsert で no-op、件数差分 | 自動: 冪等 upsert で吸収 | V3-3 |
| FC-10 | Sheets 行削除 chunk 跨ぎ大量 | Sheets 一括削除 | `total_rows` mismatch | 自動: warn ログ、手動: full backfill 起動 | V3-4 補助 |
| FC-11 | stale lock（in_progress 取り残し） | Workers 強制終了 | `lock_expires_at < now` の running 行 | 自動: cron 開始時に failed 強制遷移 | 既存 lock 処理 |
| FC-12 | 同時実行（cron + 手動） | UI 操作 + cron 同時 | `acquireSyncLock` 失敗 | 自動: skipped 返却 | V4-2 |
| FC-13 | `SYNC_MAX_RETRIES` 不正値 | env typo | `parseIntOrDefault` fallback | 自動: 既定 3 適用 | V1-3 |
| FC-14 | migration 列不在で再開ロジック実行 | migration 未適用 | SELECT で列なしエラー | 自動: 例外で failed、手動: migration apply | （migration 整合は V4-3） |

---

## 2. 検出シグナルのログ JSON フォーマット例

```json
{
  "timestamp": "2026-05-01T03:00:00.000Z",
  "run_id": "550e8400-e29b-41d4-a716-446655440000",
  "trigger_type": "cron",
  "status": "failed",
  "retry_count": 3,
  "processed_offset": 6,
  "error_code": "quota_exhausted",
  "error_message": "Quota exceeded for quota metric 'Read requests' ...",
  "duration_ms": 8400
}
```

- `processed_offset = 6` は chunk 6 まで完了（行 0-599）を意味する
- `retry_count = 3` は canonical 上限到達 = failed 確定
- `error_code` は FC マトリクスの分類軸

---

## 3. 残存リスクと Phase 12 unassigned 候補

| リスク | 既存タスクで吸収 | 新 unassigned 候補 |
| --- | --- | --- |
| FC-3 / FC-6 の retry skip 分岐実装 | UT-09 | - |
| FC-10 の full backfill 自動起動 | UT-09 backfill endpoint | あり: 「`total_rows` mismatch alert と自動 full backfill」を Phase 12 で起票候補化 |
| FC-14 の migration apply gate | UT-09 / U-UT01-07 | - |
| stale lock TTL 値の現実校正 | UT-08 監視 | あり: 「stale lock TTL の実測ベース再校正」候補 |

---

## 4. 各ケース ↔ 検証スイート / Step wire-in

| FC | V スイート | Phase 5 Step |
| --- | --- | --- |
| FC-1, FC-2, FC-4 | V1, V2 | Step B, C |
| FC-3, FC-6, FC-13 | V1-3（fallback）| Step C |
| FC-5 | V3-2 | Step D, E |
| FC-7, FC-8, FC-9 | V3 全般 | Step D, E |
| FC-10 | V3-4 補助 | Step E + Phase 12 unassigned |
| FC-11, FC-12 | V4-2 | 既存 lock 処理（変更なし） |
| FC-14 | V4-3 | Step A |

---

## 5. 実行手順（参考）

UT-09 implementor は本マトリクスを実装時の defensive case リストとして使用し、テスト追加時に FC ID を test name に含める（例: `it("FC-2: quota_exhausted で 3 retry 後 failed", ...)`）。

---

## 6. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC マトリクスの「失敗ケース」列に FC ID 記載 |
| Phase 9 | quota worst case 算定で FC-2 を考慮 |
| Phase 12 | unassigned 候補（FC-10、stale lock TTL 校正）を起票 |

---

## 7. 完了条件チェック

- [x] FC マトリクス 14 件
- [x] ログ JSON フォーマット例
- [x] 残存リスク → unassigned 候補化
- [x] V スイート / Step wire-in
- [x] コード変更なし
