# Phase 2: 設計 — issue-871 CSP nonce 化

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=NON_VISUAL]`

> 本 Phase は local implementation 済みの設計正本である。staging/production verification とPR操作は user-gated。

---

## 1. nonce 生成方式の選定

### 1.1 候補と評価

| 候補 | 内容 | 評価 |
|------|------|------|
| **A. base64(16byte) ✅採用** | `btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))` | 128bit エントロピー。Next.js 公式 CSP ガイド準拠。edge runtime の Web Crypto で動作。CSP nonce 推奨長を満たす |
| B. `btoa(crypto.randomUUID())` | UUID v4 を base64 | randomUUID は 122bit 実効エントロピー。動作するが公式ガイドは A を採用。可読性は同等 |
| C. `crypto.randomUUID()` 生値 | ハイフン入り 36 文字 | CSP nonce は base64 文字集合が慣例。ハイフン生値は許容されるが公式踏襲のため非採用 |

**採用: A（base64 16byte）**。理由: Next.js 公式 CSP ドキュメントが提示する正規パターンで、`crypto.getRandomValues` は Cloudflare Workers edge runtime / OpenNext で利用可能。128bit は CSP nonce として十分。

```text
generateNonce(): string
  入力: なし
  出力: base64 文字列（例 "Yk8s...=="、長さ ~24 文字）
  実装: const bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
        return btoa(String.fromCharCode(...bytes));
  配置: apps/web/middleware.ts 内のモジュールスコープ関数
```

---

## 2. nonce 流通シーケンス（middleware → layout → component）

Next.js 公式 CSP パターン（request header に CSP+nonce をセット → Next.js が bootstrap script に自動付与、response header にも CSP をセット → ブラウザ評価）を厳守する。

```text
[Browser] --GET /any-route-->
   |
   v
[apps/web/middleware.ts  (edge runtime)]
   1. nonce = generateNonce()                      # FR-01
   2. cfg = buildSecurityHeaderConfig() に nonce を合成 → { cspMode, apiBaseUrl, authOrigin, nonce }
   3. csp = buildCspDirective(cfg)                  # nonce 入り directive 文字列
   4. requestHeaders = new Headers(req.headers)
        requestHeaders.set("x-nonce", nonce)        # FR-04 layout 取得用
        requestHeaders.set("Content-Security-Policy", csp)  # FR-02 Next.js bootstrap 用
   5. response = guardedMiddleware(req) の結果に、
        NextResponse.next({ request: { headers: requestHeaders } }) を適用
        （auth redirect / 403 の場合は従来通り。security header は共通付与）
   6. applySecurityHeaders(response, cfg)            # FR-03 response の CSP-Report-Only に nonce 入り csp
   |
   v
[Next.js runtime]  request header の CSP に nonce があると bootstrap inline <script> に nonce 自動付与
   |
   v
[apps/web/app/layout.tsx (RSC)]
   const nonce = (await headers()).get("x-nonce") ?? undefined   # FR-04 / FR-07
   独自 inline には <Script nonce={nonce}> / <style nonce={nonce}> で伝播
   |
   v
[Browser]  response CSP を評価。nonce 一致 script/style のみ実行。'unsafe-inline' は CSP3 で無視
```

> auth redirect（302）/ 403 レスポンスにも security header を付与する現行挙動を維持する。`NextResponse.next({ request })` は通常遷移時のみ。redirect/403 の場合は request header 転送が不要（downstream へ渡らない）ため、その経路では `x-nonce` / request CSP のセットは省略可。設計上、nonce 入り response CSP の付与は全経路共通とする。

---

## 3. `buildCspDirective` の新シグネチャと構築ロジック

### 3.1 `SecurityHeaderConfig` 拡張

```ts
export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;
  authOrigin: string;
  nonce?: string;           // 追加。未指定時は後方互換出力（FR-08）
}
```

### 3.2 `buildCspDirective(cfg)` 分岐ロジック

`nonce` の有無で `script-src` / `style-src` を分岐する。それ以外の directive は不変。

```text
scriptSrc =
  cfg.nonce
    ? `script-src 'self' 'nonce-${cfg.nonce}' 'strict-dynamic'`   # FR-05 / AC-02 / AC-03
    : `script-src 'self' 'unsafe-inline'`                          # 後方互換（FR-08）

styleSrc =
  cfg.nonce
    ? `style-src 'self' 'nonce-${cfg.nonce}'`                      # FR-06 / AC-02
    : `style-src 'self' 'unsafe-inline'`                           # 後方互換（FR-08）

返却 join("; "):
  default-src 'self'
  <scriptSrc>
  <styleSrc>
  img-src 'self' data: https:
  connect-src 'self' ${cfg.apiBaseUrl} ${cfg.authOrigin}
  font-src 'self' data:
  frame-ancestors 'none'
  base-uri 'self'
  form-action 'self' ${cfg.authOrigin}
```

> **後方互換（FR-08）の意図**: 既存 unit テストの一部・nonce を渡さない呼び出し経路（あれば）を壊さないため。本番経路（middleware）は常に nonce を渡すため、production 出力は必ず nonce 版になる。`'unsafe-inline'` の grep gate（NFR-06）は production 経路に nonce が常時注入されることを前提に、`security-headers.ts` の `'unsafe-inline'` 直書き自体を将来禁止する（後方互換分岐の文字列も最終的には gate 対象とするか Phase 4/5 で判断。MVP では「直書き 0 hit」を満たすため後方互換分岐も含め `'unsafe-inline'` を排除する設計を優先する）。

> **設計確定**: 後方互換分岐に `'unsafe-inline'` を残すと AC-04（`rg "'unsafe-inline'" apps/web/src` → 0 hit）と矛盾する。よって最終形は **nonce 必須**とし、`buildCspDirective` は `cfg.nonce` が無い場合 `script-src 'self'` / `style-src 'self'`（inline 不許可）を出力する設計に倒す。テスト容易性は「テストで nonce を渡す」ことで担保する。FR-08 の「後方互換」は「nonce 未指定でも throw せず妥当な CSP を返す（ただし inline は許可しない）」と再定義する。

---

## 4. request header / response header 双方注入の理由

| 注入先 | 目的 | 利用者 |
|--------|------|--------|
| **request header** `Content-Security-Policy`（nonce 入り） | Next.js が「この response の CSP に nonce が含まれる」と検知し、自前 bootstrap inline `<script>` へ nonce を **自動付与**する。これがないと Next.js の hydration script が nonce 無しのまま出力され、`'unsafe-inline'` 削除後に実行ブロックされ全画面が壊れる（リスク①） | Next.js framework（内部） |
| **request header** `x-nonce` | root layout / Server Component が `headers()` から nonce を取得し、独自 inline script/style に伝播する（FR-04 / FR-07） | `apps/web/app/layout.tsx` 等 |
| **response header** `Content-Security-Policy-Report-Only`（nonce 入り） | ブラウザが実際に CSP を評価する。`report-only` のため違反は report されるが block されない（cspMode 不変・AC-08） | ブラウザ |

---

## 5. root layout での `headers()` 取得

`apps/web/app/layout.tsx`（注: パスは `apps/web/app/`。`apps/web/src/app/` ではない）を以下方針で変更する。

```ts
import { headers } from "next/headers";
// ...
export default async function RootLayout({ children }: { readonly children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  // 現状 layout に独自 <script> / <style> は無いため、nonce は
  //  - 将来の inline script 追加時の伝播口として確保
  //  - styled-jsx を使う場合の <style nonce> 付与口
  // として取得する。RootLayout を async 化する。
  return (
    <html lang="ja" data-theme="warm">
      <body data-shell="root">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

> 現状 `layout.tsx` に独自 inline script/style は無い（Phase 1 調査: styled-jsx / `<style>` 要素 0 件）。よって nonce を「取得して未使用」になり得るが、(1) Next.js 自動付与は request header CSP 経由で成立するため layout 側の取得は必須ではない、(2) ただし将来の inline 追加・SSR-injected script の伝播口として `headers()` 取得は確保しておく。**最小変更方針**: layout を async 化し `nonce` を取得するが、現状 inline が無いため属性付与先は無し。Phase 4/5 で「nonce 未使用変数の lint 回避（`void nonce` ないし実際の伝播先確保）」を決める。

---

## 6. style-src 対応方針（`<style>` nonce 化 + inline `style=` リファクタ）

### 6.1 重要な仕様前提（CSP nonce と inline style の関係）

CSP の nonce は **`<style>` 要素** にのみ適用でき、HTML の **`style=` 属性（inline style attribute）** には適用できない。`style-src 'nonce-x'` のもとでは inline `style=` 属性は `'unsafe-inline'` がない限り**ブロックされる**（`style-src-attr` を別途許可しない限り）。

Phase 1 調査では `apps/web/src` に inline `style=` 属性が 12 ファイル・16 箇所存在する。内訳:

| 種別 | 例 | 対応 |
|------|----|------|
| **静的値** | `style={{ color: "var(--ubm-color-danger)" }}`（ConfirmDialog） | class / CSS module / Tailwind utility へ移設（リファクタ対象） |
| **動的値バインド** | `style={{ background: \`hsl(${hue} 70% 60%)\` }}`（Avatar）, progress 幅（ZoneDistribution） | 値が実行時計算のため class 化困難。CSS custom property 経由（`style={{ "--avatar-hue": hue }}` + class 側で `hsl(var(--avatar-hue) ...)`）に置換し、`style=` 属性自体を撤廃するか、`style-src-attr 'unsafe-hashes'`/属性許容の是非を Phase 4 で判断 |

### 6.2 採用方針

1. **静的 inline `style=` → class / CSS module へ全件移設**（リファクタ）。
2. **動的 inline `style=` → CSS custom property バインドへ置換**し、`style=` は CSS 変数の代入のみに限定。`hsl(var(--x))` 等の値解釈は CSS 側 class で行う。これにより `style=` 属性に「実際のスタイル宣言」を残さない。
   - 注: CSS 変数の代入も技術的には inline style attribute だが、`style-src` の評価対象は「インラインで宣言された CSS のうち実効スタイル」であり、ブラウザ実装によっては CSS 変数代入も attribute 扱いとなる。**安全側設計**として、`style-src 'self' 'nonce-x'` で 19 routes violation 0（AC-06）を満たせるかを Phase 4 の Playwright で実測し、満たせない属性は class 化を継続する。
3. `<style>` JSX 要素 / styled-jsx を新規に使う場合は `nonce={nonce}` を必ず付与する（現状 0 件のため新規発生時のルール）。

> 本サイクルのゴールは `style-src` から `'unsafe-inline'` を削除して 19 routes violation 0 を満たすこと。inline `style=` 属性の棚卸し全件対応は Phase 4 test-plan / Phase 5 implementation-plan で具体ファイル単位に展開する。

---

## 7. `'strict-dynamic'` を含める判断根拠（元 issue 上書き）

元 issue #871（AWSHH-FU-002）は「`strict-dynamic` を含まない nonce 単独」を前提にしていたが、これは **Next.js 16 App Router の実態に合わず誤りとして本仕様で上書きする**（ユーザー承認済み）。

| 観点 | 根拠 |
|------|------|
| App Router の動的 chunk 注入 | App Router は hydration 後にコード分割された chunk を `<script>` 動的挿入で読み込む。これらは nonce を持たない動的 script のため、nonce 単独（`script-src 'self' 'nonce-x'`）だとブロックされ、ナビゲーション / 部分 hydration が壊れる。 |
| `'strict-dynamic'` の効果 | nonce で信頼された bootstrap script が動的に作る子 script へ信頼を伝播し、`'self'` ホスト allowlist を無視させる。これにより動的 chunk が nonce 無しでも実行可能になる。 |
| Next.js 公式ガイド | 公式 CSP ドキュメントが `script-src 'self' 'nonce-{nonce}' 'strict-dynamic'` を提示している。 |
| セキュリティ | `'strict-dynamic'` は信頼の起点を nonce script に限定するため、`'self'` 単独よりむしろ堅牢（任意の同一オリジン script 実行を許さない）。 |

結論: `script-src 'self' 'nonce-<n>' 'strict-dynamic'` を採用（FR-05 / AC-03）。

---

## 8. Cloudflare Workers / OpenNext での `headers()` 互換検証方針

| 検証項目 | 方針 |
|----------|------|
| edge runtime での `crypto.getRandomValues` | Workers runtime に Web Crypto が存在することは既知。Phase 6 unit / Phase 7 統合で `generateNonce()` が文字列を返すことを確認 |
| `await headers()`（next/headers）の RSC 動作 | Next.js 16 では `headers()` は async。OpenNext build（`next build --webpack`）で RSC が `x-nonce` を取得できるかを Phase 8 build + Phase 11 相当の HTTP smoke で確認。取得できない場合は **request context 経由**（middleware で response にセットした値を別経路で渡す）にフォールバック（リスク②） |
| `NextResponse.next({ request: { headers } })` の Workers 互換 | 公式 API。OpenNext で正しく downstream に request header が伝わるかを Playwright HTTP smoke の `x-nonce` / response CSP で間接確認 |

---

## 9. 後方互換（nonce 未指定時の挙動）

- `buildCspDirective(cfg)` は `cfg.nonce === undefined` のとき throw せず、`script-src 'self'` / `style-src 'self'`（inline 不許可・`'unsafe-inline'` も含まない）を返す（§3.2 確定）。
- これにより AC-04（`'unsafe-inline'` 0 hit）と単体テストの両立を担保する。
- 本番 middleware は常に nonce を注入するため、production 出力は必ず nonce 版になる。

---

## 10. 変更ファイル一覧

| パス | 種別 | 変更内容 |
|------|------|---------|
| `apps/web/src/lib/security-headers.ts` | 編集 | `SecurityHeaderConfig` に `nonce?: string` 追加。`buildCspDirective` を §3.2 の nonce 分岐に変更。`'unsafe-inline'` 直書き削除 |
| `apps/web/middleware.ts` | 編集 | `generateNonce()` 追加。`buildSecurityHeaderConfig()` に nonce 合成。request header（`x-nonce` + `Content-Security-Policy`）注入。`NextResponse.next({ request: { headers } })` 化。response への nonce 入り CSP 付与 |
| `apps/web/app/layout.tsx` | 編集 | `RootLayout` を async 化し `(await headers()).get("x-nonce")` 取得。将来 inline 伝播口を確保 |
| inline `style=` 該当ファイル（Phase 1 棚卸し 12 ファイル / 16 箇所） | 編集 | 静的値 → class/CSS module、動的値 → CSS 変数バインドへリファクタ（Phase 5 で具体化） |
| `apps/web/src/lib/security-headers.spec.ts` | 編集 | nonce 入り出力 assert / `'unsafe-inline'` 不在 assert / `'strict-dynamic'` 存在 assert / cspMode 不変 assert 追加 |
| `apps/web/playwright/tests/security-headers.spec.ts` | 編集 | response CSP の `nonce-` 値 match / 2 リクエスト間の nonce 差異 / `'unsafe-inline'` 不在 / 19 routes violation 0 を追加 |
| grep gate（task-18 regression smoke 系 or 新規 CI step） | 追加 | `rg "'unsafe-inline'" apps/web/src` が hit したら fail（NFR-06 / AC-04） |
