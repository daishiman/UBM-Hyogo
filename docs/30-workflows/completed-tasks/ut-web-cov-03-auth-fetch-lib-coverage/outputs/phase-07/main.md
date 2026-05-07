# outputs phase 07: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

- status: planned
- purpose: AC × test × evidence マトリクス
- evidence: `apps/web/coverage/coverage-summary.json`（実測時に capture）

## AC × test マトリクス

| AC ID | AC 内容 | 対象 | test file | test ID 範囲 | evidence path | status |
|---|---|---|---|---|---|---|
| AC-01 | auth client 4 ケース | auth.ts | auth.test.ts | AUTH-001..AUTH-025 | coverage-summary.json#auth.ts | planned |
| AC-02a | authed 200/401/403/5xx/network | fetch/authed.ts | fetch/authed.test.ts | FAU-001..FAU-010 | coverage-summary.json#fetch/authed.ts | planned |
| AC-02b | public 200/404/500/network | fetch/public.ts | fetch/public.test.ts | FPU-001..FPU-010 | coverage-summary.json#fetch/public.ts | planned |
| AC-03 | me-types round-trip | api/me-types.ts | api/me-types.test-d.ts | MET-T01..MET-T04 | typecheck 緑 + exclude | planned |
| AC-04 | coverage ≥85%/≥80% | 全 7 | (集約) | - | coverage-summary.json 全 metric | planned |
| AC-05 | regression なし | 既存 | (既存) | - | `pnpm --filter web test` 全緑 | planned |
| AC-06a | magic-link 網羅 | magic-link-client.ts | magic-link-client.test.ts | MLC-001..MLC-008 | coverage-summary.json#magic-link-client.ts | planned |
| AC-06b | oauth-client 網羅 | oauth-client.ts | oauth-client.test.ts | OAC-001..OAC-005 | coverage-summary.json#oauth-client.ts | planned |
| AC-06c | session 網羅 | session.ts | session.test.ts | SES-001..SES-005 | coverage-summary.json#session.ts | planned |

## test ID prefix 体系

- AUTH- / MLC- / OAC- / SES- / FAU- / FPU- / MET-

## 昇格条件

- planned → implemented: test 実装済み・vitest run 緑
- implemented → verified: coverage-summary.json で AC-04 閾値達成 + 既存 test regression なし

## 計測コマンド

```bash
mise exec -- pnpm --filter web test:coverage
mise exec -- pnpm --filter web test
```

## cross-check 手順

1. 上表の全 AC が test file に mapping されていることを目視。
2. Phase 6 の異常系 ID（AUTH-E* / MLC-E* / OAC-E* / SES-E* / FAU-E* / FPU-E*）が test ID 範囲に展開されていることを確認。
3. coverage-summary.json で対象 7 ファイルの metric が閾値を満たしているか jq で確認。
