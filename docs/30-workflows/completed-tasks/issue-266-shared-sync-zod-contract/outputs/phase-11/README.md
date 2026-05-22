# outputs/phase-11/ — evidence (NON_VISUAL)

issue-266 は UI 変更を伴わない（NON_VISUAL）ため、スクリーンショットの代わりに CLI evidence を保存する。

## 保存予定ファイル一覧

| ファイル | 内容 | 取得コマンド（リポジトリ root から） |
|---------|------|-----|
| `typecheck.log` | `pnpm typecheck` 出力 | `mise exec -- pnpm typecheck > .../typecheck.log 2>&1` |
| `typecheck.exit` | typecheck の exit code | `echo $? > .../typecheck.exit` |
| `lint.log` | `pnpm lint` 出力 | `mise exec -- pnpm lint > .../lint.log 2>&1` |
| `lint.exit` | lint の exit code | 同上 |
| `test-shared.log` | shared `sync-log.spec.ts` の vitest 結果 | `mise exec -- pnpm --filter @ubm-hyogo/shared test > .../test-shared.log 2>&1` |
| `test-api-sync.log` | apps/api `sync/` 配下 contract spec の vitest 結果 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync/ > .../test-api-sync.log 2>&1` |
| `coverage-shared.log` | shared coverage summary | `mise exec -- pnpm --filter @ubm-hyogo/shared test -- --coverage > .../coverage-shared.log 2>&1` |
| `grep-gate.sh` | grep gate wrapper（再利用可・実行権限を付与） | 本ディレクトリに保存する shell script |
| `grep-no-drift.log` | grep gate 実行ログ | `bash .../grep-gate.sh > .../grep-no-drift.log 2>&1` |
| `d1-distinct.log` | staging D1 `SELECT DISTINCT trigger_type, status` 結果 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --command "..." > .../d1-distinct.log 2>&1` |

## 判定基準

| ログ | 合格条件 |
|------|---------|
| `typecheck.exit` | `0` |
| `lint.exit` | `0` |
| `test-shared.log` | 20+ pass / 0 fail |
| `test-api-sync.log` | 既存件数 + 1 pass / 0 fail / 0 regression |
| `coverage-shared.log` | `sync-log.ts` line 100% |
| `grep-no-drift.log` | 末尾に `OK: all grep gates passed` |
| `d1-distinct.log` | `trigger_type` ∈ {cron, admin, backfill}（旧値 0 件） |

## 詳細手順

`../../phase-11-manual-test.md` を参照。
