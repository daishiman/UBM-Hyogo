# Phase 8 成果物 — DRY 化 / リファクタリング

## 1. DRY 観点レビュー

| 候補 | 判断 | 詳細 |
| --- | --- | --- |
| `runSync()` を scheduled / route 双方から呼ぶ | DONE | core 1 関数に集約 (sync-sheets-to-d1.ts) |
| upsert SQL を関数 1 箇所に集約 | DONE | `upsertMembers()` 内のみで SQL 文字列を構築 |
| カラムリスト | DONE | `UPSERT_COLUMNS` / `ROW_FIELD_ORDER` を const 化し誤差混入を防止 |
| sync log の status 遷移 | DONE | `insertRunningLog` / `finishLog` / `finalizeSkipped` の 3 関数で集約 |
| retry / backoff | DONE | `with-retry.ts` の汎用化。UT-10 で formalize する余地あり (拡張ポイント明記) |

## 2. 過剰抽象化を避けた箇所

- `buildA1Ranges` は実装したが現在の `runSync` では使わず、将来 1 万行を超えた場合の拡張点として残す（Phase 9 free-tier の試算で 1 万行は範囲内）。
- `WriteQueue` に並列度パラメータを追加せず固定 1。並列化が必要になったら別タスクで設計し直す。

## 3. 命名の最終確認

- 公開シンボル: `runSync` / `chunk` / `upsertMembers` / `acquireSyncLock` / `releaseSyncLock` / `mapSheetRows` / `withRetry` / `WriteQueue` / `GoogleSheetsFetcher` / `adminSyncRoute`
- 命名衝突なし、すべて kebab-case ファイル名 + camelCase エクスポート

## 4. リファクタリング所感

- 当初設計通りに 8 モジュールへ分離でき、各モジュールが単一責任を保つ
- 副作用 (D1 / fetch) はすべて引数注入で差し替え可能 → テスト容易性を達成
- 追加抽象化は見送り。MVP として十分シンプル。
