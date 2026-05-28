# Phase 4 サマリ: テスト計画

詳細: [`../../phase-4-test-plan.md`](../../phase-4-test-plan.md)

## 方針

新規 test は `*.spec.ts` のみ（不変条件 #8）。NON_VISUAL のため screenshot は無く、Vitest unit + actionlint + CI 観測を証跡とする。secret 実値・JWT・署名鍵は fixture に転記せず、ダミー鍵リテラルのみ使用。

## Lane A — mint parity unit（`scripts/smoke/__tests__/mint-staging-bearers.spec.ts`）

| # | ケース | 期待 |
|---|---|---|
| T-A1 | admin parity | `verifySessionJwt(adminBearer, S)` 非 null、`isAdmin===true`、memberId/email/sub 一致 |
| T-A2 | me parity | `verifySessionJwt(meBearer, S)` 非 null、`isAdmin===false` |
| T-A3 | memberId 出力契約 | 返り値 `memberId === adminMemberId` |
| T-A4 | TTL 明示反映 | `ttlSeconds=600`、verify `nowSeconds=iat+599` 有効 / `iat+601` 失効 |
| T-A5 | TTL 既定 600 | 未指定で 600 適用 |
| T-A6 | 鍵不一致 | 別鍵 verify で null |
| T-A7 | 必須 env 欠落 | CLI guard `process.exit(2)` + 欠落 env 名のみ stderr |
| T-A8 | console 非出力 | helper は JWT を console/stdout に出さない（GITHUB_OUTPUT 追記のみ） |

reason 分岐（runner）の検証方針: 500 auth misconfigured→`auth-secret-binding-missing` / 401 unauthorized→`auth-token-invalid-or-expired` / 403 forbidden→`auth-not-admin` / 200→reason 無し。redacted body の jq 分岐を目視 + 擬似 body で確認。

## Lane B — coverage-guard `--no-run`

| # | command | 期待 |
|---|---|---|
| T-B1 | `bash scripts/coverage-guard.sh --no-run`（欠落時） | MISSING + 「shard 失敗を先に確認せよ」誘導、exit 1 |
| T-B2 | summary 揃い時 | PASS（判定ロジック不変） |
| T-B3 | `--group packages --no-run` | group モード回帰維持 |

## Lane C — actionlint

| # | command | 期待 |
|---|---|---|
| T-C1 | `actionlint .github/workflows/ci.yml` | エラー 0（permissions/token/順序が valid） |
| T-C2 | 目視 + actionlint | Fail closed が aggregate no-run より前 |
| T-C3 | 目視 | job name `coverage-gate` / `coverage-gate-shard (...)` 不変 |
| T-C4 | `actionlint .../runtime-smoke-staging.yml` | mint step / fallback 追加後もエラー 0 |

## command suite

- `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts`
- `bash scripts/coverage-guard.sh --no-run`
- `actionlint .github/workflows/ci.yml .github/workflows/runtime-smoke-staging.yml`
- `mise exec -- pnpm typecheck && mise exec -- pnpm lint`
