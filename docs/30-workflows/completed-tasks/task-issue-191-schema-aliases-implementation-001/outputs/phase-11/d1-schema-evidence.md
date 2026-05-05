# D1 Schema Evidence

Status: PASS

Migration: `apps/api/migrations/0008_create_schema_aliases.sql`

## DDL Evidence

```sql
CREATE TABLE IF NOT EXISTS schema_aliases (
  id                TEXT PRIMARY KEY,
  stable_key        TEXT NOT NULL,
  alias_question_id TEXT NOT NULL UNIQUE,
  alias_label       TEXT,
  source            TEXT NOT NULL DEFAULT 'manual',
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resolved_by       TEXT,
  resolved_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_schema_aliases_stable_key
  ON schema_aliases(stable_key);
```

## Confirmed Contract

- Columns: `id`, `stable_key`, `alias_question_id`, `alias_label`, `source`, `created_at`, `resolved_by`, `resolved_at`.
- Unique alias question id: `alias_question_id TEXT NOT NULL UNIQUE`.
- Required index: `idx_schema_aliases_stable_key`.
