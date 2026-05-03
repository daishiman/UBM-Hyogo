[実装区分: 実装仕様書]

# Phase 5: 実装着手ランブック — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 目的

この Phase の責務を、per-sync cap alert 仕様の実装承認前に検証可能な粒度へ固定する。

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-04.md

## 成果物

- phase-05.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## 前提

- Phase 1-4 が完了している
- user から実装着手の明示指示がある
- ローカルで Node 24.15.0 / pnpm 10.33.2 が `mise` 経由で有効化されている

## ステップ

### Step 1: 依存準備

```bash
mise exec -- pnpm install
```

### Step 2: zod schema 拡張

- 編集: `apps/api/src/jobs/_shared/sync-jobs-schema.ts`
- 差分: `metricsSchema` に `writeCapHit: z.boolean().optional()` を追加
- 検証: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`

### Step 3: cap-alert.ts 新規作成

- 新規: `apps/api/src/jobs/cap-alert.ts`
- 内容: phase-03 §2 のシグネチャ通り
- 検証: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`

### Step 4: cap-alert.test.ts 新規作成

- 新規: `apps/api/src/jobs/cap-alert.test.ts`
- ケース: phase-06 §1 の T-1〜T-6
- 検証: `mise exec -- pnpm --filter @ubm-hyogo/api test cap-alert`

### Step 5: wrangler.toml 更新

- 編集: `apps/api/wrangler.toml`
- 追加: `[[analytics_engine_datasets]]` × 3 ブロック（top / env.staging / env.production）
- 検証: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run`（dry-run のみ。本番 deploy は user 指示まで実施しない）

### Step 6: Env 型拡張

- 編集: `apps/api/src/index.ts` および `ResponseSyncEnv` の周辺型
- 追加: `readonly SYNC_ALERTS?: AnalyticsEngineDataset`
- 検証: typecheck

### Step 7: sync-forms-responses.ts 統合

- 編集: `apps/api/src/jobs/sync-forms-responses.ts`
- 差分: phase-03 §3 の通り `succeed()` payload と detector / emit 呼び出しを追加
- 検証: typecheck + unit test

### Step 8: 既存テスト更新

- 編集: `apps/api/src/jobs/sync-forms-responses.test.ts` および `__fixtures__/d1-fake.ts`
- 検証: `mise exec -- pnpm --filter @ubm-hyogo/api test sync-forms-responses`

### Step 9: specs / runbook 追記

- 編集: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- 新規: `docs/30-workflows/task-03b-followup-006-per-sync-cap-alert/outputs/phase-12/runbook-per-sync-cap-alert.md`

### Step 10: 全体検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

## 禁止操作

- user 明示指示なしの `git commit` / `git push` / PR 作成
- user 明示指示なしの `bash scripts/cf.sh deploy`（dry-run は可）
- `wrangler` 直接呼び出し（必ず `bash scripts/cf.sh` 経由）
- `.env` の中身を `cat` / `Read` 等で表示

## 完了条件

- Step 1〜10 がすべて成功
- typecheck / lint / unit test すべて PASS
- 変更ファイル一覧が `git status --porcelain` で確認できる
