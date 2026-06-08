# 2026-06-06 — issue-1125 bulk tag result staging mutation visual baseline

`docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / staging_runtime_pending_user_gate` として同期。

実装:

- `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts`
- `apps/api/migrations/seed/bulk-tag-result-staging-{seed,cleanup}.sql`
- `scripts/smoke/capture-bulk-tag-result.sh`
- `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh`
- `package.json` `smoke:test` 接続

検証:

- `bash -n scripts/smoke/capture-bulk-tag-result.sh && bash -n scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` PASS
- `bash scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` PASS

境界:

- apps/web production source / apps/api production source / D1 schema table definition / Google Form schema は不変。
- 認証付き staging seed -> real UI mutation -> baseline generation -> cleanup、commit、push、PR は user-gated。
