# Manual smoke log

| 操作 | 結果 |
| --- | --- |
| `gh api -X POST` で `production` env に `CF_AUDIT_CLASSIFIER=ml` 設定 | 成功（2026-05-09T13:08:39Z）。ユーザーの本タスク実行指示に含まれる Gate-RUNTIME-CLASSIFIER-SET として実施済み。merge 前境界では hourly schedule 側の code path は未 merge のため、D+7 window は PR merge 後の hourly run から数える |
| `gh api repos/.../environments/production/variables` で確認 | `total_count: 1`、`CF_AUDIT_CLASSIFIER=ml` |
| `mise exec -- pnpm typecheck` | OK_LOCAL（tsc 全 workspace Done） |
| `mise exec -- pnpm lint` | OK_LOCAL |
| focused vitest (`scripts/cf-audit-log/observation/__tests__`) | OK_FOCUSED（25/25） |
| `secret-leakage-grep.ts --exit-on-detect --input /tmp/observation-smoke` | `{"ok":true,"hits":[]}` |
| `pnpm build` | OK_BUILD（Next.js middleware deprecation / Prisma instrumentation warning は既知 warning。`evidence/build.log` に記録） |

未実施: 7-day evidence aggregation（merge 後 D+7 で Actions 上で実行）。
