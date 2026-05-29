# Implementation Guide Reflection

## Part 1: Plain-Language Summary

The public members page is empty because the data pipeline may have synced members without making them publicly visible. The implementation must first measure where the data stopped, then only publish records that have explicit public consent and no admin override.

## Part 2: Technical Summary

The implementation extends `getFormsPipelineSnapshot()` and `FormsPipelineSnapshotSchema`, adds a sync-token diagnostics endpoint for scripts, introduces a pure auto-publish policy, and adds an idempotent sync-token backfill endpoint. It must not depend on a non-existent history table.

## Part 3: Implementation Steps

1. Extend diagnostics fields and tests.
2. Add `MEMBERS_AUTO_PUBLISH_ON_CONSENT` to `ResponseSyncEnv`, `Env`, and wrangler vars.
3. Add policy pure function and integrate it after `setConsentSnapshot()`.
4. Add `/admin/sync/backfill-publish-state` with dry-run default.
5. Run focused tests, typecheck, lint, and build.

## Part 4: Verification Commands

```bash
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/api build
bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh
pnpm exec vitest run --root=. --config=vitest.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/diagnostics/forms-pipeline.spec.ts \
  apps/api/src/diagnostics/forms-pipeline.contract.spec.ts \
  apps/api/src/lib/policies/auto-publish.spec.ts \
  apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts
pnpm exec vitest run --root=. --config=vitest.d1.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts
```

## Part 5: Known Limits

Runtime staging deploy, backfill apply, and browser smoke are user-gated. Production flag enablement is out of scope for this workflow.

## Part 6: Actual Implementation Summary (2026-05-28)

### Files changed (`git diff --stat`)

```
 .../indexes/quick-reference.md                     |  12 ++
 .../indexes/resource-map.md                        |   1 +
 .../references/task-workflow-active.md             |  13 ++
 .../diagnostics/forms-pipeline.contract.spec.ts    |  11 ++
 apps/api/src/diagnostics/forms-pipeline.spec.ts    |  68 +++++++++-
 apps/api/src/diagnostics/forms-pipeline.ts         | 139 +++++++++++++++++++++
 apps/api/src/diagnostics/schema.ts                 |  26 ++++
 apps/api/src/index.ts                              |   8 ++
 apps/api/src/jobs/__fixtures__/d1-fake.ts          |  16 +++
 .../src/jobs/sync-forms-responses.contract.spec.ts |  84 +++++++++++++
 apps/api/src/jobs/sync-forms-responses.ts          |  65 +++++++++-
 apps/api/wrangler.toml                             |   6 +
```

New files:
- `apps/api/src/lib/policies/auto-publish.ts`
- `apps/api/src/lib/policies/auto-publish.spec.ts`
- `apps/api/src/routes/admin/sync-diagnostics.ts`
- `apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts`
- `apps/api/src/routes/admin/sync-backfill-publish-state.ts`
- `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts`
- `scripts/diagnose-members-pipeline.sh`
- `scripts/backfill-publish-state.sh`

### Task A (diagnostics 拡張)

- `FormsPipelineSnapshotSchema` に `publicConsentBreakdown` / `publishStateBreakdown` / `visiblePublicCount` / `lastSuccessfulSyncAt` / `totals` / `diagnosis` を追加（H1-H4 / `secretsReadiness` の boolean-only は維持）。
- `getFormsPipelineSnapshot()` に対応する SQL を追加。`visiblePublicCount` は `/api/public/members` と同じ境界（`public_consent='consented' AND publish_state='public' AND is_deleted=0 AND NOT EXISTS identity_aliases.source_member_id`）。
- `lastSuccessfulSyncAt` は `status IN ('success','succeeded')` を許容。
- `buildDiagnosisSummary()` を純関数として export し、H1-H4 と breakdown から日本語 summary を組み立てる。
- 既存 `/admin/diagnostics/forms-pipeline`（Auth.js admin）と並立する `GET /admin/sync/diagnostics/forms-pipeline`（SYNC_ADMIN_TOKEN bearer）を新規追加。
- `scripts/diagnose-members-pipeline.sh` で curl + jq により主要フィールドを表示。token はログに出さない。

### Task B (auto-publish policy)

- `apps/api/src/lib/policies/auto-publish.ts` を新規。`decidePublishState` / `isAdminOverrideStatus` / `normalizePublishState` / `normalizeConsentValue` を export。
- `ResponseSyncEnv` に `MEMBERS_AUTO_PUBLISH_ON_CONSENT?: string` を追加（Env は ResponseSyncEnv を継承するため Env 側は変更不要）。
- `processResponse()` の consent snapshot 直後で flag 有効時のみ policy を評価し、結果が現状と差異がある場合のみ `UPDATE member_status SET publish_state, updated_by='system:sync', updated_at=datetime('now')` を発行。admin override（hidden / `updated_by` が system 以外）は尊重。
- `estimateResponseWrites()` に flag 有効時 +1 を加算し、write cap 計算を補正。
- wrangler.toml: staging=`true` / production=`false`（production 切替は user-gated）。

### Task C (backfill endpoint)

- `POST /admin/sync/backfill-publish-state?dryRun=true|false`（default `dryRun=true`）。
- 全 `member_status` を scan し、auto-publish policy を適用。`scanned` / `candidates` / `applied` / `skipped:{alreadyPublic, adminExplicit, consentNotMet, deleted}` を返す。
- apply 時は 200 件単位の `db.batch()` で UPDATE。`updated_by='system:backfill'`。
- 再実行は idempotent（applied=0 になる）。
- `scripts/backfill-publish-state.sh`（dry-run default / `--apply` で対話確認）。

### Test results

```
pnpm exec vitest run --root=. --config=vitest.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/diagnostics/forms-pipeline.spec.ts \
  apps/api/src/diagnostics/forms-pipeline.contract.spec.ts \
  apps/api/src/lib/policies/auto-publish.spec.ts \
  apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts
Test Files  4 passed (4)
     Tests  31 passed (31)

pnpm exec vitest run --root=. --config=vitest.d1.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts
Test Files  2 passed (2)
     Tests  22 passed (22)
```

`pnpm --filter @ubm-hyogo/api typecheck`、`pnpm --filter @ubm-hyogo/api build`、`bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh` は green。

Note: `pnpm --filter @ubm-hyogo/api test -- ...` は unit/D1 split を無視して API 全体に展開され、既存 D1 hook timeout を誘発するため、この workflow の focused verification には使わない。

### Runtime ops (staging) — user-gated

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
SYNC_ADMIN_TOKEN=... bash scripts/diagnose-members-pipeline.sh --env staging
SYNC_ADMIN_TOKEN=... bash scripts/backfill-publish-state.sh --env staging --dry-run
SYNC_ADMIN_TOKEN=... bash scripts/backfill-publish-state.sh --env staging --apply
SYNC_ADMIN_TOKEN=... bash scripts/diagnose-members-pipeline.sh --env staging
```
