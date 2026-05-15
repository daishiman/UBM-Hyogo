# Phase 4 成果物: タスク分解

| ID | タスク | 依存 | 完了確認 |
| --- | --- | --- | --- |
| T1 | quota-base.json + 5 policy JSON + 1 webhook JSON 配置 | — | files exist |
| T2 | 3 JSON Schema 配置 (additionalProperties:false) | — | files exist |
| T3 | Node 純関数 7 種 + types.ts 実装 | T1, T2 | tsc OK |
| T4 | vitest C1〜Q6 + load.test 実装 | T3 | `vitest run` green |
| T5 | `scripts/cf.sh alerts` 分岐実装 (list/diff/plan/apply) | T3 | manual exec OK |
| T6 | scripts/__tests__/cf-alerts-cli.test.ts (S1〜S13 相当、bats 代替) | T5 | green |
| T7 | `.github/workflows/cloudflare-alerts-drift.yml` 配置 (read-only token のみ) | T5 | actionlint 通過 |
| T8 | infra/cloudflare-alerts/README.md 配置 | T1〜T7 | content review |
| T9 | `.env.example` に op:// refs 2 件追加 | T2 | grep OK |
| T10 | vitest.config.ts include に lib/__tests__ 追加 | T4 | discovery OK |
| T11 | package.json scripts `cf:alerts:{list,diff,apply}` + `test:alerts` 追加 | T5 | exec OK |
| T12 | runbook Step 4 を `pnpm cf:alerts:diff` に差替 | T5 | content review |
| T13 | 親 UT-17 implementation-guide.md Part 5 にリンク追記 (append-only) | T8 | content review |
| T14 | 全 phase outputs / artifacts.json 更新 | T1〜T13 | planning state → completed |
