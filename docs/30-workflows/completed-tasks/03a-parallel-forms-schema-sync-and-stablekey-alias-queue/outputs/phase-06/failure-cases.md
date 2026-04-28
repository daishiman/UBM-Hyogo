# failure-cases — forms-schema-sync (03a)

13 ケースを R-1〜R-9 にマップ。各ケースは「検出 / 影響 / 回復」を備える。

| # | ケース | リスク | 検出 | 影響 | 回復 |
| --- | --- | --- | --- | --- | --- |
| F-01 | Forms API 403（service-account 権限剥奪） | R-1 | forms-api: 403 throw → sync_jobs.failed | 同期停止 | service-account 共有を再付与し再実行 |
| F-02 | Forms API 429（quota 超過） | R-2 | forms-api: 429 throw | 同期停止 1 回 | 翌 cron まで待機（無料枠内なので自動回復） |
| F-03 | Forms API 503（一時障害） | R-2 | forms-api: 503 throw | 同期停止 1 回 | 翌 cron で自動復旧。手動 POST も可 |
| F-04 | items 数 != 31 | R-3 | SyncIntegrityError("expected 31 questions") | 全 upsert スキップ | 31 件に修正、または閾値を調整した上で再同期 |
| F-05 | sectionHeader != 6 | R-3 | SyncIntegrityError("expected 6 sections") | 全 upsert スキップ | フォーム側 section を 6 に再構成 |
| F-06 | revisionId 欠損（API 仕様変動） | R-4 | hash を fallback 採用、警告ログ | revision tracking 失敗 | API 仕様確認 → integrations-google 側で対応 |
| F-07 | unknown 連鎖（known map ヒット率低下） | R-5 | schema_diff_queue queued 急増 | 会員データ取り込み停滞 | /admin/schema で alias 紐付け（07b） |
| F-08 | alias 衝突（同 stable_key を 2 questionId が指す） | R-5 | schema_questions UNIQUE(revision,stable_key) 違反 | upsert 失敗 | 旧 questionId の alias を解除、再同期 |
| F-09 | D1 UNIQUE 違反（重複 revision/itemId） | R-6 | D1 RUN error → syncJobs.fail | 1 行未反映 | INSERT OR REPLACE 担保。発生時は手動 SELECT で原因特定 |
| F-10 | D1 unavailable（binding なし / network） | R-6 | DB.prepare throw | 同期不能 | wrangler.toml 確認 → redeploy |
| F-11 | admin gate 失敗（401 / 403 / 500） | R-7 | route 直返却 | 不正 POST 拒否 | SYNC_ADMIN_TOKEN を Cloudflare Secrets で設定 |
| F-12 | 同種 schema_sync running 二重起動 | R-8 | ConflictError → 409 | 後発 1 件は no-op | 先発の終了待ち（自動回復） |
| F-13 | cron 同時刻多重起動（cron */15 と 0 3 が衝突） | R-9 | F-12 と同経路 | 後発 1 件は no-op | scheduled 内で trigger を分岐済み（自動回復） |

---

## 検出経路サマリ

- 即時検出: route 内 try/catch（F-11, F-12）
- 同期内検出: SyncIntegrityError（F-04〜F-06, F-08）
- 外部依存検出: forms-api throw（F-01〜F-03）/ D1 throw（F-09, F-10）
- 運用観測: sync_jobs.error_json + schema_diff_queue 件数（F-07）
