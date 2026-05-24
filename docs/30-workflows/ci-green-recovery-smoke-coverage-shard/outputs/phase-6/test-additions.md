# Phase 6 サマリ: テスト拡充

詳細: [`../../phase-6-test-additions.md`](../../phase-6-test-additions.md)

## Lane A — mint helper fail path

| # | ケース | 期待 |
|---|---|---|
| F-A1 | 署名鍵不一致 verify | null（HMAC mismatch） |
| F-A2 | 改ざん token | null（signature mismatch） |
| F-A3 | 期限切れ（`nowSeconds=iat+601`） | null（`exp < now`） |
| F-A4 | 期限内（`iat+599`） | 非 null |
| F-A5 | 必須 env 欠落（純粋関数） | `signSessionJwt` が `"AUTH_SECRET missing"` throw |
| F-A6 | isAdmin 取り違え防止 | admin=true / me=false が独立成立 |

`verifySessionJwt` 実装（signature 不一致・`exp < now` で null）に正確に対応。

## Lane A — 回帰 guard（fallback / mask / reason）

| # | 検証 | 期待 |
|---|---|---|
| F-A7 | fallback（`STAGING_AUTH_SECRET` 未設定→静的 bearer） | mint step が `if` でスキップ、既存 verify が静的 secret で満たす（AC-4） |
| F-A8 | mask が export より前 | `::add-mask::` → `>> $GITHUB_ENV` 順序維持（R-1） |
| F-A9 | reason 分岐回帰 | 500=`auth-secret-binding-missing` が 401/403 追加で誤分類されない |

## Lane B/C — shard 失敗検知の順序保証

| # | 検証 | 期待 |
|---|---|---|
| F-B1 | step 順序回帰 | Fail closed が aggregate no-run より前。shard 失敗時 `::error::` + exit 1 が先、MISSING に到達しない（AC-7） |
| F-B2 | shard 全成功正常系 | Fail closed step skip → aggregate 到達 |
| F-B3 | `--no-run` 判定ロジック不変 | PASS/FAIL を従来通り（false negative なし / R-4） |
| F-B4 | MISSING メッセージ強化 | 欠落時に診断誘導 + exit 1 |

## secret 非露出回帰

| # | 検証 | 期待 |
|---|---|---|
| F-S1 | mint helper が JWT を console/stdout に出さない | `console.*` 無し、GITHUB_OUTPUT 追記のみ |
| F-S2 | redaction grep gate 維持 | `Bearer [A-Za-z0-9_-]{20,}` 等の検出 gate を ci-evidence/ に維持 |

## command suite（拡充分）

- `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts`
- `bash scripts/coverage-guard.sh --no-run`
- `actionlint .github/workflows/ci.yml .github/workflows/runtime-smoke-staging.yml`
