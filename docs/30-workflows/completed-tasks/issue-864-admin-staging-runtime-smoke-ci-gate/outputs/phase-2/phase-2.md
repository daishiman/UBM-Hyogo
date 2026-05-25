# Phase 2: 設計

## 目的

topology / SubAgent lane / validation path を設計する。既存コンポーネント再利用可否（FB-SDK-07-1）を最優先で判定する。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 再利用候補                          | 可否 | 適用                                                              |
| ----------------------------------- | ---- | ---------------------------------------------------------------- |
| `runtime-smoke-staging.yml` の job 骨格 | ✅ 高 | mint step / verify secrets / mask / redaction grep gate / artifact upload / Slack 通知をそのまま踏襲 |
| `runtime-attendance-provider.sh` の関数 | ✅ 高 | `assert_staging_target` / `fail_and_exit` / `request_json` / redact.sh を web 版に転用 |
| `mint-staging-bearers.mts`          | △ 条件付き | `signSessionJwt` の mint 手法は流用可。Auth.js 互換性次第で session cookie encode を追加 |
| `redact.sh` / `ci-summary-post.sh`  | ✅ 高 | そのまま再利用                                                   |

→ 新規 primitive を最小化。web smoke runner と session mint helper の 2 新規ファイル + cf.sh / web-cd.yml の 2 EDIT に収める。

## topology（状態所有権）

```
web-cd.yml (Facade / CI orchestration)
  ├─ deploy-staging (既存 job: Workers deploy)
  └─ admin-runtime-smoke (NEW job, needs: deploy-staging)
        ├─ setup-project
        ├─ mint admin session cookie  ── scripts/smoke/mint-staging-session-cookie.mts (Engine: token mint)
        ├─ run web smoke              ── scripts/smoke/runtime-admin-web.sh (Engine: probe + grep gate)
        │      └─ cf.sh tail          ── scripts/cf.sh (Bridge: wrangler wrap)
        ├─ redaction grep gate
        ├─ upload evidence artifact
        └─ post failure summary to Slack
```

| 部品 | 状態所有権 | 責務 |
| ---- | ---------- | ---- |
| `web-cd.yml admin-runtime-smoke` | CI 実行状態（job 成否） | gate 発火条件・secret 注入・evidence 集約 |
| `runtime-admin-web.sh` | probe 結果（PASS/FAIL）・log | HTTP 200 assert + boundary log grep + summary.json 生成 |
| `mint-staging-session-cookie.mts` | session cookie 値 | 2 層通過 cookie の発行（GITHUB_OUTPUT のみ、echo 禁止） |
| `cf.sh tail` | wrangler サブプロセス | `wrangler tail` の安全ラップ（op/esbuild/mise 解決込み） |

## token 互換性の設計分岐（Phase 1 実測結果に基づく）

Phase 1 の実測（`apps/web/src/lib/auth.ts` の session strategy 確認）で次のいずれかに分岐する。

### 分岐 A: middleware と layout が同一 custom JWT（`signSessionJwt`/`decodeAuthSessionJwt`）

- `mint-staging-session-cookie.mts` は `signSessionJwt(authSecret, { memberId, email, isAdmin:true, ttlSeconds:600 })` を呼び、
  得た JWT を `__Secure-authjs.session-token`（および非 secure fallback cookie 名）へ載せる cookie 文字列を GITHUB_OUTPUT に出力。
- layout の `getSession()` が同 JWT を session として復号できることを Phase 1 で確認済みとする。

### 分岐 B: layout が Auth.js default（JWE）session を要求

- `mint-staging-session-cookie.mts` は `@auth/core/jwt` の `encode({ token, secret: AUTH_SECRET, salt: <cookie name> })` を呼び、
  Auth.js 互換の暗号化 session token を生成する。`salt` は cookie 名（`__Secure-authjs.session-token`）を使う（Auth.js v5 仕様）。
- middleware の `decodeAuthSessionJwt` も同 token を解釈できるかを Phase 1 で確認。非対称なら middleware 側の decode が JWE 対応かを確認し、必要なら probe は両 cookie を併送する設計にする。

> いずれの分岐でも **JWT/cookie 値は GITHUB_OUTPUT への追記のみ**、stdout/console へ echo しない（`mint-staging-bearers.mts` と同一不変条件）。

## `cf.sh tail` subcommand 設計

`scripts/cf.sh` の case dispatch に `tail` を追加する。設計要件:

- 呼び出し形: `bash scripts/cf.sh tail <worker-name> --env staging --format json [--once-seconds N]`
- 既存の `op run` ラップ / `ESBUILD_BINARY_PATH` 解決 / `mise exec --` 経由を踏襲（他 subcommand と同一経路）。
- `wrangler tail` は常駐 stream のため、CI では一定時間（例: probe 実行中の N 秒）だけ capture して終了する wrapper を持たせる（`timeout` または `--format json | head` で打ち切り）。
- 出力に token / account-id が混入しうるため、呼び出し側（runner）で redact.sh を必ず通す。

## web smoke runner（`runtime-admin-web.sh`）設計

`runtime-attendance-provider.sh` を雛形に web 版を新設。差分:

| 観点 | API runner（既存） | web runner（新規） |
| ---- | ------------------ | ------------------ |
| target | `STAGING_API_BASE` (`/admin/members` 等 JSON) | `STAGING_WEB_BASE` (`/admin` HTML) |
| 認証 | `authorization: Bearer <jwt>` header | `Cookie: __Secure-authjs.session-token=<value>` |
| assert | HTTP 200 + jq contract | HTTP 200 + HTML body に render error marker が**無い**こと |
| 追加 gate | なし | `cf.sh tail` で capture した Workers log に `error.boundary.caught`/scope=admin/digest=167275886 が**無い**こと |
| target guard | `assert_staging_target`（`.environment=="staging"`） | `assert_staging_target`（web origin allowlist。`/api/health` 等で staging 確認） |
| reason 分類 | auth-secret-binding-missing / auth-token-invalid / auth-not-admin | 上記 + `server-components-render-error`（digest 検出時） |

probe ロジック:

1. `assert_staging_target`: `STAGING_WEB_BASE` が staging origin allowlist に一致し、health エンドポイントが応答することを確認。
2. `GET /admin`（Cookie 付き）: HTTP 200 を assert。302→`/login` は `auth-token-invalid` として FAIL。403 は `auth-not-admin` として FAIL。
3. body grep: render error の production marker（"An error occurred in the Server Components render"）が body に出ていないこと。
4. `cf.sh tail` log grep: `/admin` probe 前に capture を開始し、probe 中の Workers log に `error.boundary.caught` / digest=167275886 が無いこと。検出時 `server-components-render-error` reason で FAIL。
5. `summary.json` / `runtime-smoke.log` を out-dir に出力（redact 済み）。

## validation path

| レイヤ | 検証 |
| ------ | ---- |
| 静的 | `pnpm typecheck`（mint helper TS）/ `pnpm lint` / `shellcheck`（runner） |
| 単体 | `runtime-admin-web.test.sh`（引数/exit code/reason 分類）/ `mint-staging-session-cookie.spec.ts`（純粋関数 mint） |
| 統合（user-gated） | staging deploy 後の web-cd `admin-runtime-smoke` job 実走 = Gate-B |

## 因果ループ

- 強化ループ: gate 追加 → deploy ごとに render regression 即検出 → 早期修正 → admin 可用性維持 → 信頼性向上。
- バランスループ: probe 認証コスト（cookie mint）↑ → CI 実行時間/複雑性 ↑ → graceful skip（AC-8）で secret 未設定環境を fail させず複雑性増を抑制。

## 完了判定

- [x] 再利用可否を確定（新規 primitive 最小化）
- [x] token 互換 A/B 分岐を Phase 1 実測へ依存させて設計
- [x] cf.sh tail / web runner / web-cd job の責務境界を固定
