# Phase 5 — リトライポリシー

## 概要

Sheets API の一時障害・quota超過に対するリトライ戦略を定義する。
D1書き込みエラーはリトライせずロールバックする（後述）。

---

## Exponential Backoff パラメータ

| パラメータ | 値 |
|-----------|-----|
| 最大試行回数 | 5回（初回 + 4回リトライ） |
| 初回待機時間 | 1秒 |
| 倍率 | 2倍 |
| 最大待機時間 | 16秒 |
| Retry-Afterヘッダー | 尊重する（429時はヘッダー値を優先） |

### 待機時間テーブル

| 試行回数 | 待機時間 | 累積経過時間（最大） |
|---------|---------|-------------------|
| 1回目（初回） | 0秒 | 0秒 |
| 2回目（1回目リトライ） | 1秒 | 1秒 |
| 3回目 | 2秒 | 3秒 |
| 4回目 | 4秒 | 7秒 |
| 5回目 | 8秒 | 15秒 |
| （5回目失敗後） | 16秒待機後に諦め | 31秒 |

---

## エラー種別ごとのリトライ戦略

| エラー種別 | HTTPステータス | リトライ | 戦略 | sync_audit 記録 |
|-----------|--------------|---------|------|----------------|
| quota超過 | 429 | YES | Exponential Backoff（Retry-After尊重） | 5回失敗後 status='failure' |
| Sheets一時障害 | 500, 503 | YES | Exponential Backoff | 5回失敗後 status='failure' |
| 認証エラー | 401, 403 | NO | 即時失敗 | status='failure', error_reason='auth error' |
| リクエスト不正 | 400 | NO | 即時失敗 | status='failure', error_reason='bad request' |
| D1書き込みエラー | N/A | NO | ロールバック + 失敗記録 | status='failure' または skip |
| 行レベルバリデーション失敗 | N/A | NO | skip-and-continue | rows_skipped++, diff_summary_json記録 |

---

## D1 エラーの扱い

D1書き込みエラーはSheetsへのリトライとは独立して扱う:

- **バッチ単位でトランザクション**: `BEGIN TRANSACTION` → 複数 UPSERT → `COMMIT`
- **D1エラー発生時**: 即座に `ROLLBACK`。同バッチ全体を取り消す。
- **リトライなし**: D1エラーはsheets取得の問題ではないためSheetsリトライは無意味
- **sync_audit**: `status='failure'`, `error_reason` にエラーメッセージを記録

---

## DLQ（Dead Letter Queue）の扱い

Cloudflare Workers 無料枠では DLQ（Dead Letter Queue）は提供されていない。

失敗行・失敗バッチの記録先:
- `sync_audit.diff_summary_json`: `{"errors":[{"row":N,"reason":"..."}]}` 形式
- `sync_audit.error_reason`: 致命的エラーの場合のみ記録
- `sync_audit.rows_skipped`: スキップ行数

再処理が必要な場合は管理者が `POST /sync/backfill` で手動再実行する。

---

## バッチ設定パラメータ

| パラメータ | デフォルト値 | 説明 |
|-----------|------------|------|
| BATCH_SIZE | 500 | 1リクエストあたりの取得行数 |
| BATCH_DELAY_MS | 200 | バッチ間の待機時間（ミリ秒） |
| MAX_RETRY | 5 | 最大試行回数（初回含む） |
| BACKOFF_BASE_MS | 1000 | Exponential Backoffの基底（ミリ秒） |
| BACKOFF_MULTIPLIER | 2 | Exponential Backoffの倍率 |
