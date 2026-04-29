# 手動 smoke evidence — 03b-parallel-forms-response-sync-and-current-response-resolver

> **テンプレ**: 本ファイルは Phase 11 が用意した「証跡テンプレ」。ステージング smoke 担当が
> 「実行コマンド」「期待 stdout」と並び書かれた **証跡欄** に実値を貼り付けて evidence を完成させる。
> ローカル smoke では `http://localhost:8787` / `--local` を使い、staging では `$STAGING_API_URL`
> / `--env staging` に置換する。

## 実行日時
- 2026-MM-DD HH:MM JST  ← 担当者が記入

## 実行者
- <name>  ← 担当者が記入

## 実行環境
- [ ] local（`pnpm --filter @ubm/api dev` + `wrangler d1 ... --local`）
- [ ] staging（`bash scripts/cf.sh deploy --env staging` 後の Cloudflare Workers）

## 0. 事前準備
```bash
# local の場合
mise exec -- pnpm --filter @ubm/api dev &
bash scripts/cf.sh d1 migrations apply ubm_hyogo_staging --local
# fixture を切替（必要なら apps/api/src/jobs/__fixtures__/ から選択）
```

```bash
# staging の場合
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

証跡欄:
```
（実行 stdout を貼る）
```

---

## 1. 同期実行（page1 fixture）

```bash
curl -X POST http://localhost:8787/admin/sync/responses \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

期待 response:
```json
{ "ok": true, "result": { "status": "succeeded", "jobId": "<uuid>", "processedCount": 5, "writeCount": <N>, "cursor": null } }
```

証跡欄:
```
（実行 stdout を貼る）
```

---

## 2. row count

```bash
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT count(*) AS n FROM member_responses"
# → n = 5
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT count(DISTINCT response_email) AS n FROM member_identities"
# → n = 5
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT count(*) AS n FROM member_status WHERE is_deleted=0"
# → n = 5
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT count(*) AS n FROM response_fields WHERE stable_key IS NOT NULL"
# → n = 5 × <既知数>
```

証跡欄:
```
（4 クエリの stdout を貼る）
```

---

## 3. 再回答シナリオ（current 切替）

```bash
# fixture: apps/api/src/jobs/__fixtures__/forms-list-re-submission.json
curl -X POST 'http://localhost:8787/admin/sync/responses?fullSync=true' \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"

wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT response_email, current_response_id, last_submitted_at \
             FROM member_identities WHERE response_email='dup@example.com'"
# → current_response_id = 後者 responseId、last_submitted_at = 後者 submittedAt

wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT count(*) AS n FROM member_responses WHERE response_email='dup@example.com'"
# → n = 2

wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT public_consent, rules_consent FROM member_status \
             WHERE member_id=(SELECT member_id FROM member_identities WHERE response_email='dup@example.com')"
# → 後者 fixture の consent 値
```

証跡欄:
```
（実行 stdout を貼る）
```

---

## 4. unknown question → schema_diff_queue

```bash
# fixture: apps/api/src/jobs/__fixtures__/forms-list-unknown.json
curl -X POST 'http://localhost:8787/admin/sync/responses?fullSync=true' \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"

wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT count(*) AS n FROM schema_diff_queue WHERE status='queued'"
# → n = 1

wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT extra field row (`response_fields.stable_key=__extra__:<questionId>`) FROM response_fields \
             WHERE response_id='<id>' AND stable_key IS NULL LIMIT 1"
# → unknown question_id を含む JSON
```

期待: 同じ unknown question を 2 回投入しても `schema_diff_queue` の row は 1 件のまま（partial UNIQUE index by 0005 migration）。

証跡欄:
```
（実行 stdout を貼る）
```

---

## 5. 排他（409 Conflict）

```bash
# 並列に 2 リクエスト発射
curl -X POST http://localhost:8787/admin/sync/responses \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN" &
curl -X POST http://localhost:8787/admin/sync/responses \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN" &
wait
```

期待:
- 1 つ目: HTTP 200 / `{ "ok": true, "result": { "status": "succeeded", ... } }`
- 2 つ目: HTTP 409 / `{ "ok": false, "result": { "status": "skipped", "skippedReason": "another response_sync is running" } }`

証跡欄:
```
（2 リクエストの status code と body を貼る）
```

---

## 6. cursor pagination 終了

```bash
# fixture: forms-list-page1.json (nextPageToken='p2') + forms-list-page2.json (nextPageToken=null)
curl -X POST 'http://localhost:8787/admin/sync/responses?fullSync=true' \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"

wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT count(*) AS n FROM member_responses"
# → n = 10

wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT metrics_json FROM sync_jobs \
             WHERE job_type='response_sync' ORDER BY started_at DESC LIMIT 1"
# → metrics_json.cursor が null（または key 自体が消えている）
```

証跡欄:
```
（実行 stdout を貼る）
```

---

## 7. PII redact 確認

```bash
# Workers ログ（local 起動 stdout / `wrangler tail` 出力）に PII が出ていないことを grep で確認
grep -E "responseEmail|responseId|questionId" /tmp/api-stdout.log || echo "OK: no PII in log"
```

期待: 何もマッチしない（`OK: no PII in log` のみ）。

証跡欄:
```
（grep 結果を貼る）
```

---

## 8. 結論

- [ ] 全 7 項目 PASS
- [ ] 失敗項目あり（残課題を以下に記入）

残課題:
- （あれば記入。なければ「なし」）

---

## 補足: 証跡が未取得の理由（本タスク提出時点）

- 本タスク（ドキュメント整備フェーズ）では実 deploy / 実 wrangler 実行を禁止されているため、
  値を埋めるのはステージング smoke 担当（または Wave 9a）の責務とする。
- テンプレに従って値を貼れば Phase 11 完了条件を満たす。
