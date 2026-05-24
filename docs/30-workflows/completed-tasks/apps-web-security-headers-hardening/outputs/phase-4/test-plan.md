# Phase 4: テスト作成

## 新規テストファイル

### `apps/web/src/lib/security-headers.spec.ts`（unit）

| TC | 入力 | 期待結果 |
|----|------|---------|
| TC-01 | `buildSecurityHeaders({ cspMode: "report-only", apiBaseUrl: "https://api.example.com", authOrigin: "https://accounts.google.com" })` | `Content-Security-Policy-Report-Only` ヘッダが返る・`Content-Security-Policy` は返らない |
| TC-02 | 同上 | CSP に `connect-src 'self' https://api.example.com https://accounts.google.com` を含む |
| TC-03 | 同上 | CSP に `require-trusted-types-for` を**含まない** |
| TC-04 | 同上 | `Permissions-Policy` に `browsing-topics` を**含まない** |
| TC-05 | 同上 | `Permissions-Policy` に `camera=()`, `microphone=()`, `geolocation=()` を含む |
| TC-06 | `cspMode: "enforce"` | `Content-Security-Policy` ヘッダが返る・report-only 版は返らない |
| TC-07 | `applySecurityHeaders(response, cfg)` | response の既存 header を保持しつつ security header を merge |
| TC-08 | `X-Frame-Options=DENY`, `X-Content-Type-Options=nosniff`, `Referrer-Policy=strict-origin-when-cross-origin` | 全て出力 |

### `apps/web/playwright/tests/security-headers.spec.ts`（smoke）

| TC | 操作 | 期待結果 |
|----|------|---------|
| TC-SMOKE-01 | `GET /` | public route response に `Content-Security-Policy-Report-Only` / `Permissions-Policy` / `X-Frame-Options` が存在 |
| TC-SMOKE-02 | `GET /login` | public non-admin route response に `Content-Security-Policy-Report-Only` / `Permissions-Policy` / `X-Content-Type-Options` が存在 |
| TC-SMOKE-03 | `GET /admin`（未ログイン redirect / `maxRedirects: 0`） | response header に `Content-Security-Policy-Report-Only` 存在 |
| TC-SMOKE-04 | `GET /admin`（未ログイン redirect / `maxRedirects: 0`） | response header の `Permissions-Policy` に `browsing-topics` を含まない |
| TC-SMOKE-05 | `GET /admin`（未ログイン） | redirect response にも security header が付与されている |
| TC-SMOKE-06 | `GET /admin`（未ログイン redirect / `maxRedirects: 0`） | CSP `connect-src` に `NEXT_PUBLIC_API_BASE_URL` が含まれる |

## 既存テスト影響

- `apps/web/middleware.spec.ts`（存在する場合）— 既存認証分岐の assertion に security header presence 追加

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/security-headers.spec.ts --project=desktop-chromium
```

## ガード

- TC-04 は `Permissions-Policy` の値を文字列 split して `browsing-topics` substring がないことを assert（CLAUDE.md P3 不変条件の regression guard）
- TC-03 は CSP 値に `require-trusted-types-for` substring がないことを assert（P2 拡張機能衝突回避）
