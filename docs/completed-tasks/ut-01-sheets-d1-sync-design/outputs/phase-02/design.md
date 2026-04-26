# Phase 2 — 設計

## 同期方式比較表

| 方式 | 無料枠対応 | 実装コスト | 冪等性確保 | 信頼性 | 採択 |
|------|----------|-----------|-----------|-------|------|
| Push（Sheets→D1直接） | NG（D1はbinding経由のみ） | 高 | 低 | 低 | NG |
| Poll（Worker定期pull） | OK | 低 | 高 | 高 | 候補 |
| Webhook（変更通知） | NG（Google Workspace有料機能） | 中 | 中 | 中 | NG |
| **Cron Triggers（pull方式）** | **OK（無料枠3つまで）** | **低** | **高** | **高** | **採択** |

### Cron Triggers 採択根拠

1. **無料枠内**: Cloudflare Workers 無料枠でCron Trigger 3つまで使用可能。1つ消費で十分。
2. **実装コスト低**: Workerのscheduledハンドラにシンプルなpullロジックを記述するだけ。
3. **冪等性高**: Sheets の `response_id` を主キーとして UPSERT することで重複実行を無害化。
4. **運用安定**: push/webhookと異なり外部からのトリガー依存なし。Workerが主体的にpull。

---

## sync_audit テーブル論理スキーマ

```sql
CREATE TABLE IF NOT EXISTS sync_audit (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id            TEXT NOT NULL UNIQUE,   -- UUID。各同期実行の一意識別子
  trigger_type      TEXT NOT NULL,          -- manual / scheduled / backfill
  started_at        TEXT NOT NULL,          -- ISO8601 UTC タイムスタンプ
  finished_at       TEXT,                   -- 完了時刻（NULL = 実行中）
  rows_fetched      INTEGER,
  rows_upserted     INTEGER,
  rows_skipped      INTEGER,
  status            TEXT NOT NULL DEFAULT 'running', -- running / success / partial_failure / failure
  error_reason      TEXT,                   -- 失敗理由（NULL = 成功）
  diff_summary_json TEXT                    -- エラー行詳細・差分サマリ JSON
);
```

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| run_id | TEXT | YES | UUID。一意識別子 |
| trigger_type | TEXT | YES | 同期起動種別（scheduled/manual/backfill） |
| started_at | TEXT | YES | 開始時刻（ISO8601 UTC） |
| finished_at | TEXT | NO | 完了時刻（実行中はNULL） |
| rows_fetched | INTEGER | NO | Sheetsから取得した行数 |
| rows_upserted | INTEGER | NO | D1へupsertした行数 |
| rows_skipped | INTEGER | NO | スキップ行数 |
| status | TEXT | YES | 実行状態（running/success/partial_failure/failure） |
| error_reason | TEXT | NO | 失敗理由テキスト |
| diff_summary_json | TEXT | NO | エラー行・差分の詳細JSON |

---

## 冪等性確保設計

- **冪等キー**: `member_responses.response_id`（Google フォーム回答の固有ID）を主キーとして使用
- **操作**: `INSERT ... ON CONFLICT(response_id) DO UPDATE SET ...` による UPSERT
- **diff_fingerprint**: 新規カラムは追加しない。差分検出が必要な場合は `diff_summary_json` に記録
- **重複実行安全性**: 同一 `response_id` に対して何度実行しても同一結果を保証

---

## エラーハンドリング・リトライ設計

| 分類 | 戦略 | 詳細 |
|------|------|------|
| 部分失敗（行レベル） | skip-and-continue | 失敗行を `diff_summary_json` に記録し次の行へ継続 |
| Sheets API quota超過（429） | Exponential Backoff | 1s→2s→4s→8s→16s、最大5回。Retry-Afterヘッダー尊重 |
| Sheets API一時障害 | Exponential Backoff | 上記と同様 |
| D1書き込み失敗 | トランザクションロールバック + sync_audit記録 | バッチ単位でロールバック |
| 致命的エラー | sync_audit.status = 'failure' + error_reason記録 | 処理中断 |

### Exponential Backoff パラメータ

| 試行 | 待機時間 |
|------|---------|
| 1回目 | 1秒 |
| 2回目 | 2秒 |
| 3回目 | 4秒 |
| 4回目 | 8秒 |
| 5回目 | 16秒 |
| 最大試行回数 | 5回 |

---

## Sheets API Quota対処方針

| 対策 | 内容 |
|------|------|
| バッチサイズ | 500行/リクエスト |
| バッチ間ウェイト | 200ms |
| Retry-Afterヘッダー尊重 | 429レスポンス時はヘッダー指定時間まで待機 |
| Exponential Backoff | 上記参照 |

---

## Source-of-Truth定義

| 状況 | Source-of-Truth | 理由 |
|------|----------------|------|
| 通常運用 | D1 canonical | 全APIは apps/api 経由でD1を参照 |
| 復旧・バックフィル入力 | Google Sheets | フォーム回答の正本はSheets |
| 競合発生時 | Sheets優先（バックフィル時のみ） | フォームの実回答を正本とする（CLAUDE.md不変条件） |
