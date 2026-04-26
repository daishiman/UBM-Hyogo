# Phase 12 — 実装ガイド

---

## Part 1: 中学生レベルの概念説明

### なぜ必要か

UBM兵庫支部会では、入会や更新の回答がGoogleスプレッドシートに集まります。でも、Webサイトや管理画面が毎回スプレッドシートを直接見に行くと、探すのに時間がかかり、同じ人の情報を安定して扱いにくくなります。

たとえば、教室で集めた申込用紙を先生の机の上に積んだままだと、あとで誰が申し込んだか探すのが大変です。そこで、申込用紙の内容を名簿に写して、必要なときにすぐ見られるようにします。この名簿にあたるものがCloudflare D1です。

### 何をするか

Googleスプレッドシートの内容を、決まったタイミングでD1に写します。D1は普段使う正しい名簿、スプレッドシートは回答が入ってくる入口として扱います。

### 今回作ったもの

Googleスプレッドシートは「入力フォーム」のような役割をしています。UBM兵庫支部会では、メンバーが入会時にGoogleフォームに記入すると、その回答がスプレッドシートに自動で記録されます。

一方、Cloudflare D1は「整理棚」のようなものです。スプレッドシートの情報を整理して、システムが素早く取り出せるように保管しています。

今回作ったものは、コードそのものではなく「どう写すかを決めた設計図」です。後続の実装タスクは、この設計図を見て、どの順番で読み、どの表に保存し、失敗したときにどう記録するかを迷わず実装できます。

### スプレッドシートとデータベースの話

スプレッドシート（フォーム回答）とデータベース（整理棚）は別々の場所にあります。フォームに新しい回答が届いても、整理棚には自動では反映されません。

そこで「Cron Trigger（クロントリガー）」というしくみを使います。これは「毎日決まった時間に、スプレッドシートを見て、変化があれば整理棚に写す」という自動タスクです。

郵便ポストに手紙が届いても、家の中の棚に並べないと探せないのと同じです。Cron Triggerが「郵便配達員」の役割をしています。

### エラーが起きたらどうなるか

1つの手紙（データ行）が読めなくても（バリデーションエラー等）、残りの手紙の配達は続けます。これを「skip-and-continue（スキップして続ける）」といいます。

インターネットが混んでいてGoogleに繋がりにくい時（quota超過）は、少し待ってからもう一度試みます。1秒、2秒、4秒、8秒、16秒と待ち時間を倍々に増やして、最大5回試みます。これを「Exponential Backoff（エクスポネンシャルバックオフ）」といいます。

何が起きたかは「sync_audit」という記録帳に書き残すので、後で確認できます。

---

## Part 2: 技術者向け詳細仕様

### TypeScript 型定義

```ts
export type SyncTriggerType = "manual" | "scheduled" | "backfill";
export type SyncAuditStatus = "running" | "success" | "partial_failure" | "failure";

export interface SyncAuditRecord {
  run_id: string;
  trigger_type: SyncTriggerType;
  started_at: string;
  finished_at: string | null;
  rows_fetched: number | null;
  rows_upserted: number | null;
  rows_skipped: number | null;
  status: SyncAuditStatus;
  error_reason: string | null;
  diff_summary_json: string | null;
}

export interface SyncRunResult {
  run_id: string;
  trigger_type: SyncTriggerType;
  status: SyncAuditStatus;
  rows_fetched: number;
  rows_upserted: number;
  rows_skipped: number;
  error_reason?: string;
}
```

### sync_audit 論理スキーマ

既存 migration の物理契約を正とする。UT-01 では新規テーブル作成ではなく、後続実装が使う論理契約として記録する。

```sql
CREATE TABLE IF NOT EXISTS sync_audit (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id            TEXT NOT NULL UNIQUE,
  trigger_type      TEXT NOT NULL,          -- manual / scheduled / backfill
  started_at        TEXT NOT NULL,
  finished_at       TEXT,
  rows_fetched      INTEGER,
  rows_upserted     INTEGER,
  rows_skipped      INTEGER,
  status            TEXT NOT NULL DEFAULT 'running',
  error_reason      TEXT,
  diff_summary_json TEXT
);
```

### 同期方式

- **方式**: Cloudflare Workers Cron Triggers（pull方式）
- **起動**: Workers `scheduled` ハンドラ
- **Sheets取得**: Google Sheets API v4 `GET /v4/spreadsheets/{spreadsheetId}/values/{range}`
- **D1書き込み**: `INSERT ... ON CONFLICT(response_id) DO UPDATE SET ...`（`admin_overrides` / `member_status` 由来の手動管理情報は上書きしない）

### APIシグネチャ

#### POST /sync/manual

手動同期を起動する。

```
POST /sync/manual

Response: 200 OK
{
  "run_id": "a1b2c3d4-...",
  "trigger_type": "manual",
  "status": "success",
  "rows_fetched": 120,
  "rows_upserted": 118,
  "rows_skipped": 2
}
```

#### POST /sync/backfill

バックフィル（過去データの一括取り込み）を起動する。現行実装は全件 truncate-and-reload であり、将来の destructive backfill では dry-run と明示的な overwrite 指定を追加する。

```
POST /sync/backfill

Response: 200 OK
{
  "run_id": "b2c3d4e5-...",
  "trigger_type": "backfill",
  "status": "success",
  "rows_fetched": 1000,
  "rows_upserted": 1000,
  "rows_skipped": 0
}
```

#### GET /sync/audit?limit=20

直近の同期実行ログを確認する。

```
GET /sync/audit?limit=20

Response: 200 OK
[
  {
    "run_id": "a1b2c3d4-...",
    "trigger_type": "scheduled",
    "status": "partial_failure",
    "rows_fetched": 120,
    "rows_upserted": 118,
    "rows_skipped": 2
  }
]
```

### 使用例

```bash
curl -X POST "$API_BASE_URL/sync/manual"
curl -X POST "$API_BASE_URL/sync/backfill"
curl "$API_BASE_URL/sync/audit?limit=10"
```

### エラーハンドリング

| エラー種別 | 対処 |
|-----------|------|
| 行レベルバリデーション失敗 | skip-and-continue（`diff_summary_json.errors[]` に row key / reason code / retry hint を記録し、`status='partial_failure'`） |
| Sheets API 429 | Retry-After を尊重。最大5 attempts（初回 + 4 retries） |
| Sheets API 500/503 | Exponential Backoff。待機は 1s, 2s, 4s, 8s の4回 |
| Sheets API 401/403 | 即時失敗（`status='failure'`） |
| D1書き込みエラー | バッチ失敗として `status='failure'`、`error_reason` に記録 |

### エッジケース

| ケース | 方針 |
| --- | --- |
| Cron が重複起動する | `sync_audit.status='running'` の stale 判定または単一実行ガードを UT-09 で実装する |
| D1 側の管理者補正がある | `member_responses` の同期で `admin_overrides` / `member_status` を上書きしない |
| Backfill が古い Sheets データを持つ | dry-run diff と明示的 overwrite を将来拡張として要求する |
| `response_id` が Sheets に無い | Form API の responseId を優先し、無い場合はメール + submitted_at + row hash の派生キーを使う |
| スキップ行が多い | `partial_failure` として記録し、修正後に対象行のみ再実行する |

### 設定項目と定数一覧

| パラメータ名 | デフォルト | 説明 |
|------------|----------|------|
| `BATCH_SIZE` | `500` | 1回のSheets APIリクエストで取得する行数 |
| `BATCH_DELAY_MS` | `200` | バッチ間の待機時間（ミリ秒） |
| `MAX_ATTEMPTS` | `5` | Sheets APIへの最大試行回数（初回含む） |
| `BACKOFF_BASE_MS` | `1000` | Exponential Backoffの基底待機時間（ミリ秒） |
| `BACKOFF_MULTIPLIER` | `2` | Exponential Backoffの倍率 |
| `CRON_SCHEDULE` | `0 * * * *` | Cloudflare Cron の既定スケジュール（UTC、1時間ごと） |
| `AUDIT_LIMIT_MAX` | `100` | `/sync/audit` の最大取得件数 |

### 冪等キー

- **主キー**: `member_responses.response_id`（Google Forms回答の固有ID）
- **UPSERT**: `ON CONFLICT(response_id) DO UPDATE`
- **重複実行**: 同一 `response_id` に何度実行しても同一結果を保証

### テスト構成

| 層 | 確認内容 |
| --- | --- |
| Unit | Sheets 行の正規化、`response_id` 生成、retry 判定、`partial_failure` 判定 |
| Integration | `/sync/manual`、`/sync/backfill`、`/sync/audit` が D1 binding と整合すること |
| Migration | `sync_audit` 物理列（`run_id` / `trigger_type` / `rows_upserted` / `error_reason`）が実装と一致すること |
| Security follow-up | 現行 `/sync/*` 管理ルートに admin guard / CSRF / route-level test を追加すること |

### 参照すべき設計文書

| 文書 | 内容 |
|------|------|
| `outputs/phase-05/sync-method-comparison.md` | 採択方式の詳細根拠 |
| `outputs/phase-05/sequence-diagrams.md` | 正常系・異常系のシーケンス図 |
| `outputs/phase-05/sync-audit-contract.md` | sync_auditテーブルの運用仕様 |
| `outputs/phase-05/retry-policy.md` | リトライポリシーの数値パラメータ |
| `outputs/phase-06/error-case-verification.md` | エラーシナリオの検証結果 |
