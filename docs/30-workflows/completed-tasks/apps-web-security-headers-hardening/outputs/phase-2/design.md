# Phase 2: 設計

## トポロジー

```
Request → apps/web/middleware.ts (edge)
            ├─ 既存: 認証ガード（admin/profile matcher）
            └─ 新規: applySecurityHeaders(response)  ← 全 route に拡張
                       │
                       └─ buildSecurityHeaders(env) ← apps/web/src/lib/security-headers.ts
                                                       (純関数・env injection 経由)
```

## 採用方針

**`middleware.ts` matcher 拡張方式**を採用（next.config.ts `headers()` ではなく）。

### 比較

| 方式 | 採用可否 | 理由 |
|------|---------|------|
| `next.config.ts` の `headers()` | × | OpenNext Cloudflare bundling で route match が不安定。env を動的注入できない |
| `middleware.ts` で全 route matcher | ○ | edge runtime で動作確認済み・env access 可・既存パターン踏襲 |
| Workers handler（`open-next.config.ts`）に injector | △ | OpenNext bundle 経路依存・将来 OpenNext バージョン更新で破綻リスク |

### matcher 拡張

既存 matcher は `/admin/*` `/profile/*`。これに加えて security headers 用に**全 route matcher**を追加する。実装は単一 `middleware.ts` 内で responsibility 分岐。

```typescript
export const config = {
  matcher: [
    // 既存認証 + 新規 security headers の両方を全 route に適用
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

## 新規ファイル

### `apps/web/src/lib/security-headers.ts`

```typescript
import { getPublicEnv } from "./env";

export type SecurityHeaderMode = "report-only" | "enforce";

export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;       // getPublicEnv().NEXT_PUBLIC_API_BASE_URL
  authOrigin: string;       // OAuth provider origin
}

export const buildSecurityHeaders = (cfg: SecurityHeaderConfig): Headers;

export const applySecurityHeaders = (response: Response, cfg: SecurityHeaderConfig): Response;
```

#### 出力するヘッダ仕様

| ヘッダ | 値 | 備考 |
|--------|-----|------|
| `Content-Security-Policy-Report-Only` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ${apiBaseUrl} ${authOrigin}; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self' ${authOrigin}` | 初期 report-only。`'unsafe-inline'` は Next.js inline script のため必要 |
| `Permissions-Policy` | `accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()` | `browsing-topics` は**列挙しない**（unrecognized 警告を防ぐ。Chrome 専用 feature） |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 既存 default なら省略可。明示出力 |
| `X-Content-Type-Options` | `nosniff` | |
| `X-Frame-Options` | `DENY` | `frame-ancestors 'none'` の補強 |

> **CSP `require-trusted-types-for 'script'` は出力しない**。理由: 拡張機能が page CSP を継承するため、拡張内 `setInterval(<string>)` が page CSP でブロックされる衝突を引き起こす。代わりに `script-src 'self' 'unsafe-inline'` で必要最小限の制御に留める。

### `apps/web/middleware.ts` 改修

```typescript
import { applySecurityHeaders, type SecurityHeaderConfig } from "@/lib/security-headers";

const securityCfg: SecurityHeaderConfig = {
  cspMode: "report-only",
  apiBaseUrl: getPublicEnv().NEXT_PUBLIC_API_BASE_URL,
  authOrigin: "https://accounts.google.com",
};

export default function middleware(req: NextRequest): NextResponse {
  // 既存認証分岐
  const authResponse = handleAuthGuard(req);
  if (authResponse) {
    return applySecurityHeadersToNextResponse(authResponse, securityCfg);
  }

  const passthrough = NextResponse.next();
  return applySecurityHeadersToNextResponse(passthrough, securityCfg);
}
```

## ライブラリ選定

新規ライブラリ追加なし。`next/server` の `NextResponse` のみ使用。

## エラーハンドリング

- `getPublicEnv()` throw → 既存 `app/error.tsx`（task-05）が補足。本 middleware では try/catch で握り潰さない
- header 構築は純関数のため throw しない

## ステップ間 state 引き渡し

| ステップ | 入力 | 出力 |
|---------|------|------|
| 認証ガード判定 | `NextRequest` | `NextResponse \| null` |
| security headers 適用 | `NextResponse` + `SecurityHeaderConfig` | `NextResponse`（headers 拡張済み） |

## 責務境界

- **build** (純関数): `buildSecurityHeaders()` — `Headers` instance を返す
- **apply** (副作用): `applySecurityHeaders()` — Response に header を merge

## P1/P2/P3 マッピング

| 問題 | 対応 |
|-----|------|
| P1 (`127.0.0.1:8888`) | CSP `connect-src 'self' ${apiBaseUrl}` で localhost 通信を防御層で抑制（report-only ログとして可視化） |

## aiworkflow 正本同期対象

| 正本 | 反映内容 |
|------|----------|
| `indexes/quick-reference.md` | workflow 即時導線、実装対象、user gate |
| `indexes/resource-map.md` | workflow inventory 行 |
| `references/task-workflow-active.md` | active workflow 状態 |
| `references/security-web-response-headers.md` | CSP report-only / Permissions-Policy / Trusted Types 非採用境界 |
| `references/deployment-cloudflare-opennext-workers.md` | OpenNext Workers middleware header injection 方針 |
| `references/workflow-apps-web-security-headers-hardening-artifact-inventory.md` | 成果物台帳 |
| P2 (`TrustedScript`) | `require-trusted-types-for` を**出力しない**ことで拡張機能との衝突回避 |
| P3 (`browsing-topics`) | Permissions-Policy を**自社が明示出力**し `browsing-topics` を列挙しない |
