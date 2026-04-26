# Phase 5 — sync_audit 監査契約

## テーブル定義（再掲）

```sql
CREATE TABLE IF NOT EXISTS sync_audit (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id            TEXT NOT NULL UNIQUE,
  trigger_type      TEXT NOT NULL,
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

---

## 各カラムの詳細仕様

| カラム | 型 | NULL | 例 | 説明 |
|--------|----|------|----|------|
| run_id | TEXT | NO | `"a1b2c3d4-..."` | UUID。各同期実行の一意識別子。重複実行の区別に使用。 |
| trigger_type | TEXT | NO | `"scheduled"` | 起動種別。下記triggerEnum参照。 |
| started_at | TEXT | NO | `"2026-04-26T10:00:00Z"` | 同期開始時刻（ISO8601 UTC）。 |
| finished_at | TEXT | YES | `"2026-04-26T10:01:23Z"` | 同期完了時刻。`status='running'` 中はNULL。 |
| rows_fetched | INTEGER | YES | `120` | Sheetsから取得した行数。 |
| rows_upserted | INTEGER | YES | `118` | D1へupsertしたレコード数。 |
| rows_skipped | INTEGER | YES | `2` | スキップしたレコード数（バリデーション失敗・重複等）。 |
| status | TEXT | NO | `"success"` | 実行状態。下記statusEnum参照。 |
| error_reason | TEXT | YES | `"quota exceeded after 5 retries"` | 失敗理由の簡潔なテキスト。status='success'時はNULL。 |
| diff_summary_json | TEXT | YES | `'{"errors":[{"row":15,"reason":"invalid email"}]}'` | エラー行・差分詳細のJSON。 |

---

## trigger 種別

| 値 | 説明 | 起動元 |
|----|------|-------|
| `scheduled` | Cloudflare Cron Triggerによる定期実行 | Workers scheduled ハンドラ |
| `manual` | 管理者による手動実行 | `POST /sync/manual` |
| `backfill` | 過去データの一括取り込み | `POST /sync/backfill` |

---

## status 遷移図

```
初期INSERT
    │
    ▼
 running
    │
    ├─── 全バッチ成功 ──────────────────► success
    │
    ├─── 一部行スキップ（継続） ─────────► partial_failure
    │    （diff_summary_json にエラー記録）
    │
    └─── 致命的エラー ──────────────────► failure
         （error_reason に理由記録）
```

---

## 冪等キーとの関係

- `sync_audit.run_id` は同期実行の追跡に使用（実行ごとに一意）
- `member_responses.response_id` が冪等キー（同一回答の重複挿入を防ぐ）
- 両者は独立した役割を持つ: `sync_audit` は「いつ・何件を同期したか」、`response_id` は「どのデータが正規か」を管理

---

## 監査・再開判断のユースケース

| ユースケース | 参照カラム | 操作 |
|------------|----------|------|
| 最新同期が成功したか確認 | status, finished_at | 最新レコードのstatus確認 |
| 同期が途中で止まっていないか確認 | status='running', started_at | running が長時間続いていれば異常 |
| 失敗した同期の原因調査 | error_reason, diff_summary_json | 詳細ログを確認して再実行判断 |
| スキップされた行の特定 | rows_skipped, diff_summary_json | diff_summary_json.errors を参照 |
| バックフィルの進捗確認 | rows_fetched, rows_upserted, rows_skipped | 合計件数で進捗を把握 |
| 特定の同期実行を一意に参照 | run_id | ログやSlack通知でrun_idを記録 |
