# Phase 04 — データ契約 / snapshot 構造

本タスクで参照する D1 / JSON 構造の SSOT。すべて既存実装で確定済みであり本タスクでの変更対象ではない。

## 4.1 `forms-pipeline-snapshot.json` (抜粋)

```jsonc
{
  "secretsReadiness": {
    "googleServiceAccountEmail": true | false,
    "googlePrivateKey": true | false,
    "googleFormId": true | false,
    "authSecret": true | false
  },
  "hypothesisFlags": {
    "H1_ingestNeverRanOrAllErrors": true | false,
    "H2_identityMismatchSuspected": true | false,
    "H3_allHiddenByPublishState": true | false,
    "H4_aliasPendingNonZero": true | false
  },
  "latestSyncRuns": [
    {
      "id": "string",
      "startedAt": "ISO-8601",
      "finishedAt": "ISO-8601 | null",
      "status": "success" | "error" | "running" | "aborted",
      "responsesFetched": 0,
      "errorMessage": "string | null"
    }
  ],
  "counts": { "formResponses": 0, "responseFields": 0, "members": 0, "memberIdentities": 0 }
}
```

SSOT: `apps/api/src/diagnostics/schema.ts` の `FormsPipelineSnapshotSchema` (zod)。

## 4.2 `secretsReadiness` 判定

`apps/api/src/diagnostics/forms-pipeline.ts:46-47` の `hasText` で env 値の空白除去後長さで真偽判定。env 未バインド = `undefined` / 空文字 = `false`、非空文字列 = `true`。

| key | 判定対象 env (どちらか満たせば true) |
|-----|--------------------------------------|
| `googleServiceAccountEmail` | `GOOGLE_SERVICE_ACCOUNT_EMAIL` または `FORMS_SA_EMAIL` |
| `googlePrivateKey` | `GOOGLE_PRIVATE_KEY` または `FORMS_SA_KEY` |
| `googleFormId` | `GOOGLE_FORM_ID` または `FORM_ID` |
| `authSecret` | `AUTH_SECRET` |

注意: `wrangler.toml` の `[vars]` で `GOOGLE_FORM_ID` は宣言済 → 通常 true。投入対象は `GOOGLE_SERVICE_ACCOUNT_EMAIL` と `GOOGLE_PRIVATE_KEY` の 2 secrets が主。

## 4.3 D1 `sync_jobs` (本タスクで触れる列)

| 列 | 型 | 用途 |
|----|-----|------|
| `job_id` | TEXT PRIMARY KEY | run 識別子 |
| `job_type` | TEXT | `response_sync` または `forms_response_sync` のみ snapshot 集計対象 |
| `started_at` | TEXT (ISO) | stale 判定 (`now - started_at > 1h`) |
| `finished_at` | TEXT (ISO) NULL | running 中は NULL |
| `status` | TEXT | `running` / `succeeded` / `failed` / `aborted` |
| `error_json` | TEXT NULL | failed 時の error payload (reason 判定) |
| `metrics_json` | TEXT NULL | `responsesFetched` 抽出元 |

本タスクで許容される DML: `UPDATE sync_jobs SET status='aborted', finished_at=? WHERE job_id=?`。`DELETE` / schema 変更は禁止。

## 4.4 H1 判定式 (SSOT)

`apps/api/src/diagnostics/forms-pipeline.ts:103-106`:

```ts
H1_ingestNeverRanOrAllErrors:
  input.counts.formResponses === 0 ||
  input.latestSyncRuns.length === 0 ||
  (!hasSuccessfulRun && allCompletedRunsFailed)
```

→ AC-3 (`H1 === false`) を満たすには次の **すべて** が必要:
1. `formResponses > 0` (1 件以上 D1 に取込み済)
2. `latestSyncRuns.length > 0` (cron が 1 回以上発火)
3. `hasSuccessfulRun === true` (成功 run が 1 件以上)
