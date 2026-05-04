# Stage Isolation — 三段ラップ切り分け evidence

実行日: 2026-05-04
実行コマンド: `bash scripts/cf.sh whoami`（exit 0）

## Stage 1: op 段（1Password CLI）

| 項目 | 結果 |
| --- | --- |
| `op whoami`（session token 経由） | exit=1 (`account is not signed in`) |
| `op run --env-file=.env` 経由の env 注入 | PASS（Touch ID / biometric prompt 経由で動作） |
| Stage 1 結論 | `op run` は signin session に依存せず biometric で動作するため、`op whoami` のみで判定すると false negative になる。実 evidence は `cf.sh whoami` exit 0 |

## Stage 2: mise 段

| 項目 | 結果 |
| --- | --- |
| `mise current` node | `24.15.0` PASS |
| `mise current` pnpm | `10.33.2` PASS |
| `mise exec -- node -v` | `v24.15.0` PASS |
| `mise exec -- which wrangler` | `/Users/dm/Library/pnpm/wrangler`（global path に解決） |
| `node_modules/.bin/wrangler` | 存在（cf.sh は local を優先採用） |
| Stage 2 結論 | PASS。Node 24 / pnpm 10 / wrangler 解決すべて到達 |

## Stage 3: wrangler 段

| 項目 | 結果 |
| --- | --- |
| `bash scripts/cf.sh whoami` | exit=0 |
| identity 出力 | account name / account ID 取得（account ID は op で自動マスク） |
| `CLOUDFLARE_API_TOKEN` env | `op run` 経由で動的注入（実値は揮発的） |
| Stage 3 結論 | PASS |

## 切り分け結論

三段すべて到達し、`bash scripts/cf.sh whoami` exit 0 が安定再現する。AC-5 PASS。
