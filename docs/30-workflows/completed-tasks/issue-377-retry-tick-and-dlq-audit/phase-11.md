# Phase 11: 実行 evidence（NON_VISUAL）

## evidence ファイル一覧（実装サイクルで実体化）

| ファイル | 取得方法 | 期待 |
| --- | --- | --- |
| outputs/phase-11/typecheck.log | `mise exec -- pnpm typecheck \| tee outputs/phase-11/typecheck.log` | exit 0 |
| outputs/phase-11/lint.log | `mise exec -- pnpm lint \| tee outputs/phase-11/lint.log` | exit 0 |
| outputs/phase-11/focused-test.log | `pnpm exec vitest run --config=vitest.config.ts apps/api/src/workflows/tagQueueRetryTick.test.ts` | 7 ケース pass |
| outputs/phase-11/api-typecheck.log | `pnpm --filter @ubm-hyogo/api typecheck` | pass |
| outputs/phase-11/api-lint.log | `pnpm --filter @ubm-hyogo/api lint` | pass |
| outputs/phase-11/api-test.log | `pnpm --filter @ubm-hyogo/api test` + serial/focused reruns | broad-run caveat documented; Issue #377 and timeout reruns pass |
| outputs/phase-11/wrangler-cron-list.log | `bash scripts/cf.sh deploy --dry-run ...` または `wrangler deployments list` 相当 | production cron ≤ 3 |
| outputs/phase-11/audit-log-row.json | Miniflare D1 fixture test 内で取得した `audit_log` row を assertion | `action='admin.tag.queue_dlq_moved'` / `target_type='tag_queue'` を含む 1 行 |

## blocker

- ローカル実 D1 binding ではなく Miniflare D1 fixture を標準 evidence とする。Cloudflare production runtime observation は Phase 13/user-approved deploy 後に別途取得する。

## 完了条件

- [ ] 上記 6 ファイルが `outputs/phase-11/` に実体として存在する。
- [ ] すべて exit 0 / 全 case pass / cron 本数 ≤ 3 が確認される。
- [ ] PASS 不能項目は `BLOCKED_BY_*` で物理分離保存し、PASS と誤記しない。

## 出力

- outputs/phase-11/main.md（上記 evidence の indexer）

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

NON_VISUAL evidence を実体化する。

## 実行タスク

- focused test / typecheck / lint を実行する。

## 参照資料

- `outputs/phase-11/focused-test.log`

## 成果物/実行手順

- `outputs/phase-11/main.md`
- `outputs/phase-11/focused-test.log`

## 統合テスト連携

- `pnpm exec vitest run --config=vitest.config.ts apps/api/src/workflows/tagQueueRetryTick.test.ts`
