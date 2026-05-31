# Phase 11: Evidence inventory

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 11 |
| state | implemented_local_runtime_pending |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

この Phase は issue #998「Google Form 回答済み会員が `/members` 公開ページに表示されない」を production まで解決するための runtime evidence を、検証可能な形へ固定する。production flag enablement（Task A・実装サイクル内）と staging / production runtime ops（Task B/C・user-gated）の evidence を inventory として確定する。

> **VISUAL_ON_EXECUTION**: `/members` の browser smoke screenshot は runtime 実行時（user-gated）に取得する。local 実装検証段階では全 runtime evidence が未取得である。代替の present evidence として、Task A で取得した `outputs/phase-11/manual-test-result.md`（ローカル回帰結果）と Phase 10（local-verification）を参照する。

## 実行タスク

- Task A（production flag 変更 + 既実装回帰）のローカル回帰結果を `outputs/phase-11/manual-test-result.md` に記録する。
- Task B（staging runbook）の deploy / diagnose / backfill / browser smoke evidence を Gate-C user-gated として明示する。
- Task C（production runbook）の deploy / diagnose / backfill / browser smoke + rollback evidence を Gate-C user-gated として明示する。
- evidence JSON / log への secret 非混入（redaction grep）を完了条件に含める。

## 参照資料

- 依存 Phase: phase-01 / Phase 1, phase-02 / Phase 2, phase-03 / Phase 3, phase-10 / Phase 10
- `artifacts.json`
- `tasks/task-a-production-flag-enablement.md`, `tasks/task-b-staging-runtime-verification.md`, `tasks/task-c-production-runtime-rollout.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- 親ワークフロー: `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。
- [ ] runtime evidence は user-gated 実行後に present へ更新する（本サイクルでは pending）。

## Evidence inventory

### ローカル回帰 evidence（Task A / 実装サイクル内）

| Item | Path | Status | 取得手段 |
|------|------|--------|---------|
| manual-test-result.md | outputs/phase-11/manual-test-result.md | present (Gate-B passed) | `apps/api` typecheck / build / API regression suite + `wrangler.toml` flag diff を記録 |
| local-verification（参照） | 親 workflow phase-10 + 本 workflow phase-10-local-verification.md | present | 既実装の focused tests / D1 contract / typecheck / build / script syntax（親で取得済み） |

### staging runtime evidence（Task B / Gate-C, user-gated）

| Item | Path | Status | 取得手段 |
|------|------|--------|---------|
| staging members before | outputs/phase-11/staging-members-before.png | pending (Gate-C, user-gated) | staging `/members` browser screenshot（deploy 前） |
| staging diagnose pre | outputs/phase-11/staging-diagnose-pre.json | pending (Gate-C, user-gated) | `bash scripts/diagnose-members-pipeline.sh --env staging > outputs/phase-11/staging-diagnose-pre.json` |
| staging backfill dry-run | outputs/phase-11/staging-backfill-dry-run.json | pending (Gate-C, user-gated) | `bash scripts/backfill-publish-state.sh --env staging --dry-run > outputs/phase-11/staging-backfill-dry-run.json` |
| staging backfill apply | outputs/phase-11/staging-backfill-apply.json | pending (Gate-C, user-gated) | `bash scripts/backfill-publish-state.sh --env staging --apply > outputs/phase-11/staging-backfill-apply.json`（approval marker 後） |
| staging diagnose post | outputs/phase-11/staging-diagnose-post.json | pending (Gate-C, user-gated) | `bash scripts/diagnose-members-pipeline.sh --env staging > outputs/phase-11/staging-diagnose-post.json` |
| staging members after | outputs/phase-11/staging-members-after.png | pending (Gate-C, user-gated) | staging `/members` browser screenshot（backfill apply 後） |
| staging gate-c summary | outputs/phase-11/staging-gate-c-summary.md | pending (Gate-C, user-gated) | deploy version / candidates / applied / visiblePublicCount 差分 / spot check を集約 |

### production runtime evidence（Task C / Gate-C, user-gated）

| Item | Path | Status | 取得手段 |
|------|------|--------|---------|
| prod D1 backup（path のみ記録） | outputs/phase-11/prod-backup-&lt;timestamp&gt;.sql | pending (Gate-C, user-gated) | `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output ...`（リポジトリにコミットせず安全保管） |
| prod members before | outputs/phase-11/prod-members-before.png | pending (Gate-C, user-gated) | production `/members` browser screenshot（deploy 前） |
| prod diagnose pre | outputs/phase-11/prod-diagnose-pre.json | pending (Gate-C, user-gated) | `bash scripts/diagnose-members-pipeline.sh --env production > outputs/phase-11/prod-diagnose-pre.json` |
| prod backfill dry-run | outputs/phase-11/prod-backfill-dry-run.json | pending (Gate-C, user-gated) | `bash scripts/backfill-publish-state.sh --env production --dry-run > outputs/phase-11/prod-backfill-dry-run.json` |
| prod backfill apply | outputs/phase-11/prod-backfill-apply.json | pending (Gate-C, user-gated) | `bash scripts/backfill-publish-state.sh --env production --apply > outputs/phase-11/prod-backfill-apply.json`（approval marker 後） |
| prod diagnose post | outputs/phase-11/prod-diagnose-post.json | pending (Gate-C, user-gated) | `bash scripts/diagnose-members-pipeline.sh --env production > outputs/phase-11/prod-diagnose-post.json` |
| prod members after | outputs/phase-11/prod-members-after.png | pending (Gate-C, user-gated) | production `/members` browser screenshot（backfill apply 後） |
| prod rollout summary | outputs/phase-11/prod-rollout-summary.md | pending (Gate-C, user-gated) | deploy version / candidates / applied / visiblePublicCount 差分 / rollback 手順 / spot check を集約 |

## Secret redaction（不変条件 #5）

- 全 evidence JSON / log の保存後に `rg 'SYNC_ADMIN_TOKEN' outputs/phase-11`（および token prefix）でゼロ件を確認する。
- `SYNC_ADMIN_TOKEN` 等の secret 値は evidence ファイルへ残さない。runbook のコマンド表記は `SYNC_ADMIN_TOKEN=<redacted>` で記述する。

## conditional implementation 注記

backfill dry-run の `candidates=0`（既に全件 public 化済み、または昇格対象なし）の場合は apply をスキップしてよい（no-op）。その場合は `/members` 非表示の別原因（H1 ingest / H2 identity / H4 schema）を疑い、親ワークフローの該当 CLOSED issue（#956 / #957 / #959）の runbook を参照し、follow-up として切り出す（Phase 12 unassigned-task-detection で記録）。

## 統合テスト連携

Phase 11 は end-to-end 結合検証（staging→production の deploy→backfill→公開フィルタ→`/members` 表示）の evidence を集約する層。runtime evidence は user-gated（Gate-C）で取得し、`manual-test-result.md` / `manual-test-report.md` に before/after の `visiblePublicCount` 差分と screenshot を present 化する。VISUAL_ON_EXECUTION のため screenshot PNG は runtime 実行時にのみ生成される（local 実装検証段階では pending）。
