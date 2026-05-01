# Env interface ↔ wrangler.toml binding 対応表

`apps/api/wrangler.toml` の binding 定義と `apps/api/src/env.ts` の `Env` interface field の 1:1 対応表。本タスク完了時点では下表 9 件のみが `Env` に含まれる。

## 現行 binding 対応表

| Env field | TS 型 | wrangler.toml section | binding / key 名 | 備考 |
| --- | --- | --- | --- | --- |
| `DB` | `D1Database` | `[[d1_databases]]` | `binding = "DB"` | `database_name = "ubm-hyogo-db-prod"` (production) / `"ubm-hyogo-db-staging"` (staging) |
| `ENVIRONMENT` | `string` | `[vars]` | `ENVIRONMENT` | `"production"` / `"staging"` / `"development"` |
| `SHEET_ID` | `string` | `[vars]` | `SHEET_ID` | Google Sheets 参照 |
| `SHEETS_SPREADSHEET_ID` | `string` | `[vars]` | `SHEETS_SPREADSHEET_ID` | 同 ID（u-04 sync job 参照、03a で重複解消検討） |
| `FORM_ID` | `string` | `[vars]` | `FORM_ID` | Google Form 参照 |
| `GOOGLE_FORM_ID` | `string` | `[vars]` | `GOOGLE_FORM_ID` | 同 ID（03a / 03b 参照、03a で重複解消検討） |
| `SYNC_BATCH_SIZE` | `string` | `[vars]` | `SYNC_BATCH_SIZE` | wrangler vars は string 固定。`Number()` 変換は利用側責務 |
| `SYNC_MAX_RETRIES` | `string` | `[vars]` | `SYNC_MAX_RETRIES` | 同上 |
| `SYNC_RANGE` | `string` | `[vars]` | `SYNC_RANGE` | A1 表記レンジ |

## 環境別 override

`wrangler.toml` の `[env.production]` / `[env.staging]` の `[vars]` / `[[d1_databases]]` も同じ key を持つため、TS 型としての `Env` は環境共通で 1 件で足りる（環境別に分岐しない）。`database_id` などのデプロイ時メタデータは TS 型に持ち込まない。

## 予約欄（本タスクでは型に含めない、コメント明示のみ）

| 想定 Env field | 想定 TS 型 | 想定 wrangler.toml section | 追加担当タスク |
| --- | --- | --- | --- |
| `SESSIONS` | `KVNamespace` | `[[kv_namespaces]]` | 05a / 05b |
| `OAUTH_CLIENT_ID` | `string` | `[vars]` | 05a |
| `OAUTH_CLIENT_SECRET` | `string` (secret) | `wrangler secret put` | 05a |
| `MAGIC_LINK_HMAC_KEY` | `string` (secret) | `wrangler secret put` | 05b |
| `R2_ARCHIVE` | `R2Bucket` | `[[r2_buckets]]` | 将来 |

## 同期ルール（運用契約）

1. `wrangler.toml` の binding を追加・変更したら **同 PR で `apps/api/src/env.ts` を更新** する（Phase 12 implementation-guide に明記）。
2. `Env` field 直前のコメントに `// wrangler.toml <section> <key>` の形で対応元を明示する。
3. 削除時はコメントを残さず field と一緒に消す（dead reference 防止）。
4. secret は `wrangler secret put` で投入される binding のみ。値は `Env` のコメントにも evidence にも残さない（不変条件 / Phase 9 secret hygiene）。
