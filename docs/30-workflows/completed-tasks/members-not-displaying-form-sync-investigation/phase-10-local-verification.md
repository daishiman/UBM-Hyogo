# Phase 10: ローカル検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 10 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- 依存 Phase: phase-01 / Phase 1, phase-02 / Phase 2, phase-05 / Phase 5
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## 前提

```bash
mise install
mise exec -- pnpm install
```

## ステップ

```bash
# 1. 型 / build
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api build

# 2. shell syntax
bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh

# 3. unit config focused tests
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/diagnostics/forms-pipeline.spec.ts \
  apps/api/src/diagnostics/forms-pipeline.contract.spec.ts \
  apps/api/src/lib/policies/auto-publish.spec.ts \
  apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts

# 4. D1 config focused tests
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts

# 5. PR pre-flight
bash scripts/verify-pr-ready.sh
```

## 期待結果

- すべて green
- `verify-pr-ready.sh` exit 0
- 既存 `apps/api/src/diagnostics/schema.ts` の `FormsPipelineSnapshotSchema` が追加 field を export している

## staging 検証（user-gated）

```bash
# deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# 診断
bash scripts/diagnose-members-pipeline.sh --env staging

# H3 該当時
bash scripts/backfill-publish-state.sh --env staging --dry-run
bash scripts/backfill-publish-state.sh --env staging --apply
bash scripts/diagnose-members-pipeline.sh staging  # visiblePublicCount > 0 を確認

# Web smoke
open "https://ubm-hyogo-web-staging.daishimanju.workers.dev/members"
```
