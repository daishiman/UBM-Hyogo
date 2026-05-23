# Phase 5: 実装計画

`[実装区分: 実装仕様書]`

## 変更対象ファイル

| パス | 変更種別 | 概要 |
|------|---------|------|
| `apps/web/src/lib/security-headers.ts` | 新規 | `buildSecurityHeaders` / `applySecurityHeaders` / 型定義 |
| `apps/web/src/lib/security-headers.spec.ts` | 新規 | unit test（Phase 4 TC-01〜TC-08） |
| `apps/web/middleware.ts` | 編集 | matcher 拡張・全 response への applySecurityHeaders 適用 |
| `apps/web/playwright/tests/security-headers.spec.ts` | 新規 | smoke test（TC-SMOKE-01〜06） |
| `apps/web/src/lib/env.ts` | 変更なし | 既存正本 `NEXT_PUBLIC_API_BASE_URL` を利用 |

## P1 / P2 / P3 セクション

### P1: CSP `connect-src` 制限（127.0.0.1:8888 防御層化）

**目的**: 拡張機能が `apps/web` の origin context で localhost に投げる通信を CSP report-only で可視化する。

**実装**:
- `buildSecurityHeaders()` 内で CSP `connect-src 'self' ${apiBaseUrl} ${authOrigin}` を構築
- `'self'` と明示的 origin 以外は report-only で違反検出（初期導入ではブロックしない）
- 拡張機能由来でも page origin で発生する `fetch` / `XHR` は CSP 対象

**完了条件**:
- TC-01, TC-02 GREEN
- `pnpm --filter @ubm-hyogo/web build` 成功
- production 配信レスポンスに `Content-Security-Policy-Report-Only: ... connect-src 'self' ...` が出力される

### P2: TrustedScript 衝突回避

**目的**: `require-trusted-types-for 'script'` を**出力しない**ことで、拡張機能 `prepare.js` 等の `setInterval(<string>)` を妨げず、自社 page 上でも違反警告を発生させない。

**実装**:
- `buildSecurityHeaders()` 内で CSP ディレクティブ列挙時に `require-trusted-types-for` / `trusted-types` を含めない
- 将来 nonce 化等で XSS 対策を強化する際は別 task で導入（report-only で観測してから判断）

**完了条件**:
- TC-03 GREEN
- ブラウザ DevTools で page document に `TrustedScript` 警告が apps/web 起因で出ない

### P3: Permissions-Policy 明示化

**目的**: 自社 response で Permissions-Policy を明示出力し、`browsing-topics` を含めないことで Chrome 警告を抑制（Google 配信スクリプトの警告自体は抑制不可だが、自社レスポンスに同じ警告が混ざるのを防ぐ）。

**実装**:
- `buildSecurityHeaders()` で Permissions-Policy 値を列挙
- `browsing-topics` は**列挙しない**（unrecognized 防止）
- 主要な privacy-sensitive feature を `=()` で無効化

**完了条件**:
- TC-04, TC-05 GREEN
- production レスポンスヘッダに `Permissions-Policy` が出力され、`browsing-topics` を含まない

## 関数シグネチャ詳細

```typescript
// apps/web/src/lib/security-headers.ts

export type SecurityHeaderMode = "report-only" | "enforce";

export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;
  authOrigin: string;
}

const PERMISSIONS_POLICY_DIRECTIVES = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
] as const;

export const buildCspDirective = (cfg: SecurityHeaderConfig): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    `connect-src 'self' ${cfg.apiBaseUrl} ${cfg.authOrigin}`,
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    `form-action 'self' ${cfg.authOrigin}`,
  ].join("; ");
};

export const buildSecurityHeaders = (cfg: SecurityHeaderConfig): Headers => {
  const h = new Headers();
  const cspHeaderName =
    cfg.cspMode === "enforce"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";
  h.set(cspHeaderName, buildCspDirective(cfg));
  h.set("Permissions-Policy", PERMISSIONS_POLICY_DIRECTIVES.join(", "));
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  return h;
};

export const applySecurityHeaders = <T extends Response>(
  response: T,
  cfg: SecurityHeaderConfig,
): T => {
  const secHeaders = buildSecurityHeaders(cfg);
  secHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
};
```

## middleware.ts 編集差分

```typescript
// 追加 import
import { applySecurityHeaders, type SecurityHeaderConfig } from "@/lib/security-headers";
import { getPublicEnv } from "@/lib/env";

// matcher 拡張
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};

// middleware 本体
export default function middleware(req: NextRequest): NextResponse {
  const env = getPublicEnv();
  const securityCfg: SecurityHeaderConfig = {
    cspMode: "report-only",
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    authOrigin: "https://accounts.google.com",
  };

  // 既存認証ガード（pathname で分岐）
  const authResponse = handleAuthIfNeeded(req);
  if (authResponse) {
    return applySecurityHeaders(authResponse, securityCfg);
  }

  const passthrough = NextResponse.next();
  return applySecurityHeaders(passthrough, securityCfg);
}
```

> 既存の `/admin/*` `/profile/*` 認証ロジックは `handleAuthIfNeeded(req)` ヘルパ関数に切り出し、全 matcher で再利用する。matcher 拡張後も既存挙動を回帰なしで維持。

## TDD サイクル

1. **RED**: `security-headers.spec.ts` を Phase 4 仕様で書く（実装なしで実行・全 TC FAIL 確認）
2. **GREEN**: `security-headers.ts` 実装 → 全 unit TC PASS
3. **REFACTOR**: directive 構築の DRY 化（PERMISSIONS_POLICY_DIRECTIVES 等）
4. middleware 統合 → playwright smoke TC PASS

## ローカル実行・検証コマンド

```bash
# 依存・型
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# unit test
mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers

# build & local serve
ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 PUBLIC_API_BASE_URL=http://127.0.0.1:8787 INTERNAL_API_BASE_URL=http://127.0.0.1:8787 AUTH_URL=http://localhost:3000 SENTRY_ENVIRONMENT=local SENTRY_TRACES_SAMPLE_RATE=0 mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web start

# 別 terminal で header 確認
curl -sI http://localhost:3000/ | grep -iE "content-security-policy|permissions-policy|x-frame"
curl -sI http://localhost:3000/ | grep -i "permissions-policy" | grep -v "browsing-topics" && echo "P3 OK"
curl -sI http://localhost:3000/ | grep -i "content-security-policy" | grep -v "require-trusted-types-for" && echo "P2 OK"

# playwright smoke
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/security-headers.spec.ts --project=desktop-chromium

# regression literal guard（test/spec の assertion literal は除外）
rg -n "127\\.0\\.0\\.1:8888|browsing-topics|require-trusted-types-for" apps/web/src apps/web/middleware.ts -g '!*.spec.ts' -g '!**/__tests__/**'

# task-18 regression guard 再実行
mise exec -- pnpm verify:pr-ready 2>&1 || bash scripts/verify-pr-ready.sh
```

## DoD (Definition of Done)

- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `apps/web` unit test 全 GREEN（8 TC）
- [ ] `apps/web` playwright smoke 全 GREEN（4 TC）
- [ ] `pnpm --filter web build` 成功（OpenNext bundle 失敗なし）
- [ ] `curl -sI` で 3 header 出力確認（CSP-Report-Only / Permissions-Policy / X-Frame-Options）
- [ ] `Permissions-Policy` 値に `browsing-topics` substring なし
- [ ] CSP 値に `require-trusted-types-for` substring なし
- [ ] task-18 grep gate 再 fail なし（`bash scripts/verify-pr-ready.sh` PASS）
- [ ] `getPublicEnv()` 経由で env 参照（直接 `process.env.*` なし）

## 残課題（未タスク化候補）

- CSP enforce 切替（別 task / report-only 観測期間後）
- CSP nonce 化（`'unsafe-inline'` 排除）
- Reporting-Endpoints 設定（違反レポート集約）
- `apps/api` 側の同等ヘッダ追加
