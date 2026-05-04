# Phase 12 Implementation Guide: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装]

apps/web の auth/fetch/session 系 lib に対する Vitest unit test を新規追加し、
Stmts/Lines/Funcs ≥85% / Branches ≥80% の AC を達成した。
プロダクションコードは不変。

## Part 1: 中学生レベル

### なぜテストを足すのか
ログインや通信を扱うコードに自動テストがないと、ちょっとした修正で会員が
ログインできなくなったり、通信エラー時に画面が壊れていることに誰も気づけない。
そこで「こう動くはず」という想定を test として書き残しておき、コードを変える
たびに機械が自動でチェックしてくれる仕組みを増やした。

### 日常の例え
自転車に乗る前にブレーキが効くか確認するのと同じ。ログインや通信のコードも、
出発前に「止まる」「曲がる」「壊れた時に知らせる」を自動で確認しておけば、
あとから別の場所を直した時にも大きな事故に気づきやすい。

### カバレッジって何か
コードのうち何 % がテストで通ったかを数字にしたもの。100% だと全部、0% だと
一切テストが通っていない。今回は対象 6 ファイルそれぞれで 85% 以上を目指した。
結果として 5 ファイルが 100%、`auth.ts` が 89.9%（目標 85% 以上）に到達した。

### 専門用語セルフチェック

| 用語 | このタスクでの意味 |
| --- | --- |
| Vitest | TypeScript/React 用の自動テスト実行ツール |
| coverage | テストが通ったコード割合 |
| mock | 本物の通信や外部サービスの代わりに使う偽物 |
| regression | 以前動いていたものが壊れること |
| helper | 複数テストで共通利用する小さな補助コード |
| NON_VISUAL | 画面スクリーンショットではなく数値やログで検証する分類 |

## Part 2: 技術者レベル

### 追加ファイル

| 種別 | パス |
| --- | --- |
| test | apps/web/src/lib/auth.test.ts (40 cases) |
| test | apps/web/src/lib/auth/magic-link-client.test.ts (11 cases) |
| test | apps/web/src/lib/auth/oauth-client.test.ts (5 cases) |
| test | apps/web/src/lib/session.test.ts (7 cases) |
| test | apps/web/src/lib/fetch/authed.test.ts (13 cases) |
| test | apps/web/src/lib/fetch/public.test.ts (11 cases) |
| type test | apps/web/src/lib/api/me-types.test-d.ts |
| helper | apps/web/src/test-utils/fetch-mock.ts |
| helper test | apps/web/src/test-utils/fetch-mock.test.ts |
| config | vitest.config.ts (`apps/web/src/lib/api/me-types.ts` を coverage.exclude に追加) |

### test pattern
- `auth.ts`: `fetchSessionResolve`（happy / token-missing / non-ok / fetch-throw / staging log / service-binding）、`buildAuthConfig`（signIn google/credentials、jwt、session、jwt encode/decode、credentials authorize 異常系、missingProviderFactories の throw）、`getAuth` の dynamic import cache
- `magic-link-client.ts`: 200/202/不明 state fallback / 400/500 error / JSON parse 失敗 / network-fail / fetch URL+method 検証
- `oauth-client.ts`: 内部 path 通過 / 未指定 fallback / `//` schemeless 防止 / 外部 URL fallback / 空文字 fallback
- `session.ts`: null / user 欠落 / memberId 欠落 / email 欠落 / 完全 / name optional / isAdmin 正規化
- `fetch/authed.ts`: path 検証 / cookie 転送 / 200 / 401 / 403 / 5xx / network-fail / base URL 解決優先順 / init.headers マージ / Error class
- `fetch/public.ts`: service-binding / 直接 fetch / process.env fallback / DEFAULT base / revalidate override / 5xx / network-fail / 404 (NotFound) / revalidate 伝搬
- `me-types.ts`: type-only として `me-types.test-d.ts` で round-trip + 構造リテラル代入

### mock 戦略
- `apps/web/src/test-utils/fetch-mock.ts` で `vi.spyOn(globalThis, 'fetch')` を統一。`mockFetchOnce` / `mockFetchSequence` / `mockFetchNetworkError` / `restoreFetch` を提供
- NextAuth client は `vi.mock("next-auth/react")` で signIn を spy
- `next/headers` の `cookies()` は in-test の可変リストで mock
- `@opennextjs/cloudflare` の `getCloudflareContext` も `vi.mock` で env を制御
- D1 に直接触れる test は作らない（不変条件 #6）

### coverage 結果（実測）

| file | Stmts | Lines | Funcs | Branches | 判定 |
| --- | --- | --- | --- | --- | --- |
| lib/auth.ts | 89.9 | 89.9 | 90.0 | 88.8 | ✅ ≥85/80 |
| lib/auth/magic-link-client.ts | 100 | 100 | 100 | 100 | ✅ |
| lib/auth/oauth-client.ts | 100 | 100 | 100 | 100 | ✅ |
| lib/session.ts | 100 | 100 | 100 | 100 | ✅ |
| lib/fetch/authed.ts | 100 | 100 | 100 | 100 | ✅ |
| lib/fetch/public.ts | 100 | 100 | 100 | 100 | ✅ |
| test-utils/fetch-mock.ts | 97.87 | 97.87 | 100 | 92.3 | ✅ |
| lib/api/me-types.ts | excluded | — | — | — | type-only（D-04） |

`auth.ts` の uncovered（118-119, 140-141, 387）は次の 3 種で、いずれも到達条件が
構造的に難しいか、運用上クリティカルではない:
- 118-119: `missingProviderFactories.CredentialsProvider`。`buildAuthConfig` 内の
  `buildProviders` で先に `GoogleProvider` が呼ばれて throw するため到達不能（テスト側で
  `CredentialsProvider` だけ default にした variant も追加済み）
- 140-141: staging 環境で `INTERNAL_API_BASE_URL` が URL parse 失敗するケース。
  parse 失敗時は同関数内の `new URL("/auth/session-resolve", baseUrl)` でも crash するため、
  実運用では起き得ない（valid URL 必須）
- 387: `getAuth` 内の NextAuth callback 中の `buildAuthConfig({ ...env(), ...requestEnv(request) })`。
  next-auth 自身がリクエスト処理で同期呼び出しするまで実行されない

### ローカル実行コマンド

```
pnpm --filter @ubm-hyogo/web test:coverage
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

coverage run は全 pass を確認済み（40 files / 359 tests passed, regression 0）。ローカル Node は v22.21.1 で repo 要求 24.x の warning が出たが、コマンドは exit 0。

### 不変条件影響
- #2 responseId/memberId 分離: credentials authorize で memberId のみを id に転写、
  responseId は session token に載せない動作を test で固定
- #5 public/member/admin 境界: D1 直接アクセス test を作らない方針を維持
- #6 apps/web → D1 直アクセス禁止: fetch wrapper 経由のみであることを test で固定
