# Phase 10: ローカル検証手順

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 10 |
| state | implemented_local_runtime_pending |
| implementation_mode | verify_existing + コード変更 1 点 |

## 目的

runtime ではなく**ローカルで検証可能な範囲**に限定して、本タスクの正しさを確認する。具体的には (1) flag 変更の git diff 確認、(2) TOML 構文確認、(3) typecheck / build、(4) 4 focused spec green、(5) staging / production flag の一致確認（`rg`）。runtime 検証（deploy / backfill / browser smoke）は Phase 11 の user-gated 範囲であり本 Phase の対象外である。

## 実行タスク

- flag 変更の static review と既実装回帰確認をローカルで完結させる。
- runtime ops を本 Phase の対象外として明示分離する。

## 参照資料

- 依存 Phase: [phase-01-requirements.md](phase-01-requirements.md) / Phase 1, [phase-02-architecture.md](phase-02-architecture.md) / Phase 2, [phase-05-implementation-guide.md](phase-05-implementation-guide.md) / Phase 5, [phase-07-quality-gates.md](phase-07-quality-gates.md) / Phase 7
- [tasks/task-a-production-flag-enablement.md](tasks/task-a-production-flag-enablement.md)
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

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

## ステップ（ローカル検証）

```bash
# 1. flag 変更の git diff 確認
#    期待: [env.production.vars] の MEMBERS_AUTO_PUBLISH_ON_CONSENT が "false"→"true"、
#    付随コメントのみの 1 hunk。他 env / 他 var に波及していないこと。
git diff apps/api/wrangler.toml

# 2. staging / production flag の一致確認（drift がないこと）
#    期待: production（line 72 付近）/ staging（line 162 付近）がともに "true"。
rg -n 'MEMBERS_AUTO_PUBLISH_ON_CONSENT' apps/api/wrangler.toml

# 3. TOML 構文の妥当性（パースできること）
#    Node で TOML を読めるか、または wrangler 設定読込で構文エラーが出ないことを確認。
#    （deploy 時に cf.sh が最終検証するため、ローカルでは構文の崩れがないことの確認に留める）
mise exec -- node -e "const fs=require('fs');const s=fs.readFileSync('apps/api/wrangler.toml','utf8');if(!/MEMBERS_AUTO_PUBLISH_ON_CONSENT\s*=\s*\"true\"/.test(s)){process.exit(1)}console.log('toml flag ok')"

# 4. typecheck / build（既実装回帰）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api build

# 5. 4 focused spec（既実装回帰）
# unit config 対象
mise exec -- pnpm exec vitest run \
  apps/api/src/lib/policies/auto-publish.spec.ts \
  apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts

# D1 contract config 対象
mise exec -- pnpm exec vitest run --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts

# 6. ops script の shell syntax（不変・実行はしない）
bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh

# 7. PR pre-flight（docs / spec gate）
bash scripts/verify-pr-ready.sh
```

## 期待結果

| ステップ | 期待 |
|---------|------|
| 1 | diff が production flag `"false"`→`"true"` ＋ コメントのみ（1 hunk）。 |
| 2 | production / staging がともに `MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"`（drift なし）。 |
| 3 | `toml flag ok` を出力（exit 0）。 |
| 4 | `typecheck` / `build` ともに exit 0。 |
| 5 | 4 focused spec すべて green（exit 0）。`decidePublishState` の truth table（flag=false 維持 / hidden 維持 / public 維持 / member_only+consented→public）が回帰なし。 |
| 6 | `bash -n` が exit 0（構文エラーなし）。 |
| 7 | `verify-pr-ready.sh` が exit 0。 |

## 本 Phase の対象外（runtime / user-gated）

以下は runtime ops であり、本 Phase（ローカル検証）の対象外。Phase 11（evidence inventory）/ Task B（staging）/ Task C（production）で user-gated に実行する:

- staging / production への deploy（`bash scripts/cf.sh deploy ...`）。
- diagnostics 実行（`bash scripts/diagnose-members-pipeline.sh --env ...`）。
- backfill dry-run / apply（`bash scripts/backfill-publish-state.sh --env ... --dry-run|--apply`）。
- `/members` の browser smoke / before-after screenshot 取得（VISUAL_ON_EXECUTION）。
- production D1 backup 取得。

> これらは Cloudflare secret + 本番 D1 mutation を伴うため、ローカルでは検証できない。本サイクルでは runbook（Task B/C）として手順を確定するのみで、実行はユーザーの明示承認後に行う（不変条件 #7）。

## 統合テスト連携

本 Phase はローカル結合（typecheck/build/4 spec）までを対象とする。runtime 結合（deploy→backfill→`/members`）は Phase 11 で user-gated 実行する。
