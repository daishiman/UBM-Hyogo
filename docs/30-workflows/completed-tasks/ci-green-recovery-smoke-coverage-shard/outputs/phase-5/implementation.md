# Phase 5 サマリ: 実装手順

詳細: [`../../phase-5-implementation.md`](../../phase-5-implementation.md)

## 新規 / 修正ファイル一覧（Feedback RT-03）

| # | パス | 種別 | lane |
|---|---|---|---|
| 1 | `scripts/smoke/mint-staging-bearers.mts` | 新規 | A |
| 2 | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | 新規 | A |
| 3 | `scripts/smoke/runtime-attendance-provider.sh` | 修正 | A |
| 4 | `.github/workflows/runtime-smoke-staging.yml` | 修正 | A |
| 5 | `.github/workflows/ci.yml` | 修正 | B,C |
| 6 | `scripts/coverage-guard.sh` | 修正 | B |
| 7 | `docs/.../runbooks/secret-provisioning.md` | 修正 | A |

## #1 mint helper

- 純粋関数 `mintStagingBearers(env)`：`signSessionJwt(authSecret, { memberId, email, isAdmin, ttlSeconds })` を admin(`isAdmin:true`)/me(`isAdmin:false`) で 2 回。既定 ttl 600。返り値 `{ adminBearer, meBearer, memberId: adminMemberId }`。
- CLI guard：`import.meta.url === file://${process.argv[1]}` 相当で main を分離。`process.env` の 5 種読み取り → 欠落で欠落名 stderr + `exit 2`。`GITHUB_OUTPUT` へ `admin_bearer`/`me_bearer`/`member_id` 追記のみ。**JWT を console/stdout に出さない**。

## #3 runner

L165-168 を `elif` 連結で拡張（判定順 500→401→403）。redacted body の `jq -e '.error == ...'` で error 種別のみ判定。

## #4 runtime-smoke-staging.yml

env に 5 secret 追加 → checkout 直後に setup-project → mint step（`if: env.STAGING_AUTH_SECRET != ''`、mint→`::add-mask::`→`GITHUB_ENV` を 1 step に閉じる）→ 既存 verify/mask step 据え置き。fallback は mint step スキップで静的 bearer 維持。**mask を export より前に必ず適用**。

## #5 ci.yml（Lane B+C 統合）

- `on:`→`jobs:` 間に `permissions: contents: read`。
- shard / aggregate checkout に `token: ${{ github.token }}` / `persist-credentials: true`。
- `coverage-gate` の「Fail closed on failed shard」を「Merge apps/api unit+d1」「Coverage gate (aggregate, no-run)」の**前**へ移動。job name 不変。

## #6 coverage-guard.sh

`--no-run` の MISSING 出力 / HINT ブロックに「shard 全成功時のみ真の欠落。shard 失敗が疑われる場合は coverage-gate-shard 結果を確認せよ」を追記。判定ロジック不変。

## #7 runbook

mint secret 5 種の op 参照 + `gh secret set --env staging-runtime-smoke` 手順、`STAGING_AUTH_SECRET` は staging `AUTH_SECRET` と同値、fallback 維持理由、即時再発行手順、`provision-staging-secrets.sh` 配列追加例。実行はユーザー gated。

## ローカル実行

```bash
mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts
mise exec -- pnpm exec tsx scripts/smoke/mint-staging-bearers.mts   # ダミー env + 一時 GITHUB_OUTPUT
actionlint .github/workflows/ci.yml .github/workflows/runtime-smoke-staging.yml
mise exec -- pnpm typecheck && mise exec -- pnpm lint
```

## 実装順序

mint helper → unit → runner → workflow → ci.yml+coverage-guard → runbook → ローカル検証。
