# Phase 12: 実装ガイド

## Part 1: 中学生レベル

### なぜ必要か

ウェブサイトは、画面を作るために小さなプログラム（script）や見た目の指定（style）をページの中で使います。悪い人がそこへ別の script を差し込めると、ログイン情報を盗んだり、画面を勝手に操作したりできます。だからブラウザに「このページで動かしてよい script は、サイトが発行した合言葉を持つものだけ」と教える必要があります。

何をしたかというと、ページを開くたびに新しい合言葉を作り、その合言葉を持つ script と style だけをブラウザに信頼させるようにしました。

### 日常の例え

イベント会場のリストバンドと同じです。入口で毎回ちがう色のリストバンドを配り、会場スタッフはその色を見て入場を許可します。昨日の色や、リストバンドなしの人は入れません。nonce はこの「その回だけ有効なリストバンド」です。

### 今回作ったもの

今回の実装では、`apps/web/middleware.ts` がリクエストごとに nonce を作り、CSP header と `x-nonce` header に入れます。`apps/web/src/lib/security-headers.ts` は `script-src` と `style-src` から直書き inline 許可を外し、nonce と `strict-dynamic` を含むCSPを作ります。単体テスト、middlewareテスト、Playwright HTTP smokeも nonce とCSPの期待値を確認するように更新しました。

## Part 2: 技術者レベル

### TypeScript の型定義

```ts
export type SecurityHeaderMode = "report-only" | "enforce";

export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;
  authOrigin: string;
  nonce?: string;
}
```

### APIシグネチャ

```ts
export const buildCspDirective = (cfg: SecurityHeaderConfig): string;
export const buildSecurityHeaders = (cfg: SecurityHeaderConfig): Headers;
export const applySecurityHeaders = <T extends Response>(
  response: T,
  cfg: SecurityHeaderConfig,
) => T;
```

検証CLI:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/security-headers.spec.ts apps/web/__tests__/middleware.spec.ts
rg "'unsafe-inline'" apps/web/src apps/web/middleware.ts apps/web/__tests__/middleware.spec.ts
```

### 使用例

```ts
const nonce = generateNonce();
const securityHeaderConfig = {
  ...buildSecurityHeaderConfig(),
  nonce,
};
const csp = buildCspDirective(securityHeaderConfig);

const requestHeaders = new Headers(req.headers);
requestHeaders.set("x-nonce", nonce);
requestHeaders.set("Content-Security-Policy", csp);

const response = await guardedMiddleware(req, requestHeaders);
response.headers.set("x-nonce", nonce);
return applySecurityHeaders(response, securityHeaderConfig);
```

### 実装ポイント

`generateNonce()` は Edge runtime 互換の `crypto.getRandomValues(new Uint8Array(16))` と `btoa()` で base64 nonce を作る。`NextResponse.next({ request: { headers } })` で downstream App Router に request header を渡し、response header は既存どおり `Content-Security-Policy-Report-Only` を維持する。enforce 切替は別タスクの境界であり、この実装は report-only のまま nonce 互換性を先に成立させる。

`script-src` は `script-src 'self' 'nonce-<n>' 'strict-dynamic'` にする。App Router の動的 chunk 読み込みと nonce を両立させるため、元 issue の「strict-dynamic なし」前提は現行実装へ合わせて上書きした。

`style-src` / `style-src-elem` は nonce を要求する。既存コードには `style={{ ... }}` が広範囲に残っているため、今回の最小実装では `style-src-attr` を明示的に分離して既存属性スタイルを互換維持する。これにより `script-src` / `style-src` からの直書き inline 許可は除去しつつ、広範なUIリファクタを同時に抱え込まない。

### エラーハンドリング

nonce 生成は middleware 内で同期的に行い、外部サービスやenvに依存しない。認証guardが redirect / 403 を返す場合も response header には同じ nonce CSP を付与する。`NextResponse.next()` の場合だけ request header を downstream に渡せるため、redirect / 403 は描画を伴わない response header の保護対象として扱う。

### エッジケース

同一リクエスト内では `x-nonce` と CSP の `nonce-...` が一致しなければならない。別リクエストでは nonce が変化しなければならない。`cspMode: "enforce"` を渡した場合は同じCSP値が enforce header に出るが、本workflowの runtime config は report-only のまま固定する。`style-src-attr` は既存UI互換のための明示的な過渡境界であり、将来の完全属性スタイル撤去タスクではここを削除対象にする。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| `cspMode` | `"report-only"`（現行維持） |
| `authOrigin` | `https://accounts.google.com` |
| `apiBaseUrl` | `getPublicEnv().NEXT_PUBLIC_API_BASE_URL` |
| nonce length | 16 random bytes / base64 encoded |
| response CSP header | `Content-Security-Policy-Report-Only` |
| request CSP header | `Content-Security-Policy` for App Router nonce parsing |

### テスト構成

| Test | 目的 |
| --- | --- |
| `apps/web/src/lib/security-headers.spec.ts` | nonce CSP、`strict-dynamic`、`style-src-attr` 分離、script/style inline fallback不在を確認 |
| `apps/web/__tests__/middleware.spec.ts` | requestごとのnonce一意性、response CSPとの一致、redirect/next既存挙動維持を確認 |
| `apps/web/playwright/tests/security-headers.spec.ts` | HTTP responseでnonce CSPが観測できることを確認 |
| grep gate | `apps/web/src` / `middleware.ts` / middleware spec に直書き `'unsafe-inline'` がないことを確認 |

## Part 3: 検証結果

焦点テストは `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/security-headers.spec.ts apps/web/__tests__/middleware.spec.ts` で 2 files / 17 tests PASS。grep gate は `rg "'unsafe-inline'" apps/web/src apps/web/middleware.ts apps/web/__tests__/middleware.spec.ts` が 0 hit（exit 1）でPASS。最初の広域 `pnpm --filter @ubm-hyogo/web test ...` は引数仕様により `apps/web` 全体が走り、上記スペース不足修正前に2件 fail したため、修正後に焦点コマンドで再検証した。
