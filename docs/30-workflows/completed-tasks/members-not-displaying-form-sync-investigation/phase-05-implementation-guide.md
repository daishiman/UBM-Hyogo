# Phase 5: 実装ガイド

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 05 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- phase-04 / Phase 4
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## 変更ファイル一覧

| Task | Path | 種別 | 概要 |
| --- | --- | --- | --- |
| A | `apps/api/src/diagnostics/forms-pipeline.ts` | 編集 | breakdown / visible count / last sync / totals 追加 |
| A | `apps/api/src/diagnostics/schema.ts` | 編集 | `FormsPipelineSnapshotSchema` 拡張 |
| A | `apps/api/src/routes/admin/sync-diagnostics.ts` | 新規 | CLI 用 `requireSyncAdmin` endpoint |
| A | `apps/api/src/index.ts` | 編集 | sync diagnostics route mount |
| A | `apps/api/src/diagnostics/{forms-pipeline.spec,forms-pipeline.contract.spec}.ts` | 編集 | 追加 field と auth 境界 test |
| A | `scripts/diagnose-members-pipeline.sh` | 新規 | sync-token endpoint を curl + jq |
| B | `apps/api/src/lib/policies/auto-publish.ts` | 新規 | `decidePublishState` / `isAdminOverrideStatus` |
| B | `apps/api/src/lib/policies/auto-publish.spec.ts` | 新規 | truth table |
| B | `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | env field / policy 統合 / write cap 更新 |
| B | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | 編集 | flag true/false regression |
| B | `apps/api/src/env.ts` | 編集 | `Env` と sync env の整合 |
| B | `apps/api/wrangler.toml` | 編集 | staging=true / production=false |
| C | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` | 新規 | dry-run/apply endpoint |
| C | `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` | 新規 | D1 fake tests |
| C | `apps/api/src/index.ts` | 編集 | route mount |
| C | `scripts/backfill-publish-state.sh` | 新規 | dry-run default ops script |

## Task A: diagnostics 拡張

`getFormsPipelineSnapshot()` を拡張し、新規関数名は増やさない。H2/H4 は既存 key 名 `H2_identityMismatchSuspected` / `H4_aliasPendingNonZero` を維持する。

```ts
const visibleRow = await db.prepare(`
  SELECT COUNT(*) AS n
  FROM member_status s
  WHERE s.public_consent='consented'
    AND s.publish_state='public'
    AND s.is_deleted=0
    AND NOT EXISTS (
      SELECT 1 FROM identity_aliases ia
      WHERE ia.source_member_id = s.member_id
    )
`).first<{ n: number }>();
```

`lastSuccessfulSyncAt` は `success` と `succeeded` の両方を許容する。

## Task B: policy 統合

canonical publish state は `public | member_only | hidden`。legacy `published/private` は admin 表示互換のために診断では見える化するが、policy 入力前に `published -> public` / `private -> hidden` へ正規化する。

```ts
export function decidePublishState(input: AutoPublishInput): PublishState {
  if (!input.flagEnabled) return input.currentPublishState;
  if (input.hasAdminExplicitOverride) return input.currentPublishState;
  if (input.currentPublishState === "public") return "public";
  if (input.currentPublishState === "hidden") return "hidden";
  return input.publicConsent === "consented" ? "public" : "member_only";
}
```

`setConsentSnapshot()` 後の追加 UPDATE は `writeCount += 1` し、`estimateResponseWrites()` にも policy 有効時の 1 write 余地を入れる。

## Task C: backfill endpoint

`/admin/sync/backfill-publish-state` に寄せる。auth は `requireSyncAdmin`。`member_status_history` は存在しないため使わない。

```sql
SELECT member_id, public_consent, publish_state, updated_by, is_deleted
FROM member_status
```

admin override は `publish_state='hidden'` または `updated_by IS NOT NULL AND updated_by NOT LIKE 'system:%'`。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api build
bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/diagnostics/forms-pipeline.spec.ts \
  apps/api/src/diagnostics/forms-pipeline.contract.spec.ts \
  apps/api/src/lib/policies/auto-publish.spec.ts \
  apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts
```

## staging 検証（user-gated）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/diagnose-members-pipeline.sh --env staging
bash scripts/backfill-publish-state.sh --env staging --dry-run
bash scripts/backfill-publish-state.sh --env staging --apply
bash scripts/diagnose-members-pipeline.sh --env staging
```
