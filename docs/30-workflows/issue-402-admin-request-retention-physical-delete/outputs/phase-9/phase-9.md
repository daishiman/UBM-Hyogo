# Phase 9 正本: 品質保証

## 目的
retention purge 実装一式（schema / policy / job / cron / runbook / tests）に対し、リポジトリ標準の品質ゲートを通し、migration 適用後の D1 schema drift がないことを確認する。

## 実行コマンドと期待結果（実装後に実行）
| # | コマンド | 期待 |
|---|----------|------|
| 1 | `mise exec -- pnpm typecheck` | 実装後 PASS |
| 2 | `mise exec -- pnpm lint` | 実装後 PASS。retention purge 関連で未使用 import / any 残存なし |
| 3 | `mise exec -- pnpm build` | 実装後 PASS。`apps/api` の Workers バンドルに `scheduled` handler が含まれる |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- retention-purge` | 実装後 PASS。Phase 5 unit + Phase 8 integration を含む |
| 5 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "PRAGMA table_info(deleted_members)"` | `purged_at` / `retention_policy_version` を確認 |

## 補助確認
- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` 相当で wrangler が既存 cron trigger を解釈できることを確認（`crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` がエラーにならない）。
- staging に migration を apply し `wrangler d1 execute` で `PRAGMA table_info(deleted_members)` を実行、`purged_at` / `retention_policy_version` カラムの存在を確認:
  ```bash
  bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
  bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "PRAGMA table_info(deleted_members)"
  ```

## drift 検出時の対処
- `PRAGMA table_info` で diff が出た場合、manual SQL migration を修正し、Phase 5 にループバック。
- すでに staging に apply 済みの場合は新規 migration を追加し、down 操作は別途 runbook に記録する（D1 は down migration 自動化していないため手動 SQL を記載する）。

## 完了基準
- 実装後、上記 5 コマンドが全て PASS。
- staging で migration apply 後、D1 の table_info が期待カラムを含む。
- `PRAGMA table_info` が clean（drift なし）。
