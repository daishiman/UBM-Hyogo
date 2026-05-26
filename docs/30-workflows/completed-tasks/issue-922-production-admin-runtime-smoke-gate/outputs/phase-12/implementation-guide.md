# 実装ガイド — issue-922-production-admin-runtime-smoke-gate

## Part 1: 初学者向け（中学生レベル）

### 背景（なぜ必要か）

前回のタスク（issue #864）で、お店の「練習店舗（staging）」を改装するたびに店員さん用画面が壊れていないかを自動でチェックする仕組みを作りました。今回は同じ仕組みを「本物のお店（production）」にも入れます。お客さんに見える本番が壊れたら一番大変なので、本番こそ自動チェックが必要です。

### 要約（何をするか）

すでにある「自動チェックロボット」を、練習店舗用 / 本物のお店用のどちらでも使えるように少しだけ書き換えます。そして本物のお店を改装したあと、ロボットが自動で動くように設定を増やします。

### 実装ステップ（順番）

1. ロボット（runner）に「どちらの店舗をチェックする？」と聞く窓口を追加する。
2. 入館証を作るプログラム（mint helper）にも同じ窓口を追加する。
3. 本物のお店を改装したあと、ロボットが自動で呼ばれるように設定を増やす。
4. テストも「練習店舗用」「本物のお店用」の両方を確かめる。

### 既知の制限

本物のお店の鍵（secret）が用意されていない間は、ロボットはチェックをお休みします（本番デプロイは止めない）。本番で「わざと壊して fail が出るか」を試す確認は、人が承認したときだけ夜中に 1 回だけ行います。

## 1. Why

production deploy のたびに `/admin` の Server Components render が壊れていないかを、staging gate と対称な構造で自動検証する必要がある。親 #864 で staging gate を確立したが、最も信頼すべき本番層が手薄なまま残っていた。

## 2. What

`scripts/smoke/runtime-admin-web.sh` と `scripts/smoke/mint-staging-session-cookie.mts` を env-aware（staging / production 両対応）に一般化し、`.github/workflows/web-cd.yml` に `needs: deploy-production` + `if: github.ref_name == 'main'` の `admin-runtime-smoke-production` job を追加する。production secret は新規 GitHub Environment `production-runtime-smoke` に隔離する。

## 3. How

- runner: 冒頭に `resolve_env_vars()` 関数を追加し、env 引数（`staging` | `production`）から host / worker name / cookie env / target allowlist を解決する。staging path は既存の挙動を完全保存。
- mint helper: `resolveEnvPrefix(env)` 純粋関数を追加し、CLI 引数（未指定時 `staging`、production job は `production`）で `STAGING_` / `PRODUCTION_` prefix を切替。純粋関数 `mintStagingSessionCookie(input)` は変更しない。
- workflow: staging job 直後に production job を**意図的に複製**で配置（早期共通化を避ける）。step-scoped `CLOUDFLARE_API_TOKEN`、`environment: production-runtime-smoke`、graceful skip prereq step、`::add-mask::`、redaction grep gate、artifact upload、Slack failure 通知を含む。

## 4. Implementation

### インターフェース / 型定義

```typescript
export type RuntimeSmokeEnv = "staging" | "production";
export function resolveEnvPrefix(env: string): string; // throws on unknown env
// 純粋関数（既存、変更なし）:
export function mintStagingSessionCookie(input: MintSessionCookieInput): Promise<string>;
```

runner CLI:

```
bash scripts/smoke/runtime-admin-web.sh <staging|production> [--out-dir <path>] [--ci-summary]
  env (staging): STAGING_WEB_BASE / STAGING_ADMIN_SESSION_COOKIE / STAGING_WORKER_NAME?
  env (production): PRODUCTION_WEB_BASE / PRODUCTION_ADMIN_SESSION_COOKIE / CF_WORKER_NAME? / PRODUCTION_WORKER_NAME?
```

### 実装ステップ

1. **mint helper の env-aware 化**（Step 2 of Phase 5）。`resolveEnvPrefix` を export + `main()` 冒頭で CLI 引数を読む。
2. **runner の env-aware 化**（Step 1）。`resolve_env_vars()` + `case "$ENVIRONMENT"` で env 引数 routing。
3. **web-cd.yml に production job 追加**（Step 3）。staging job を複製して PRODUCTION_* env と `if: main` / `needs: deploy-production` / `environment: production-runtime-smoke` に差し替え。
4. **test 拡張**（Step 4）。Phase 4 で定義した TC-P1〜P7 / TC-PA〜PH を既存 test ファイルへ追記。

## 5. Test

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/smoke/__tests__/runtime-admin-web.test.sh
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/web-cd.yml
```

## 6. Verification

- 静的: typecheck / lint / shellcheck / actionlint 全て pass
- focused tests: staging 既存ケース 全件不変 + production TC-P1..P7 / TC-PA..PH / FP-P1..P8 全件 PASS
- gate-metadata:validate / verify:phase12-compliance pass
- Gate-B（runtime）: production deploy 後の admin-runtime-smoke-production job 実走 PASS + 意図的 throw regression fail evidence 1 回取得（user-gated）

## 7. Risks

- R1: production secret 未投入 → AC-6 graceful skip で main push をブロックしない
- R2: production target allowlist 緩く誤接続 → `ubm-hyogo-web-production` + `workers.dev` 限定 regex
- R3: cross-env cookie leak（staging cookie で production を叩く等）→ env-aware routing の strict test + step-scoped env
- R4: 意図的 throw regression evidence 取得時の本番影響 → user 明示承認後、深夜帯に 1 回 + 即時 revert
- R5: main required status check PUT で既存 PR block → user 承認後に既存 PR drain 確認

### エラーハンドリングとエッジケース

- 302→`/login`: `auth-token-invalid-or-expired` で exit 1
- 403: `auth-not-admin` で exit 1
- body/log に render error marker / digest: `server-components-render-error` で exit 1
- production target allowlist 違反: `target-allowlist` で exit 2
- secret 未設定: job skip（AC-6）
- 未知 env 引数: `Only staging or production runtime smoke is allowed` で exit 2

### 設定可能なパラメータ / 定数

| 名前 | 既定 | 用途 |
| ---- | ---- | ---- |
| CLI arg (`staging` / `production`) | `staging` | mint helper の env prefix 切替 |
| `MINT_TTL_SECONDS` | 600 | session cookie TTL |
| `CF_TAIL_SECONDS` | 25 | tail capture 打ち切り（既存）|
| `SESSION_COOKIE_NAME` | `__Secure-authjs.session-token` | cookie 名（staging / production 共通）|
| `PRODUCTION_WEB_HOST_ALLOW_REGEX` | `ubm-hyogo-web-production\.|workers\.dev` | production target allowlist |
| `CF_WORKER_NAME` / `PRODUCTION_WORKER_NAME` | `ubm-hyogo-web-production` | production worker name。workflow は `CF_WORKER_NAME` を明示し、runner fallback は env-specific default を持つ |
| `DIGEST` | `167275886` | 検出対象 render error digest（既存）|

## 8. References

- 親 #864 仕様書: `docs/30-workflows/completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/`
- CLAUDE.md Governance セクション（`production-runtime-smoke` GitHub Environment 設計 / `main` branch protection）
- `.github/workflows/web-cd.yml`（既存 staging admin-runtime-smoke job + deploy-production job）
- `scripts/smoke/runtime-admin-web.sh` / `scripts/smoke/mint-staging-session-cookie.mts` / `scripts/cf.sh tail`

## 9. Out-of-scope / Follow-ups

- Sentry alert ルールの新設（既存 boundary log 検出で代替。staging と同方針）
- production `/admin` 以外（`/profile` 等）への runtime smoke 拡張（別タスク）
- runner / mint helper rename（`mint-staging-session-cookie.mts` → `mint-admin-session-cookie.mts`）。後方互換と review surface 最小化のため本タスクでは行わない。将来 `preview` env 等を追加するタイミングで検討。
- shell common helper `scripts/smoke/lib/smoke-common.sh` 抽出。2 個目の web runner が増えた時点で実施（YAGNI）。

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡として `phase-10/phase-10.md`（最終レビュー）と `phase-11/manual-test-result.md`（runtime 確証手順・Gate-B）を参照する。
