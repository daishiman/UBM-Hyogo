# apps/api/migrations

D1 schema migrations. すべての新規 / 編集 PR は以下ガイドラインに従うこと。

📌 **[D1 Migration Test Guideline](../../../docs/30-workflows/unassigned-task/UT-08A-04-d1-migration-test-guideline.md)** — 最低基準 3 項目 / 02b 責任範囲 / 適用フロー

## Sequence guard

新規 migration は `NNNN_description.sql` 形式で作成し、原則として同じ `NNNN`
prefix を再利用しない。既存の重複 prefix は historical exception として
[`sequence-exceptions.json`](./sequence-exceptions.json) に明示する。

検証:

```bash
pnpm verify:d1-migrations
node --test scripts/__tests__/verify-d1-migration-sequence.test.mjs
```

この guard は以下を fail させる:

- `NNNN_description.sql` 形式ではない SQL file
- `sequence-exceptions.json` に登録されていない重複 prefix
- 実ファイルと一致しない stale exception
- rationale がない exception
