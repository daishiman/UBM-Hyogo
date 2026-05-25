`[実装区分: 実装仕様書]`

# Phase 5 — 実装計画（issue-871 CSP nonce 化）

> 本サイクルは local implementation を実施済み。本ドキュメントは実装済み手順と user-gated runtime verification の残境界を記録する。`apps/web/middleware.ts` → `security-headers.ts` →
> `app/layout.tsx` は同一の nonce 流通経路を共有するため、**P1 → P2 → P3 の段階的直列実行を推奨**する
> （途中で typecheck / build が通る状態を保ち、describe 困難な統合崩れを避ける）。

## 全体データフロー（実装後の到達形）

```
[middleware.ts] request 受信
   └ generateNonce()  → nonce 文字列（base64, 16byte 由来）
   └ requestHeaders = clone(req.headers)
        .set("x-nonce", nonce)
        .set("Content-Security-Policy-Report-Only", buildCspDirective({...cfg, nonce}))   ← Next.js が自前 script/style に自動 nonce 付与
   └ response = NextResponse.next({ request: { headers: requestHeaders } })  /  redirect / 403 も同様
   └ applySecurityHeaders(response, {...cfg, nonce})    ← response header にも CSP を載せる（ブラウザが評価する正本）
        ↓
[app/layout.tsx (server component)]
   └ const nonce = (await headers()).get("x-nonce")
   └ 独自 inline（<style>/<script>）に nonce={nonce} を伝播（独自 inline が無ければ取得のみで可）
```

確定設計（ユーザー承認済み）:
- `script-src 'self' 'nonce-<n>' 'strict-dynamic'`（`'unsafe-inline'` 削除）
- `style-src 'self' 'nonce-<n>'`（`'unsafe-inline'` 削除）
- mode は `report-only` のまま不変（不変条件 #5）
- env は `getPublicEnv()` 経由のみ（不変条件 #1）

---

## P1: `apps/web/src/lib/security-headers.ts` 改修

### 変更対象
- `SecurityHeaderConfig` interface
- `buildCspDirective(cfg)`

### 関数シグネチャ（before / after）

```ts
// before
export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;
  authOrigin: string;
}
export const buildCspDirective = (cfg: SecurityHeaderConfig): string => ...

// after（シグネチャ不変、optional field 追加のみ）
export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;
  authOrigin: string;
  nonce?: string;   // 追加: 指定時のみ nonce-based directive を出力
}
export const buildCspDirective = (cfg: SecurityHeaderConfig): string => ...
```

### 擬似コード（nonce 分岐）

```ts
export const buildCspDirective = (cfg: SecurityHeaderConfig): string => {
  // nonce 有無で script-src / style-src を切り替える。他 directive は不変。
  const scriptSrc = cfg.nonce
    ? `script-src 'self' 'nonce-${cfg.nonce}' 'strict-dynamic'`
    : "script-src 'self'";                       // 安全側: nonce 無いなら unsafe-inline を出さない（TC-04）
  const styleSrc = cfg.nonce
    ? `style-src 'self' 'nonce-${cfg.nonce}'`
    : "style-src 'self'";

  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' data: https:",
    `connect-src 'self' ${cfg.apiBaseUrl} ${cfg.authOrigin}`,
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    `form-action 'self' ${cfg.authOrigin}`,
  ].join("; ");
};
```

- **削除**: 既存の `"script-src 'self' 'unsafe-inline'"` / `"style-src 'self' 'unsafe-inline'"` の 2 行（`rg "'unsafe-inline'"` 2 hit → 0）。
- **追加**: `'strict-dynamic'`（script-src のみ）。style-src には付与しない（仕様 / TC-03）。
- 入出力: 純関数。副作用なし。`buildSecurityHeaders` / `applySecurityHeaders` はシグネチャ・実装不変（`cfg.nonce` が自動的に `buildCspDirective` へ伝播）。
- 依存関係: なし（このファイル内で完結）。

### 検証
```bash
mise exec -- pnpm --filter web test src/lib/security-headers.spec.ts
mise exec -- pnpm typecheck
```

> TC-04 で throw 方針を採る場合は、nonce 未指定時に `throw new Error("nonce required for CSP")` とし、
> middleware が常に nonce を渡す前提を型外で強制する。Phase 3 設計レビュー結論に従う。

---

## P2: `apps/web/middleware.ts` 改修

### 変更対象
- `generateNonce()` 新規追加
- `guardedMiddleware` の各 return（`NextResponse.next()` / redirect / 403）に request header 注入
- `buildSecurityHeaderConfig()` に nonce を thread
- `middleware()` の最終 `applySecurityHeaders` 呼び出し

### 関数シグネチャ（before / after）

```ts
// before
const buildSecurityHeaderConfig = (): SecurityHeaderConfig => ({ cspMode, apiBaseUrl, authOrigin });
const guardedMiddleware = async (req: NextRequest) => NextResponse;
export async function middleware(req: NextRequest) { ... }

// after
const generateNonce = (): string => ...;                                  // 新規
const buildSecurityHeaderConfig = (nonce: string): SecurityHeaderConfig => ({ ..., nonce });  // 引数追加
const guardedMiddleware = async (req: NextRequest, nonce: string) => NextResponse;            // 引数追加
export async function middleware(req: NextRequest) { ... }                // nonce を生成し thread
```

### 擬似コード

```ts
// edge runtime で利用可能な Web Crypto を使う（Node 依存禁止）
const generateNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // base64 化。btoa は edge で利用可。
  return btoa(String.fromCharCode(...bytes));
};

const buildSecurityHeaderConfig = (nonce: string): SecurityHeaderConfig => {
  const env = getPublicEnv();                         // 不変条件 #1
  return {
    cspMode: "report-only",                           // mode 不変（不変条件 #5）
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    authOrigin: "https://accounts.google.com",
    nonce,
  };
};

const guardedMiddleware = async (req: NextRequest, nonce: string) => {
  const cfg = buildSecurityHeaderConfig(nonce);
  const cspValue = buildCspDirective(cfg);

  // request header に nonce + CSP を注入 → Next.js が自前 inline script/style に nonce を自動付与
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy-Report-Only", cspValue);

  const nextWithNonce = () =>
    NextResponse.next({ request: { headers: requestHeaders } });

  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/profile")) {
    return nextWithNonce();
  }
  const claims = await decodeAuthSessionJwt(authSecret(req), sessionToken(req));
  if (pathname.startsWith("/admin")) {
    if (!claims) return buildAdminLoginRedirect(req);     // redirect は response header のみで足りる
    if (!claims.isAdmin) return new NextResponse("Forbidden", { status: 403, headers: {...} });
    return nextWithNonce();
  }
  if (pathname.startsWith("/profile")) {
    if (!claims) return buildProfileLoginRedirect(req);
    return nextWithNonce();
  }
  return nextWithNonce();
};

export async function middleware(req: NextRequest) {
  const nonce = generateNonce();
  const response = await guardedMiddleware(req, nonce);
  // response header にも CSP を載せる（ブラウザが実際に評価する正本）
  return applySecurityHeaders(response, buildSecurityHeaderConfig(nonce));
}
```

### 入出力・副作用・依存
- `generateNonce`: 副作用なし純関数（毎回異なる値）。`crypto` / `btoa` は edge runtime で利用可。Node 専用 API は使わない。
- request header 注入は `NextResponse.next({ request: { headers } })` を通る経路（`/`・認証通過 admin/profile）でのみ有効。redirect / 403 では request header 注入は不要（描画されないため）だが、`applySecurityHeaders` による **response header の CSP は全経路に付与**する（TC-10）。
- 依存: `getPublicEnv`（不変条件 #1）/ `buildCspDirective` / `applySecurityHeaders`（P1）。
- 不変条件: `process.env` 直接参照を増やさない（既存 `authSecret` の `process.env["AUTH_SECRET"]` フォールバックは本タスク対象外・現状維持）。`127.0.0.1:8888` を焼き込まない。

### 検証
```bash
mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts
mise exec -- pnpm typecheck
```

---

## P3: `apps/web/app/layout.tsx` 改修 + inline style リファクタ + grep gate

### P3-a: root layout で nonce 取得・伝播

現行 `apps/web/app/layout.tsx`（注: `src/app` ではなく `apps/web/app/`）は独自 inline script/style を持たない。
そのため**最小実装は「nonce 取得のみ」**で足り、Next.js の自前 inline には middleware の request header 経由で自動付与される。
将来独自 inline を足す場合に備え、取得経路を確立しておく。

```ts
import { headers } from "next/headers";

export default async function RootLayout({ children }: { readonly children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;   // middleware が注入
  return (
    <html lang="ja" data-theme="warm">
      <body data-shell="root">
        <ToastProvider>{children}</ToastProvider>
        {/* 独自 inline を追加する場合のみ nonce を伝播。例: <script nonce={nonce} /> */}
      </body>
    </html>
  );
}
```

- `RootLayout` を **async 化**する（`headers()` は async）。`generateMetadata` は既に async で影響なし。
- `headers()` を呼ぶと該当 layout は dynamic rendering になる。CSP の性質上 request 毎 nonce が必須のため許容（既に middleware を通る前提）。
- OpenNext / `next build --webpack` で `headers()` が同期的に解決されるかは Phase 7 統合検証で確認する（リスク項目）。

### P3-b: inline `style=` 属性のリファクタ（Phase 1 棚卸し前提）

style-src を nonce 化すると、ブラウザは nonce 併用時 `'unsafe-inline'` を無視するため、
属性インライン（`style={{...}}`）は CSP では制御できない別系統だが、**動的値を持つ属性インラインは残しても CSP 違反にならない**点に注意する。
ただし設計方針（issue index）は「inline `style=` 属性を class へリファクタ」を含むため、Phase 1 棚卸し結果に従い対象を分類する。

現行の `style={{...}}` 出現箇所（`rg "style=\{\{" apps/web/src` → 16 hit / 13 ファイル）:

| ファイル | 件数 | 想定対応 |
|---------|------|---------|
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 3 | 静的値は class / token 化、動的値（幅・色の算出）は CSS custom property（`style={{ "--w": x }}`）へ |
| `apps/web/src/components/ui/ConfirmDialog.tsx` | 3 | 同上 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | 1 | 同上 |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | 1 | 同上 |
| `apps/web/src/components/admin/TagsQueueResolveDrawer.tsx` | 1 | 同上 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 1 | 同上 |
| `apps/web/src/components/ui/Avatar.tsx` | 1 | 同上 |
| `apps/web/src/components/ui/Icon.tsx` | 1 | 同上 |
| `apps/web/src/components/public/Hero.tsx` | 1 | 同上 |
| `apps/web/src/components/public/ZoneIntro.tsx` | 1 | 同上 |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | 1 | 同上 |
| `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | 1 | 同上 |

リファクタ方針:
1. 静的な装飾値（固定色・固定サイズ）は Tailwind utility / `tokens.css` の OKLch token に置換（不変条件: HEX 直書き禁止）。
2. 動的値（計算された幅・グラフ比率など算出が必要なもの）は CSS custom property を `style={{ "--bar-width": \`${pct}%\` }}` 形式で渡し、CSS 側で `width: var(--bar-width)` を消費する。属性インラインは残っても script-src/style-src nonce 評価の対象外（`style-src` の `'unsafe-inline'` 削除はインライン `<style>` 要素の制御であり、`style=` 属性は `style-src-attr` の管轄）。
3. ただし将来の `style-src-attr` 強化に備え、**算出 custom property 方式に統一**して属性へのベタ書き CSS 文字列を減らす。
4. Phase 1（要件定義）の棚卸し表を正本とし、件数差分があれば実装時に再 `rg` して同期する。

> 注意: 本タスクの CSP nonce 化（`<style>` 要素 nonce 化）と `style=` 属性は別レイヤ。19 routes の
> 描画破壊（TC-11）が出ない範囲で属性リファクタを行い、過剰なリファクタで scope を広げない（CONST: gold-plating 回避）。

### P3-c: grep gate 追加

- `lefthook.yml` の pre-push（または既存 grep gate job）に `rg "'unsafe-inline'" apps/web/src` が hit したら fail するチェックを追加（task-18 の `127.0.0.1:8888` grep gate と同方式）。
- CI workflow（`verify-design-tokens` 系か新規 step）にも同 grep を入れ、回帰を二重で防ぐ（不変条件 #6）。

### 検証
```bash
rg "'unsafe-inline'" apps/web/src && echo FAIL || echo PASS
mise exec -- pnpm --filter web build      # next build --webpack 正本
mise exec -- pnpm --filter web exec playwright test playwright/tests/csp-violation.spec.ts
```

---

## 実装順序サマリ（直列推奨）

| 順 | section | ゲート（次へ進む条件） |
|----|---------|----------------------|
| 1 | P1 security-headers.ts | unit TC-01..06 green + typecheck |
| 2 | P2 middleware.ts | HTTP smoke TC-07..10 green + typecheck |
| 3 | P3-a layout.tsx | build green（headers() 同期解決確認） |
| 4 | P3-b inline style リファクタ | TC-11 violation 0（19 routes） |
| 5 | P3-c grep gate | TC-12 0 hit + CI / lefthook fail 化確認 |

## DoD（Definition of Done）

- AC-01..AC-08 を満たす（Phase 4 対応表参照）。
- `rg "'unsafe-inline'" apps/web/src` が 0 hit。
- `pnpm typecheck` / `pnpm lint` / `pnpm --filter web build`（webpack）green。
- mode は report-only のまま（enforce 切替は本サイクル対象外）。
- 19 routes で CSP violation 0、描画破壊なし。
