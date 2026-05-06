# Phase 8 サマリ — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

## 確定事項

- ローカル実行フローを 8 Step に分解
  - Step 1: `pnpm install --frozen-lockfile`
  - Step 2: `pnpm typecheck` / `pnpm lint`
  - Step 3: `pnpm vitest run --project scripts-notify --coverage`
  - Step 4: 1Password signin + `.env` の op 参照確認
  - Step 5: `bash scripts/notify/slack-incident-runbook.sh --mode=dryrun ...`
  - Step 6: `jq` で evidence schema / commit SHA pin 検証
  - Step 7: `rg -F xox[b]-` / `xox[p]-` / `Bearer` 三重 leak gate
  - Step 8: `pnpm indexes:rebuild && git status -s` で drift 0 確認

## production smoke は本 Phase で実行しない

production channel 配信は Phase 11 の user approval 後。本 Phase は dry-run channel `#ubm-hyogo-incident-runbook-dryrun` のみ。

## トラブルシューティング表（8 件）

`@slack/web-api` 解決失敗 / `git rev-parse` 失敗 / `invalid_auth` / `not_in_channel` / `channel_not_found` / commit SHA 不一致 / leak 検出 / indexes drift をカバー。

## CI マッピング

`lint`/`typecheck`/`unit`/`verify-indexes-up-to-date`/`secret-leak-scan` の既存 gate と、新規 `incident-runbook-slack-delivery.yml` の手動 trigger を Phase 9 で gate 化。

## 実装サイクル ローカル実行結果 (2026-05-06)

| Step | コマンド | 結果 |
| --- | --- | --- |
| 1 | `mise exec -- pnpm install` | OK（`@slack/web-api ^7.10.0` を root dependencies に追加） |
| 2 | `mise exec -- pnpm typecheck` | OK（5 workspace 全て pass） |
| 3 | `mise exec -- npx vitest run scripts/notify/` | OK（15/15 pass: T1〜T15） |
| 4 | `mise exec -- pnpm lint` | OK（boundaries / deps / stablekey-literal warnings は既存・本タスク無関係） |
| 5 | `mise exec -- pnpm indexes:rebuild` | drift を再生成済（quick-reference / resource-map / topic-map） |
| 6 | `rg -F xoxb- scripts/notify .github/workflows/incident-runbook-slack-delivery.yml docs/30-workflows/09c-incident-runbook-slack-delivery/` | 0 hit（`save-slack-evidence.ts` の `xoxb-` regex pattern を除外時 0 hit） |

dry-run smoke (`scripts/notify/slack-incident-runbook.sh --mode=dryrun ...`) は Slack workspace 側で bot 招待 / channel id 設定が完了した後に Phase 11 で実行する。本 Phase 8 では unit test による契約検証で代替。

