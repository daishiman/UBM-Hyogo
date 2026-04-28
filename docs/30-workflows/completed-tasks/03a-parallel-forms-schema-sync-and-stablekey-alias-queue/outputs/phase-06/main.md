# Phase 6 成果物: 失敗ケース整理 — forms-schema-sync-and-stablekey-alias-queue

Phase 3 の R-1〜R-9 リスクを起点に、運用 / API / D1 / 認可 / cron / 整合性の各レイヤで発生しうる失敗ケースを 12 件以上列挙し、検出経路と回復手順を `failure-cases.md` に整理する。

---

## 1. レイヤ別の失敗ケース概観

| レイヤ | 主要ケース数 | リスク対応 |
| --- | --- | --- |
| Forms API 通信 | 3（403 / 429 / 503） | R-1 / R-2 |
| schema 整合性 | 3（31 不一致 / 6 不一致 / revisionId 欠損） | R-3 / R-4 |
| stableKey 解決 | 2（unknown 連鎖 / alias 衝突） | R-5 |
| D1 永続化 | 2（UNIQUE 違反 / D1 unavailable） | R-6 |
| 認可 / 排他 | 2（admin gate 失敗 / 同種 running） | R-7 / R-8 |
| cron | 1（同時刻多重起動） | R-9 |

合計 13 件。

---

## 2. 共通方針

- 例外は `runSchemaSync` 内で `syncJobs.fail` を必ず通って終端する（AC-5）。
- ConflictError 以外の throw は route 側で 500 に集約し、`error.message` のみ返却（stack trace は流さない）。
- 整合性違反（31/6 件不一致 / GOOGLE_FORM_ID 未設定）は `SyncIntegrityError` として識別可能にする。
- forms.get の HTTP error は `packages/integrations-google` の client が握りつぶさず throw する（メッセージに `forms-api: <status>` プレフィックス）。

---

## 3. 監視可能性

- `sync_jobs.status` と `sync_jobs.error_json` を運用ダッシュボード（wave 9b）で表示する。
- `schema_diff_queue` の `status='queued'` 件数は `/admin/schema` 画面のバッジで露出する（07b と接続）。
- failure-cases.md の各ケースに「検出方法 / 復旧手順」を記載する。

---

## 4. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | forms API 系失敗ケース | completed |
| 2 | schema 整合性ケース | completed |
| 3 | D1 / 認可 / cron ケース | completed |
| 4 | 検出方法 / 復旧手順記述 | completed |
| 5 | failure-cases.md 出力 | completed |
