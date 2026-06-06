# 2026-06-03 issue-1081-bulk-tag-real-d1-runtime-smoke

`docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/` を
`implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` として同期。

- 親 issue-1036 で landed 済の `POST /admin/members/tags/bulk` を、staging Workers + `ubm-hyogo-db-staging` real D1 に対して実走させる smoke gate を追加。
- `scripts/smoke/runtime-tag-bulk.sh`（env/production 多層 guard・redaction・summary.json・fail-closed contract assertion）、`apps/api/migrations/seed/bulk-tag-staging-{seed,cleanup}.sql`、`.github/workflows/runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke` job、`scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（network-free stub）、`package.json#smoke:test` を同一 cycle で実装。
- contract は実装実態に最適化（`{ batchId, results:[{memberId,tagId,status}] }` / `@ubm-hyogo/api`）。endpoint contract・D1 schema・UI・auth は変更なし。
- audit append 数は `correlation_id` 列不在のため `target_id LIKE 'e2e_test_issue1081_%'` の prefix count で検証。fixture prefix は `e2e_test_issue1081_` 固定。
- local shell test / actionlint / `pnpm smoke:test` PASS。staging real D1 seed/mutation/cleanup の実走証跡は Gate-B（user-gated）。

正本同期は同一 wave で実施。quick-reference / resource-map / task-workflow-active / SKILL-changelog / artifact-inventory（`workflow-issue-1081-...-artifact-inventory.md`）/ lessons-learned（新規 `lessons-learned-issue-1081-...-2026-06.md` L-I1081-001..009）/ LOGS を反映、topic-map / keywords は `indexes:rebuild` 委譲。task-specification-creator 側は `patterns-runtime-evidence-followup.md` の Runtime Smoke Gate Follow-up 節 + SKILL-changelog を反映。

ドメイン契約（API endpoint schema / D1 schema / IPC / UI route / auth / Cloudflare Secret）は不変（N/A）。staging deploy・real D1 mutation smoke・commit・push・PR・Issue #1081 state 変更（CLOSED 維持）は user-gated。
