# UT-08 Phase 2: WAE 計装計画 (AC-5)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-5 |
| 親ドキュメント | [monitoring-design.md](./monitoring-design.md) |
| 計装対象 | `apps/api` (Cloudflare Workers + Hono) |
| 実装委譲 | Wave 2 実装タスク（不変条件 5） |

Workers Analytics Engine（WAE）への構造化イベント計装を、イベント名 / フィールド / sampling 単位で確定する。実装コードは Wave 2 で apps/api に追加するため、本ドキュメントは仕様確定のみを行う。

---

## 1. WAE 無料枠仕様の前提

| 項目 | 値 | 出典 |
| --- | --- | --- |
| 書込上限 | 25,000,000,000 data points/月 相当（Workers Paid 含む全体目安） | 2026-04 時点の推測値、最終確認は実装直前に再確認 |
| 保存期間 | 公式確認値（過去は 31 日とされていた） | 公式 https://developers.cloudflare.com/analytics/analytics-engine/ で要再確認 |
| 1 イベントあたりの blob 数上限 | 20 個 | 公式確認値 |
| 1 イベントあたりの double 数上限 | 20 個 | 公式確認値 |
| Index 数上限 | 1 個 / イベント | 公式確認値 |

サンプリング設計は本前提に従う。最終仕様の確定は Wave 2 実装直前に再確認。

---

## 2. 計装イベント一覧

| イベント名 | 発生箇所（apps/api） | sampling | index | blobs | doubles | 用途 |
| --- | --- | --- | --- | --- | --- | --- |
| `api.request` | Hono middleware（全 request） | 100%（初期） / 10%（超過時） | `path` | `method`, `status`, `colo`, `cf_ray` | `latency_ms`, `cpu_time_ms` | 全リクエスト計装 |
| `api.error` | Hono error handler | 100% | `error_class` | `path`, `method`, `message_redacted`, `cf_ray` | `status` | エラー検知 |
| `cron.sync.start` | Sheets→D1 同期 cron 開始 | 100% | `job_id` | `started_at`, `trigger_type` | （なし） | Cron 起動確認 |
| `cron.sync.end` | 同 cron 終了 | 100% | `job_id` | `status`, `error_class`, `ended_at` | `duration_ms`, `rows_synced` | Cron 完了 / 失敗検知 |
| `d1.query.fail` | D1 wrapper 例外 catch | 100% | `query_kind` | `error_class`, `db_name` | `attempt_count` | D1 クエリ失敗検知 |
| `auth.fail` | Auth.js コールバック失敗 | 100% | `error_class` | `provider`, `cf_ray` | （なし） | 認証失敗の傾向把握（任意） |

合計 6 イベント。`auth.fail` は任意（Wave 2 で UT-13 と整合性を取る）。

---

## 3. フィールド設計の詳細

### 3.1 共通方針

- **PII を含めない**: `email` / `userId` / IP アドレス等は計装しない（個人情報保護）
- **Message Redaction**: `error.message` はスタックトレースを含まないように redact してから格納
- **`cf_ray`**: Cloudflare のリクエスト追跡 ID。ログとの突合に使用
- **`colo`**: Cloudflare colo（地域）コード

### 3.2 `api.request`

| フィールド | 種別 | 型 | 例 |
| --- | --- | --- | --- |
| `path` | index | string | `/api/members` |
| `method` | blob1 | string | `GET` |
| `status` | blob2 | string | `200` |
| `colo` | blob3 | string | `NRT` |
| `cf_ray` | blob4 | string | `8a4f...` |
| `latency_ms` | double1 | number | `123` |
| `cpu_time_ms` | double2 | number | `2.4` |

### 3.3 `api.error`

| フィールド | 種別 | 型 | 例 |
| --- | --- | --- | --- |
| `error_class` | index | string | `SheetsAuthError` |
| `path` | blob1 | string | `/api/sync` |
| `method` | blob2 | string | `POST` |
| `message_redacted` | blob3 | string | `Auth token expired` |
| `cf_ray` | blob4 | string | `8a4f...` |
| `status` | double1 | number | `401` |

### 3.4 `cron.sync.start` / `cron.sync.end`

`job_id` は同一 cron 実行で `start` / `end` に同じ値を入れ、後続クエリで JOIN できるようにする。`status` は `success` / `failed` / `partial` の 3 値。

### 3.5 `d1.query.fail`

`query_kind` は SQL 種別の粗いカテゴリ（`select` / `insert` / `update` / `delete` / `migration`）。

---

## 4. サンプリング戦略

| イベント | 初期 sampling | 超過リスク時 sampling | 切替条件 |
| --- | --- | --- | --- |
| `api.request` | 100% | 10% | 月次 data points が無料枠 70% に到達 |
| `api.error` | 100% | 100%（維持） | エラーは全件取りたいため絞らない |
| `cron.*` | 100% | 100%（維持） | 件数が少ないため絞る必要なし |
| `d1.query.fail` | 100% | 100%（維持） | 件数が少なく重要 |
| `auth.fail` | 100% | 100%（維持） | 同上 |

切替判断は月次レビューで実施（[alert-threshold-matrix.md](./alert-threshold-matrix.md) §5）。

---

## 5. WAE バインディング設計（Wave 2 入力）

### 5.1 wrangler.toml（apps/api）追記イメージ

```toml
[[analytics_engine_datasets]]
binding = "MONITORING_AE"
dataset = "ubm_hyogo_monitoring"
```

### 5.2 計装ヘルパ（Wave 2 で実装）

`apps/api` 内に `src/observability/wae.ts` 等を新設し、`writeDataPoint({ blobs, doubles, indexes })` をラップする薄いヘルパを設ける。Hono middleware から `api.request` / `api.error`、D1 wrapper から `d1.query.fail`、Cron handler から `cron.sync.*` を呼び出す。

実装は Wave 2。本書では配置先と命名のみ確定する。

---

## 6. クエリパターン（運用フェーズで使用）

GraphQL Analytics API（無料プランで利用可）経由でのサンプルクエリ。

```sql
-- 5 分間のエラー率
SELECT
  count(*) FILTER (WHERE blob2 >= '500') / count(*) AS error_rate
FROM ubm_hyogo_monitoring
WHERE index1 = '/api/...' AND timestamp > now() - INTERVAL '5 minute'

-- D1 クエリ失敗の集計
SELECT index1 AS query_kind, count() FROM ubm_hyogo_monitoring
WHERE blob1 != ''  -- d1.query.fail を index1=query_kind で識別
  AND timestamp > now() - INTERVAL '5 minute'
GROUP BY index1
```

実際のクエリ実装は Wave 2 のアラートワーカーで行う。

---

## 7. 既存ログ / console.log との関係

- WAE 計装は集計可能な構造化メトリクス用
- スタックトレース等の詳細は `console.error` で残し、`cf_ray` を介して突合
- 重複計装を避けるため、`console.log` だけで済むものは WAE に書かない
