# Static Checks (EV-11-1)

実行日時: 2026-05-02

## Commands & Results

### S-1: migration ファイル存在
```
$ ls -l apps/api/migrations/0008_create_schema_aliases.sql
-rw-r--r-- 1 dm staff 913 May 2 11:23 apps/api/migrations/0008_create_schema_aliases.sql
```
→ ✅ exit 0 / PASS

### S-2: 必須 column 含有
```
$ rg -n "id\s+TEXT PRIMARY KEY|stable_key|alias_question_id|alias_label|source|created_at|resolved_by|resolved_at" \
    apps/api/migrations/0008_create_schema_aliases.sql
2:  id                TEXT PRIMARY KEY,
4:  stable_key        TEXT NOT NULL,
5:  alias_question_id TEXT NOT NULL,
6:  alias_label       TEXT,
7:  source            TEXT NOT NULL DEFAULT 'manual',
8:  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
9:  resolved_by       TEXT,
10: resolved_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
```
→ ✅ 必須 9 column が DDL に揃う / PASS

### S-3: 必須 index 含有
```
$ rg -n "idx_schema_aliases_stable_key|idx_schema_aliases_revision_stablekey_unique|idx_schema_aliases_revision_question_unique" \
    apps/api/migrations/0008_create_schema_aliases.sql
13:CREATE INDEX IF NOT EXISTS idx_schema_aliases_stable_key
16:CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_aliases_revision_stablekey_unique
22:CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_aliases_revision_question_unique
```
→ ✅ 3 index 揃う / PASS

### S-4: wrangler 直叩き禁止
`scripts/`, `apps/`, `packages/` に対して `wrangler d1 migrations apply` を grep:
```
$ rg -n "wrangler d1 migrations apply" scripts/ apps/ packages/
(no matches)
```
→ ✅ 実行系コードに 0 件 / PASS（docs hit はすべて禁止表記または検査コマンド文字列のため除外）

### S-5: production env 識別子確定
```
$ rg -n "ubm-hyogo-db-prod|env\.production" apps/api/wrangler.toml
27:database_name = "ubm-hyogo-db-prod"
31:[env.production]
34:[env.production.vars]
48:[env.production.triggers]
51:[[env.production.d1_databases]]
53:database_name = "ubm-hyogo-db-prod"
```
→ ✅ `[env.production]` セクションと `database_name = "ubm-hyogo-db-prod"` が一致 / PASS

## Summary

| ID | 結果 |
| --- | --- |
| S-1 | ✅ PASS |
| S-2 | ✅ PASS |
| S-3 | ✅ PASS |
| S-4 | ✅ PASS |
| S-5 | ✅ PASS |

→ 静的検査は全 PASS。Phase 13 への Design GO 条件を満たす。
