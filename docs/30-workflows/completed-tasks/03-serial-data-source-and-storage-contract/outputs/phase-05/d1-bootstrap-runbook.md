# Phase 5 / d1-bootstrap-runbook.md — D1 migration & rollback runbook

## 対象

- DB（staging）: `ubm-hyogo-db-staging`
- DB（production）: `ubm-hyogo-db-prod`
- Migration: `apps/api/migrations/0001_init.sql`
- Binding: `DB`（apps/api 内のみ。不変条件 5）

## 1. D1 作成（初回のみ）

```bash
wrangler d1 create ubm-hyogo-db-staging
wrangler d1 create ubm-hyogo-db-prod
```

出力された database_id を `apps/api/wrangler.toml` の `[[d1_databases]]` に転記。

## 2. wrangler.toml binding（staging / prod）

```toml
# apps/api/wrangler.toml
name = "ubm-hyogo-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<staging database_id>"

[env.staging]
name = "ubm-hyogo-api-staging"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<staging database_id>"

[triggers]
crons = ["0 * * * *"]  # scheduled sync 1h
```

## 3. migration SQL（0001_init.sql 設計）

```sql
-- member_responses（Sheets/Form 生回答の正規化保存）
CREATE TABLE IF NOT EXISTS member_responses (
  response_id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  response_email TEXT,
  submitted_at TEXT NOT NULL,
  edit_response_url TEXT,
  answers_json TEXT NOT NULL,
  raw_answers_json TEXT NOT NULL DEFAULT '{}',
  extra_fields_json TEXT NOT NULL DEFAULT '{}',
  unmapped_question_ids_json TEXT NOT NULL DEFAULT '[]',
  search_text TEXT NOT NULL DEFAULT ''
);

-- member_identities（stable member entity）
CREATE TABLE IF NOT EXISTS member_identities (
  member_id TEXT PRIMARY KEY,
  response_email TEXT NOT NULL UNIQUE,
  current_response_id TEXT NOT NULL,
  first_response_id TEXT NOT NULL,
  last_submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- member_status（consent snapshot + admin-managed 公開/削除状態）
CREATE TABLE IF NOT EXISTS member_status (
  member_id TEXT PRIMARY KEY,
  public_consent TEXT NOT NULL DEFAULT 'unknown',
  rules_consent TEXT NOT NULL DEFAULT 'unknown',
  publish_state TEXT NOT NULL DEFAULT 'hidden',
  is_deleted INTEGER NOT NULL DEFAULT 0,
  hidden_reason TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- sync_audit（manual / scheduled / backfill 一覧）
CREATE TABLE IF NOT EXISTS sync_audit (
  audit_id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_reason TEXT,
  diff_summary_json TEXT NOT NULL DEFAULT '{}'
);
```

## 4. 適用手順（staging）

```bash
wrangler d1 migrations apply ubm-hyogo-db-staging --env staging
wrangler d1 execute ubm-hyogo-db-staging --env staging --command "select name from sqlite_master where type='table'"
# 期待: member_responses / member_identities / member_status / sync_audit
```

## 5. 適用手順（prod、Phase 11 smoke 後）

```bash
# production は top-level env。必ず Phase 11 smoke PASS 後
wrangler d1 migrations apply ubm-hyogo-db-prod
```

## 6. rollback / down 手順

D1 は migration down を直接サポートしないため、以下 2 系統:

### 6.1 軽微な変更（列追加・index）
- `0002_<name>_down.sql` を新規 migration として `DROP COLUMN` 等で逆操作（D1 制約上は table rebuild になる場合あり）。

### 6.2 重大な breaking（列削除・rename）
1. 直前 dump を取得: `wrangler d1 export ubm-hyogo-db-prod --output backup-$(date +%Y%m%d).sql`
2. 新規 DB を作成し dump をリストア
3. binding を新 DB に切替えて redeploy
4. AC-4 に従い Sheets を真として `member_responses` を再 backfill

## 7. backup / restore（AC-3）

```bash
# backup
wrangler d1 export ubm-hyogo-db-prod --output backup-$(date +%Y%m%d-%H%M).sql

# restore（新 DB へ）
wrangler d1 create ubm-hyogo-db-prod-restored
wrangler d1 execute ubm-hyogo-db-prod-restored --file backup-XXXX.sql
```

## 8. sanity check

- [ ] apps/web 側に D1 直接アクセスコードがない（不変条件 5）
- [ ] consent 列が `public_consent` / `rules_consent` のみ（不変条件 2）
- [ ] response_email は system field 列（不変条件 3）
- [ ] admin-managed fields は `member_status` の admin columns / 後続 admin tables に分離（不変条件 4）

## 9. 参照

- 正本: `outputs/phase-02/data-contract.md`
- 検証: `outputs/phase-04/verification-commands.md`
- 異常系: `outputs/phase-06/failure-cases.md`
