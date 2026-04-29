# wrangler d1 確認クエリ集

> プロジェクト規約により wrangler を直接呼ばず `bash scripts/cf.sh` 経由で実行する。
> local の場合のみ `wrangler d1 execute ... --local` を使う（CLAUDE.md 参照）。
>
> staging 例: `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "..."`

## DB 名対応表

| 環境 | DB binding (wrangler) | コマンド例 |
| --- | --- | --- |
| local | `ubm_hyogo_staging`（local D1） | `wrangler d1 execute ubm_hyogo_staging --local --command "..."` |
| staging | `ubm-hyogo-db-staging` | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "..."` |
| production | `ubm-hyogo-db-prod` | （Phase 11 では実施禁止） |

以下、コマンド本文は local 表記で記述する。staging 移行時は DB 名と `--env` を読み替える。

## Check 1: row count（同期成功確認）

```bash
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT count(*) AS member_responses FROM member_responses;
             SELECT count(DISTINCT response_email) AS identities FROM member_identities;
             SELECT count(*) AS active_status FROM member_status WHERE is_deleted=0;
             SELECT count(*) AS known_fields FROM response_fields WHERE stable_key IS NOT NULL;"
```

## Check 2: current_response 切替

```bash
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT response_email, current_response_id, last_submitted_at \
             FROM member_identities ORDER BY last_submitted_at DESC LIMIT 10"
```

## Check 3: consent snapshot

```bash
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT m.response_email, s.public_consent, s.rules_consent, s.is_deleted \
             FROM member_status s \
             JOIN member_identities m ON m.member_id = s.member_id \
             ORDER BY s.updated_at DESC LIMIT 10"
```

期待: `publicConsent` / `rulesConsent` の値は `consented` / `declined` / `unknown` のみ
（`同意する` 等の生文字列が漏れていないこと、AC-3 / 不変条件 #2）。

## Check 4: schema_diff_queue（unknown question）

```bash
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT id, question_id, status, created_at FROM schema_diff_queue \
             WHERE status='queued' ORDER BY created_at DESC LIMIT 20"
```

期待: 同一 question_id は 1 行のみ（partial UNIQUE index `idx_schema_diff_queue_question_open`）。

## Check 5: extra field row (`response_fields.stable_key=__extra__:<questionId>`)

```bash
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT response_id, extra field row (`response_fields.stable_key=__extra__:<questionId>`) FROM response_fields \
             WHERE stable_key IS NULL ORDER BY response_id DESC LIMIT 5"
```

## Check 6: sync_jobs ledger（cursor 終了確認）

```bash
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT job_id, job_type, status, started_at, finished_at, metrics_json \
             FROM sync_jobs WHERE job_type='response_sync' \
             ORDER BY started_at DESC LIMIT 5"
```

確認ポイント:
- `status` が `succeeded`（または `running` 1 件のみ＝ロック中）
- `metrics_json.cursor` が `null` または key 不在（pagination 終了の証跡）
- `metrics_json.processedCount` / `metrics_json.writeCount` が想定値

## Check 7: 不変条件 #4（既存 response の本文上書き禁止）

```bash
wrangler d1 execute ubm_hyogo_staging --local \
  --command "SELECT response_id, submitted_at, updated_at FROM member_responses \
             WHERE response_id='<既存 responseId>'"
```

期待: 同 `responseId` の `submitted_at` は不変、`updated_at` のみ最新化。
（同期は新 response 追加と current 切替のみで、既存 response 本文を上書きしない）

## Check 8: PII redact

local の `pnpm --filter @ubm/api dev` の stdout または `wrangler tail`（staging）で:

```bash
wrangler tail --env staging --format json 2>&1 | grep -E '"responseEmail"|"responseId"|"questionId"' \
  || echo "OK: no PII in tail"
```

期待: 何もマッチしないこと（不変条件 / secret hygiene / Phase 9 secret-hygiene.md）。
