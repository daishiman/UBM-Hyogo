# Phase 9 — 品質保証（QA）

## 実行結果

| 項目 | コマンド | 結果 |
|------|---------|------|
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | **PASS** |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | **PASS** |
| api test（alert-relay 単体） | `pnpm exec vitest run apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | **PASS（21/21）** |
| api test（全体） | `mise exec -- pnpm --filter @ubm-hyogo/api test` | 138 files / 1008 tests PASS（直前回 audit race 1 件 flaky を観測したが再実行で PASS） |

## grep gate 結果

| gate | コマンド | 結果 |
|------|---------|------|
| `seenAlerts` 残存 | `grep -rn "seenAlerts" apps/api/src/` | 0 件（**OK**） |
| `wrangler` 直接呼び出し（新規追加） | 本タスクは `package.json#scripts.dev/deploy` の既存 `wrangler` 呼び出しを追加していない。`bash scripts/cf.sh` 経由のみ追記 | **OK** |
| `wrangler.toml` の namespace_id | `rg -n '^id = \"<.*namespace_id>\"' apps/api/wrangler.toml` | 0 件。placeholder id はコメント化済み user-gated block のみ |

## 不変条件確認

| 不変条件 | 状態 |
|---------|------|
| `apps/api` 内のみ KV binding | OK（`apps/web` 未変更） |
| Cloudflare CLI は `bash scripts/cf.sh` 経由 | OK（runbook / spec 内文書記述のみ。実コマンド実行は user-gated） |
| dedup key 構造 `{metric}:{policy_id}:{minuteBucket}` | OK |
| TTL 5 分 | OK（`dedupeTtlMs = 5 * 60 * 1000`、KV `expirationTtl` = 300 秒） |
| dedup 値は `"1"` のみ / metadata 不使用 | OK |
| 既存 alert-relay 仕様（auth / Slack format / retry） | OK（無変更） |

## 既存挙動の保持

| 項目 | 状態 |
|------|------|
| cf-webhook-auth 失敗 → 401（ROUTE-01, ROUTE-06） | PASS |
| SLACK_WEBHOOK_URL 未設定 → 503（ROUTE-03） | PASS |
| Slack 5xx 連続 → 502（ROUTE-05） | PASS |
| Slack 5xx 後 retry は dedup されず再送（ROUTE-05a） | PASS |
| Dashboard / runbook URL 反映（ROUTE-04b） | PASS |
| mounted route 到達（INDEX-01） | PASS |

## DoD

- [x] typecheck / lint / api test 全 PASS
- [x] `seenAlerts` 残存ゼロ
- [x] `wrangler` 新規直接呼び出しなし
- [x] active `wrangler.toml` に placeholder id が存在しない
- [ ] `wrangler.toml` namespace_id 実 ID 反映と staging deploy（**user-gated step**）
