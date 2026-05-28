# Phase 02 — アーキテクチャ / runtime surfaces

本タスクはコード変更を伴わないため、本 Phase は **既存実装の整合確認** と **runtime surface mapping** を目的とする。

## 2.1 関連コード surface (既存・PR #960 merged)

| ファイル / 設定 | 役割 | 確認 |
|----------------|------|------|
| `apps/api/src/diagnostics/forms-pipeline.ts:85-113` | `deriveFormsPipelineHypotheses` — H1/H2/H3/H4 判定純関数 | 実装済 |
| `apps/api/src/diagnostics/forms-pipeline.ts:115-` | `getFormsPipelineSnapshot` — D1 counts / sync_jobs / visibility / identityHealth aggregator | 実装済 |
| `apps/api/src/diagnostics/forms-pipeline.ts:214` 周辺 | `secretsReadiness` — env presence ベースで真偽判定 | 実装済 |
| `apps/api/src/index.ts:468-494` | `scheduled()` の `*/15 * * * *` 分岐で `runResponseSync` を `waitUntil` 起動 | 実装済 |
| `apps/api/src/jobs/sync-forms-responses.ts` | Forms API → D1 ingest 本体。sync-lock acquire / release / `sync_jobs` 書込み | 実装済 |
| `apps/api/src/jobs/sync-lock.ts:30-33` | expired lock を acquire 前に `DELETE` → stale lock 自動回収 | 実装済 |
| `apps/api/src/jobs/sheets-auth-classifier.ts` | Forms API 401 を reason code (`invalid_grant` / `unauthorized` / `invalid_form_id` 等) に分類 | 実装済 |
| `apps/api/wrangler.toml` `[triggers] crons` (L14/L88/L167) | dev/staging/production すべてで `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` | 設定済 |
| `apps/api/wrangler.toml` `GOOGLE_FORM_ID` (L63/L150) | 非機密 var として全環境で `119ec...nfhp7Xg` を宣言 | 設定済 |

## 2.2 runtime ops surface

| 操作対象 | ツール | 制約 |
|---------|--------|------|
| Cloudflare Secrets (production) | `bash scripts/cf.sh secret put / list` | `wrangler` 直叩き禁止。op 経由で値注入 |
| Cloudflare Worker tail log (production) | `bash scripts/cf.sh tail --env production` | 起動証跡 (cron) を 1 cycle 観測 |
| D1 `sync_jobs` table (production) | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "..."` | `SELECT` / `UPDATE` のみ。`DELETE` / schema 変更禁止 |
| diagnostics endpoint snapshot | `curl -H 'cookie: auth=...' https://<worker>/admin/diagnostics/forms-pipeline` (admin auth 必須) | 認証付き取得。本文ファイル保存 |

## 2.3 データフロー (確認のみ)

```
Cloudflare Cron (*/15 * * * *)
   │
   ▼
scheduled() in apps/api/src/index.ts
   │   buildFormsClient(env)  ← secrets readiness が前提
   ▼
runResponseSync(env, { trigger: "cron", client })  in sync-forms-responses.ts
   │   acquireSyncLock (expired lock は事前に DELETE される)
   │   Google Forms API call → 401 時は sheets-auth-classifier で reason 分類
   ▼
D1 `sync_jobs` row (status: running → succeeded / failed)
D1 `member_responses` / `response_fields` 書込み (success 時)
   │
   ▼
/admin/diagnostics/forms-pipeline が aggregate → snapshot JSON
```

## 2.4 不整合 / drift チェックリスト

- [ ] `wrangler.toml` の cron schedule に変更が無いこと (現状 `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]`)
- [ ] `GOOGLE_FORM_ID` の var 値が `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` のまま
- [ ] secrets binding 名 (`GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`) が `buildFormsClient` が参照するキーと一致
