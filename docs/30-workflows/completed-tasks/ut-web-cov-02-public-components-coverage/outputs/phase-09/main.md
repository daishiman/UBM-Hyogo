# outputs phase 09: ut-web-cov-02-public-components-coverage

- status: implemented-local
- purpose: 品質保証 (verify suite + coverage threshold + regression)

## 実行コマンド（実装時）

| # | コマンド | 期待 |
| --- | --- | --- |
| 1 | `mise exec -- pnpm typecheck` | exit 0 / 型エラー 0 |
| 2 | `mise exec -- pnpm lint` | exit 0 / 0 errors |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | 全 PASS / threshold 達成 |

## coverage threshold 検証

- 対象 7 ファイルの `coverage-summary.json` metric を抽出
- DoD: Stmts/Lines/Funcs ≥85%, Branches ≥80%
- baseline: lines=39.39%（2026-05-01 実測）

## regression 確認

- 既存 web test 件数 / PASS 数の前後比較
- admin / shared package coverage の非低下確認

## evidence

- Phase 11 captured: apps/web/coverage/coverage-summary.json
- Target 7 component thresholds are PASS.
