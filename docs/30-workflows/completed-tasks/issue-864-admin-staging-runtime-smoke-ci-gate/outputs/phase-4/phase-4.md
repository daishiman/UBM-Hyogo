# Phase 4: テスト作成（TDD Red）

## 目的

command suite と expected result を作る。Phase 1-3 で確認した命名規則（kebab-case `.sh` / camelCase export / `*.spec.ts` / `*.test.sh`）と整合させる。

## 依存関係整合の事前チェック（FB-MSO-002）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/shared build   # signSessionJwt / encode を import する場合
```

esbuild darwin バイナリ mismatch は worktree 直後に多発するため Phase 4 開始前に必須。

## テスト 1: `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts`（純粋関数）

`mint-staging-bearers.spec.ts` を雛形に、`mintStagingSessionCookie()` を純粋関数として test する。

| ケース | 入力 | expected |
| ------ | ---- | -------- |
| TC-1 admin cookie 生成 | `{ authSecret, memberId, email, isAdmin:true, ttlSeconds:600 }` | cookie 文字列が `__Secure-authjs.session-token=` を含む |
| TC-2 token 非空 | 同上 | cookie 値部分が空でない（JWT/JWE 形式） |
| TC-3 値を stdout に echo しない | CLI entry guard | `console.log` 呼び出しが無いことを spy で確認 |
| TC-4 必須 env 欠落で exit 2 | env 一部欠落 | `process.exit(2)` + stderr に env 名のみ（値なし） |
| TC-5（分岐 B のみ）Auth.js encode 互換 | `@auth/core/jwt decode` で復号可能 | mint→decode round-trip で memberId/isAdmin 一致 |

> TC-3/TC-4 は不変条件 3（JWT/secret 非露出）の回帰 guard。

期待コマンド:

```bash
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts
```

本 wave では `mint-staging-session-cookie.mts` を実装し、最終 GREEN で decode round-trip / TTL / fallback cookie name を確認した。

## テスト 2: `scripts/smoke/__tests__/runtime-admin-web.test.sh`（shell contract）

`runtime-attendance-provider.test.sh` を雛形に、引数検証・exit code・reason 分類を test する（実 staging には接続せず、curl を stub する）。

| ケース | 条件 | expected exit | expected reason |
| ------ | ---- | ------------- | --------------- |
| TC-A env 引数なし | `runtime-admin-web.sh`（無引数） | 2 | "env required" |
| TC-B 非 staging | `runtime-admin-web.sh production` | 2 | staging のみ許可 |
| TC-C 必須 env 欠落 | `STAGING_WEB_BASE` 未設定 | 2 | required env 名 |
| TC-D /admin 200 + boundary log なし | curl stub 200 / tail stub clean | 0 | PASS |
| TC-E /admin 302→/login | curl stub 302 Location:/login | 1 | auth-token-invalid-or-expired |
| TC-F /admin 403 | curl stub 403 | 1 | auth-not-admin |
| TC-G tail に digest 検出 | tail stub に `digest:167275886` | 1 | server-components-render-error |
| TC-H body に render error marker | body に "Server Components render" | 1 | server-components-render-error |
| TC-I redaction | summary/log に Bearer/Cookie 値が残らない | — | grep gate clean |

期待コマンド:

```bash
bash scripts/smoke/__tests__/runtime-admin-web.test.sh
```

本 wave では runner を実装し、最終 GREEN で 200 / 302 / 403 / body digest / tail digest 分類を確認した。

## テスト 3: `cf.sh tail` 引数検証（runner test 内 or 専用 case）

| ケース | 条件 | expected |
| ------ | ---- | -------- |
| TC-J tail subcommand 認識 | `cf.sh tail --help` 相当 | unknown subcommand エラーにならない |
| TC-K wrangler 直叩きしない | runner が `wrangler tail` を直接呼ばず `cf.sh tail` 経由 | grep で `wrangler tail` 直書きが runner に無い |

## テストパターンと命名規則の整合確認

- shell test は `*.test.sh`、TS test は `*.spec.ts`（CLAUDE.md 不変条件 8）。✅
- private 関数の test は不要（mint helper は純粋 export 関数）。
- stub は curl/wrangler を PATH 先頭の fake で差し替える方式（`runtime-attendance-provider.test.sh` 踏襲）。

## 完了判定

- [x] 3 テストスイートの expected result を定義
- [x] A/B 両分岐に対応した mint test を用意
- [x] RED 相当の未実装 gap を確認し、Phase 5 実装後に focused tests GREEN
