# Phase 9 成果物: 品質ゲート結果

## 実行結果サマリ

| ゲート | コマンド | 結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | PASS (apps/api / apps/web / packages 全件) |
| lint | `mise exec -- pnpm lint` | PASS (boundaries / deps / stablekey / tsc + eslint) |
| vitest (unit) | `mise exec -- pnpm exec vitest run infra/cloudflare-alerts/lib/__tests__` | 31/31 PASS |
| vitest (cli) | `mise exec -- pnpm exec vitest run scripts/__tests__/cf-alerts-cli.test.ts` | 13/13 PASS |
| 合計テスト | `pnpm test:alerts` | 44/44 PASS |
| JSON 妥当性 | inline node script | PASS (5 policy / 1 webhook, threshold 直書きなし, op:// only) |
| Secret scan | `git grep` | 実 token / 実 URL の混入なし |

## 受け入れ基準対応

| AC | 内容 | エビデンス |
| --- | --- | --- |
| AC-1 | infra/cloudflare-alerts/policies/*.json に 4 category / 5 policy + quota-base.json | files exist |
| AC-2 | webhook destination が name で参照 / ID 直書き禁止 | Schema `additionalProperties:false` + 全 policy で `{"name":"ut-17-relay"}` |
| AC-3 | apply 冪等 (連続実行で diff 空) | S10 PASS |
| AC-4 | diff が drift で exit 非 0 + 差分 JSON | S5/S6 PASS (exit 2, JSON 出力) |
| AC-5 | list が read-only 出力 | S3 PASS、apply 系 API 呼ばれない |
| AC-6 | API Token scope 分離 (apply / read) | `.env.example` + README 記載、Phase 2 token-scope-design.md |
| AC-7 | infra/cloudflare-alerts/README.md に運用手順 | 配置済み |
| AC-8 | CI workflow が read-only token のみ参照 | `CLOUDFLARE_ALERTS_TOKEN_READ` のみ env に注入 |
| AC-9 | 親 UT-17 implementation-guide Part 5 から本タスクへリンク | Phase 12 で追加 (`outputs/phase-12/main.md`) |
| AC-10 | monthly healthcheck runbook が cf.sh alerts diff へ差替 | Phase 12 で更新 |
| AC-11 | apply 内部で webhook → policy 順 + name 解決 | S9 PASS |
| AC-12 | design-review.md に GO/NO-GO 記録 | `outputs/phase-03/design-review.md` |
