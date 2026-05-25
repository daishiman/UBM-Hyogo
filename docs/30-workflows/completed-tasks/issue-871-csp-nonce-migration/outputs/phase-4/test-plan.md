`[実装区分: 実装仕様書]`

# Phase 4 — テスト計画（issue-871 CSP nonce 化）

> 本サイクルは local implementation と focused tests を実施済み。本ドキュメントは実行済みテストと、Phase 13 user-gated runtime verification の計画を併記する。

## 1. テスト戦略

| レイヤ | フレームワーク | 目的 | 対象 |
|--------|--------------|------|------|
| unit | Vitest | `buildCspDirective` / `buildSecurityHeaders` の directive 文字列正当性 | `apps/web/src/lib/security-headers.ts` |
| playwright (HTTP smoke) | Playwright `request` | 実レスポンス header に nonce 入り CSP / `'unsafe-inline'` 不在 / request 毎一意 | dev server レスポンス |
| e2e (browser) | Playwright browser context | DevTools console の CSP violation 0（描画破壊・block 検知） | 19 routes |
| grep gate | ripgrep（CI / lefthook） | `'unsafe-inline'` ソース直書きの回帰防止 | `apps/web/src` |

設計確定事項（ユーザー承認済み）:
- `script-src 'self' 'nonce-<n>' 'strict-dynamic'`（`'unsafe-inline'` 削除）
- `style-src 'self' 'nonce-<n>'`（`'unsafe-inline'` 削除）
- nonce は middleware で request 毎に `crypto.getRandomValues(16byte)` を base64 化して生成
- `SecurityHeaderConfig` に `nonce?: string` を追加し、`buildCspDirective(cfg)` が `cfg.nonce` を参照
- nonce 未指定時の挙動は **TC-04 で定義する安全側の方針**（本計画では「nonce 無指定なら nonce トークンを差し込まず `'strict-dynamic'` も付与しない安全側 directive を返す」を既定とする。設計レビュー（Phase 3）で throw 方針を採用する場合は TC-04 をそれに合わせて差し替える）

## 2. テストケース一覧（TC-01..TC-12）

| ID | 種別 | 対象 | 入力 | 期待結果 | 対応AC |
|----|------|------|------|---------|--------|
| TC-01 | unit | `buildCspDirective` | `cfg = { cspMode:"report-only", apiBaseUrl, authOrigin, nonce:"abc123==" }` | 戻り値 string が `script-src 'self' 'nonce-abc123==' 'strict-dynamic'` を**部分一致で含む** | AC-01 |
| TC-02 | unit | `buildCspDirective` | 同上（nonce あり） | 戻り値が `'unsafe-inline'` を `script-src` / `style-src` の**いずれにも含まない**（文字列全体に `'unsafe-inline'` が出現しない） | AC-02 |
| TC-03 | unit | `buildCspDirective` | 同上（nonce あり） | 戻り値が `style-src 'self' 'nonce-abc123=='` を部分一致で含む（`'strict-dynamic'` は style-src には付与しない） | AC-03 |
| TC-04 | unit | `buildCspDirective` | `nonce` 未指定（`undefined`） | 安全側: `script-src` に `'nonce-...'` も `'unsafe-inline'` も `'strict-dynamic'` も含まない `script-src 'self'` を返し、throw しない（描画は壊れても CSP は緩めない）。throw 方針採用時は `expect(() => buildCspDirective(cfgWithoutNonce)).toThrow()` に差し替え | AC-04 |
| TC-05 | unit | `buildCspDirective` | nonce あり | `connect-src 'self' <apiBaseUrl> <authOrigin>` / `img-src 'self' data: https:` / `form-action 'self' <authOrigin>` / `frame-ancestors 'none'` / `base-uri 'self'` / `default-src 'self'` / `font-src 'self' data:` が現行と**完全一致で不変** | AC-05 |
| TC-06 | unit | `buildSecurityHeaders` | `cspMode:"report-only"` + nonce あり | `Content-Security-Policy-Report-Only` header が nonce 入り CSP を保持し、`Content-Security-Policy` は null（mode 不変）。`Permissions-Policy` / `X-Frame-Options` / `X-Content-Type-Options` / `Referrer-Policy` も現行通り | AC-05, AC-06 |
| TC-07 | playwright (HTTP) | `GET /` レスポンス | dev server へ `request.get("/")` | `content-security-policy-report-only` header が `'nonce-` を**含む** | AC-06 |
| TC-08 | playwright (HTTP) | 連続 2 回 `GET /` | `request.get("/")` を 2 回 | 2 レスポンスの CSP から抽出した `nonce-<value>` が**互いに異なる**（request 毎一意） | AC-07 |
| TC-09 | playwright (HTTP) | `GET /` / `GET /login` レスポンス | `request.get` | CSP header に `'unsafe-inline'` が**含まれない** | AC-02 |
| TC-10 | playwright (HTTP) | `GET /admin`（`maxRedirects:0`） | redirect (307/308) レスポンス | redirect 応答の CSP header も `'nonce-` を含み、`'unsafe-inline'` を含まない（middleware が redirect にも適用） | AC-06, AC-08 |
| TC-11 | e2e (browser) | 19 routes | 各 route を browser で開き console を購読 | `console.error` / `securitypolicyviolation` イベントに **CSP 由来 violation が 0 件**（描画破壊なし） | AC-08 |
| TC-12 | grep gate | `apps/web/src` | `rg "'unsafe-inline'" apps/web/src` | **0 hit**（現行 2 hit → 0）。non-zero hit で CI / lefthook fail | AC-02 |

## 3. 19 routes（TC-11 対象一覧）

| 層 | 数 | routes |
|----|----|--------|
| 公開 | 6 | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 会員 | 2 | `/login`, `/profile` |
| 管理 | 8 | `/(admin)/admin`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit` |
| 共通 | 3 | `error.tsx`, `not-found.tsx`, `loading.tsx`（直接 route ではないが boundary 描画を smoke に含める） |

> 管理 route は middleware で未認証 redirect されるため、TC-11 では admin テストアカウント
> （`manjumoto.daishi@senpai-lab.com`）でログインした session context で開く。redirect 自体の
> header は TC-10（HTTP smoke）でカバーする。inline style リファクタ漏れがあると style-src nonce 化で
> 描画が崩れるため、特に `/admin/*`（inline style 多用）の violation 0 を重点確認する。

## 4. テスト追加 / 変更対象ファイル

| ファイル | 区分 | 変更内容 |
|---------|------|---------|
| `apps/web/src/lib/security-headers.spec.ts` | 変更 | TC-01..TC-06 を追加。既存 7 it のうち directive 文字列を assert するもの（`connect-src` 等）は不変条件（AC-05）として残す。`cfg` fixture に `nonce` を追加 |
| `apps/web/playwright/tests/security-headers.spec.ts` | 変更 | TC-07..TC-10 を追加。既存 report-only smoke は維持。nonce 抽出ヘルパ（正規表現 `/'nonce-([^']+)'/`）を追加 |
| `apps/web/playwright/tests/csp-violation.spec.ts`（新規） | 追加 | TC-11（19 routes の `securitypolicyviolation` 監視）。`*.spec.ts` 命名厳守（不変条件 #8） |
| CI workflow + `lefthook.yml` | 追加 | TC-12 の grep gate（`rg "'unsafe-inline'" apps/web/src` が hit したら fail）。task-18 既存 grep gate（`127.0.0.1:8888`）と同じ仕組みに追従 |

## 5. 実行コマンド

```bash
# unit（TC-01..TC-06）
mise exec -- pnpm --filter web test src/lib/security-headers.spec.ts

# playwright HTTP smoke（TC-07..TC-10）
mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts

# playwright e2e violation（TC-11）
mise exec -- pnpm --filter web exec playwright test playwright/tests/csp-violation.spec.ts

# grep gate（TC-12）
rg "'unsafe-inline'" apps/web/src && echo "FAIL: unsafe-inline remains" || echo "PASS: 0 hit"

# 既定の前段検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web build   # next build --webpack 正本（不変条件 #4）
```

## 6. カバレッジ方針

- `buildCspDirective` / `buildSecurityHeaders` は分岐（nonce あり / なし / mode report-only / enforce）を unit で全網羅し、行・分岐カバレッジ 100% を目標とする。
- middleware の `generateNonce()` は unit で「base64 形式・16byte 由来・呼び出し毎に異なる」を検証し、edge runtime 依存部（`NextResponse.next`）は playwright HTTP smoke（TC-07/08/10）で実レスポンス検証に委ねる。
- e2e（TC-11）は描画破壊検知（regression）が目的でカバレッジ計測対象外。
- coverage-guard は sync-merge 由来の一時低下を除き既存しきい値を維持する。

## 7. 受け入れ基準対応サマリ

| AC | カバーする TC |
|----|--------------|
| AC-01 script-src に nonce + strict-dynamic | TC-01 |
| AC-02 unsafe-inline 不在 | TC-02, TC-09, TC-12 |
| AC-03 style-src nonce | TC-03 |
| AC-04 nonce 未指定の安全側挙動 | TC-04 |
| AC-05 他 directive / hardening header 不変 | TC-05, TC-06 |
| AC-06 report-only header に nonce 配信（mode 不変） | TC-06, TC-07, TC-10 |
| AC-07 request 毎 nonce 一意 | TC-08 |
| AC-08 19 routes 描画破壊・violation 0 | TC-10, TC-11 |
