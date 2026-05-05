# DB Constraint Design

Status: spec_created

Base case: add a partial UNIQUE index for confirmed stable keys only.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_questions_revision_stablekey_unique
  ON schema_questions (revision_id, stable_key)
  WHERE stable_key IS NOT NULL
    AND stable_key != 'unknown'
    AND stable_key NOT LIKE '\_\_extra\_\_:%' ESCAPE '\\';
```

Required ordering:

1. Detect existing collisions.
2. Resolve or quarantine collisions.
3. Add the partial UNIQUE index.

Ownership: `apps/api/migrations/**` and repository checks remain inside `apps/api/**`; `apps/web` must not access D1 directly.
