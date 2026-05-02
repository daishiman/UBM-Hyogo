# sql-semantic-diff.md

Status: `PASS`

Expected command:

```bash
git diff main -- apps/api/migrations/0001_init.sql apps/api/migrations/0005_response_sync.sql \
  | grep -E '^[+-][^-+]' \
  | grep -vE '^[+-]\s*--' \
  | grep -vE '^[+-]\s*$'
```

Expected result: empty output. Comment-only migration edits must not alter SQL semantics.

Observed result: empty output after excluding SQL comments and blank lines. The migration edits are comment-only.
