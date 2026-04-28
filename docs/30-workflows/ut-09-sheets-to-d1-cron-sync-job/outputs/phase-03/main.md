# Phase 3 成果物 — 設計レビュー

## 1. 代替案比較

| # | 代替案 | 採否 | 理由 |
| --- | --- | --- | --- |
| A | googleapis SDK を Workers にバンドル | REJECT | bundle size が Workers 上限に近づく / nodejs_compat 必須なのに Buffer 等の依存が deep。WebCrypto + fetch の自前実装で十分 |
| B | Sheets `nextPageToken` で pagination | REJECT (=不可) | `spreadsheets.values.get` は token を返さない。A1 range 分割で代替する |
| C | Cron + 手動同期で別ハンドラ実装 | REJECT | DRY 違反。`runSync()` core を一本化し scheduled / route 双方から呼ぶ |
| D | mutex ライブラリで lock | REJECT | Workers の isolate 跨ぎでは効かない。D1 上の `sync_locks` テーブルが正解 |
| E | WAL を有効化して competition 緩和 | REJECT | UT-02 で WAL 永続化が公式サポート不確実と確定。retry/backoff + queue 直列化が代替 |
| F | UPSERT を都度実行（batch なし） | REJECT | Workers 1 リクエストあたりの subrequest 上限と SQLITE_BUSY 多発の懸念。`db.batch()` 必須 |

## 2. 判定

| 観点 | 判定 | 補足 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 スコープを満たし AC-1〜11 をトレース可能 |
| 実現性 | PASS | Workers 上限 / Sheets API quota / D1 free tier 全て無料枠内 (Phase 9 で再検証) |
| 整合性 | PASS | 不変条件 #1 #4 #5 を遵守 |
| 運用性 | PASS | sync_job_logs と TTL ロックで運用観測・障害復旧が容易 |

総合判定: **PASS** (MINOR / MAJOR 指摘なし)

## 3. リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| Sheets API 5xx で sync 失敗 | withRetry で指数 backoff、`sync_job_logs.error_reason` に記録、次回 cron 起動で自動復帰 |
| 大容量行で Workers 実行時間超過 | A1 range builder + 100 行 chunk + queue 直列化。1 run で数千行 → 30 秒以内目処 |
| Service Account JSON 流出 | Cloudflare Secrets のみ。コード/`.env` 直書き禁止。1Password で管理 |
| Cron 二重起動 | `sync_locks` TTL 10 分。expired lock のみ強制 release |
| Schema ドリフト | 未知列は `extra_fields_json` に退避し sync を継続。後続の admin 確認で恒久対応 |

## 4. Phase 4 への引き渡し

- 検証ファイルパス: 5 件 (utils 2 / jobs 2 / routes 1) + 統合 1 を Phase 4 で確定
- ブロッカー: なし
