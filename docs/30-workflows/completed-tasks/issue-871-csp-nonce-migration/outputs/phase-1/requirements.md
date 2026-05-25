# Phase 1: 要件定義 — issue-871 CSP nonce 化

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=NON_VISUAL]`

> 本サイクルは local implementation と focused evidence まで実施する。staging/production 検証・commit/push/PR は user-gated とする。

---

## 1. 背景

### 1.1 `'unsafe-inline'` の防御弱体化

親 cycle `apps-web-security-headers-hardening`（#871 の発見元）は CSP 導入時、Next.js 16 App Router が出力する inline script / inline style との互換を優先し、`script-src` / `style-src` に `'unsafe-inline'` を一時許可した。

`'unsafe-inline'` を含む CSP は「ポリシーは設定されているが、攻撃者が DOM へ注入した `<script>...</script>` を実質的にブロックできない」状態であり、業界標準（OWASP / Google CSP Evaluator）では **「CSP なし」と同等のリスク評価**を受ける。すなわち現状の CSP は XSS に対する defense-in-depth として機能していない。

本ワークフローでこの `'unsafe-inline'` を **nonce-based CSP**（CSP Level 3）へ移行し、防御効果を実効化する。

### 1.2 現状調査結果（origin/dev `f114d1188` / 2026-05-24）

| 観点 | 事実 |
|------|------|
| `buildCspDirective` | `apps/web/src/lib/security-headers.ts` が `script-src 'self' 'unsafe-inline'` / `style-src 'self' 'unsafe-inline'` を静的に `join("; ")` 出力 |
| `'unsafe-inline'` 出現箇所 | `rg "'unsafe-inline'" apps/web/src` → **2 hit**（いずれも `security-headers.ts`） |
| nonce 参照 | `apps/web/src` / `apps/web/app` 全体で **0 件**（生成・伝播ともに未実装） |
| middleware | `apps/web/middleware.ts` は `cspMode: "report-only"` 固定で `applySecurityHeaders` を適用 |
| root layout | `apps/web/app/layout.tsx`（注: `apps/web/src/app/` ではなく `apps/web/app/` 配下）に nonce 取得・伝播は存在しない |
| inline `style=` 属性 | `grep -rc 'style={{' apps/web/src --include="*.tsx"` → 12 ファイル・計 16 箇所。うち一部は動的値バインド（`hsl(${hue})` / progress 幅 / `var(--token)`） |
| styled-jsx / `<style>` 要素 | `apps/web/src` / `apps/web/app` のプロダクションコードに `<style>` JSX 要素・styled-jsx は **0 件** |

> 上記より issue #871 は **未解決**であり、別タスクでも解決されていない。

---

## 2. 目的

`apps/web` のレスポンス CSP から `script-src` / `style-src` の `'unsafe-inline'` を削除し、**Next.js 16 App Router の nonce-based CSP** に移行する。request 毎に nonce を発行し、Next.js が生成する bootstrap inline script および本プロジェクト独自の inline script / inline style に nonce を伝播させることで、CSP の XSS 防御効果（defense-in-depth）を実効化する。

---

## 3. スコープ

| 含む | 含まない |
|------|---------|
| `apps/web/middleware.ts` での request 毎 nonce 生成・request header / response header 双方への注入 | CSP `report-only` → `enforce` 切替（別 issue **AWSHH-FU-001 / U-AWSHH-001**） |
| `apps/web/src/lib/security-headers.ts` `buildCspDirective` の nonce 対応（`'unsafe-inline'` 削除 / `'strict-dynamic'` 追加 / `SecurityHeaderConfig` 拡張） | `apps/api` 側のヘッダ追加 |
| `apps/web/app/layout.tsx`（root layout）での `headers()` 経由 nonce 取得・伝播 | D1 schema 変更 / API endpoint 追加 / Google Form 仕様変更 |
| inline `style=` 属性のうち静的値のものを class / CSS module へリファクタ（Phase 1 棚卸し結果に基づく） | `Reporting-Endpoints` / `report-to` 導入（別 followup） |
| 単体テスト（`security-headers.spec.ts`）・Playwright HTTP smoke（`playwright/tests/security-headers.spec.ts`）の更新 | `require-trusted-types-for` 等 nonce 以外の directive 強化 |
| `rg "'unsafe-inline'" apps/web/src` を 0 件化する不変条件の grep gate 追加 | nonce 以外の CSP directive 値の変更 |

---

## 4. 機能要件

| ID | 要件 |
|----|------|
| FR-01 | middleware は HTTP request 毎に暗号学的に十分なエントロピーをもつ一意 nonce を生成する。 |
| FR-02 | 生成した nonce を入れた CSP を **request header**（downstream へ転送）に設定する。これにより Next.js が自前 bootstrap inline script に nonce を自動付与する。 |
| FR-03 | 同じ nonce を入れた CSP を **response header** にも設定する。これによりブラウザが CSP を評価する。 |
| FR-04 | nonce を request header `x-nonce` にも設定し、root layout / Server Component が `headers()` から取得できるようにする。 |
| FR-05 | `script-src` は `'self' 'nonce-<n>' 'strict-dynamic'` を出力し、`'unsafe-inline'` を含めない。 |
| FR-06 | `style-src` / `style-src-elem` は `'self' 'nonce-<n>'` を出力し、既存属性style互換は `style-src-attr` に分離する。 |
| FR-07 | root layout は `x-nonce` を取得し、独自 inline script（`next/script` の `<Script nonce>`）・`<style nonce>` に伝播する。 |
| FR-08 | nonce 未指定（`cfg.nonce` が `undefined`）の場合、`buildCspDirective` は従来互換の出力を返す（後方互換・単体テスト容易性）。詳細分岐は Phase 2。 |
| FR-09 | CSP の mode（`report-only` / `enforce`）・`buildSecurityHeaders` が出力する他ヘッダ（Permissions-Policy / Referrer-Policy / X-Content-Type-Options / X-Frame-Options）の値は変更しない。 |

---

## 5. 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | nonce 生成は edge runtime（`runtime: "experimental-edge"`）で動作する Web Crypto API のみを用い、Node 専用 API に依存しない。 |
| NFR-02 | `apps/web` env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（task-02）。`process.env` 直接参照を新規追加しない。 |
| NFR-03 | `apps/web` から D1 binding 直接アクセスを行わない（不変条件 #5）。 |
| NFR-04 | `127.0.0.1:8888` 等のローカル限定エンドポイントを `apps/web/src` に焼き込まない（task-18 grep gate）。 |
| NFR-05 | production build は OpenNext Workers 互換のため `next build --webpack` を正本とする（Turbopack は local dev 限定）。 |
| NFR-06 | nonce 化完了後、`'unsafe-inline'` 直書きを将来不変条件として禁止し grep gate で fail 化する。 |
| NFR-07 | nonce 生成による middleware のレイテンシ増加は無視できる範囲（1 request 1 回の 16byte 乱数生成 + base64）に収める。 |

---

## 6. 受け入れ基準（AC）

| ID | 受け入れ基準 | 検証方法 |
|----|------------|---------|
| AC-01 | request 毎に一意の nonce が発行される（2 リクエスト間で nonce 値が異なる） | Playwright HTTP smoke: 2 回 GET し response CSP の `nonce-` 値が異なることを assert |
| AC-02 | response CSP の `script-src` / `style-src` に `'nonce-<value>'` が含まれる | unit: `buildCspDirective({...nonce})` 文字列 assert / Playwright: 実 response header 正規表現 match |
| AC-03 | `script-src` に `'strict-dynamic'` が含まれる | unit: 文字列 assert / Playwright: header match |
| AC-04 | `script-src` / `style-src` から `'unsafe-inline'` が削除される（`rg "'unsafe-inline'" apps/web/src` → **0 hit**） | grep gate + unit assert（`.not.toContain("'unsafe-inline'")`） |
| AC-05 | root layout が `x-nonce` を取得し独自 inline script / style に伝播する | unit / RSC レンダリング上の nonce 伝播確認（Phase 4 で具体化） |
| AC-06 | 19 routes すべてで CSP violation が 0 件（描画破壊なし） | Playwright: 各 route を `enforce` 相当で評価し console の CSP violation 0 を assert（Phase 4 で具体化） |
| AC-07 | 既存ヘッダ契約（Permissions-Policy / Referrer-Policy / X-Content-Type-Options / X-Frame-Options）が不変 | 既存 unit / smoke の既存 assert がそのまま green |
| AC-08 | `cspMode`（`report-only`）が不変 | unit: header 名が `Content-Security-Policy-Report-Only` のままであることを assert |

> 19 routes: 公開6（`/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）/ 会員2（`/login`, `/profile`）/ 管理8（`/(admin)/admin`, `members`, `tags`, `meetings`, `schema`, `requests`, `identity-conflicts`, `audit`）/ 共通3（`error.tsx`, `not-found.tsx`, `loading.tsx`）。

---

## 7. 前提条件

| 前提 | 必須/推奨 | 理由 |
|------|----------|------|
| AWSHH-FU-001 / U-AWSHH-001（CSP `report-only` → `enforce` 切替） | **推奨・必須ではない** | nonce 化は `report-only` のままでも完結可能。`report-only` でも CSP-Report-Only ヘッダに nonce 入り directive を出力でき、Playwright で値検証できる。enforce 切替を待つと nonce 化が不必要にブロックされるため独立サイクルとする。enforce 切替後に nonce 化が済んでいれば即「実効防御」になるため、nonce 化を先行させるのが順序として安全。 |
| `next build --webpack`（OpenNext 互換） | 必須 | NFR-05 と同一。Turbopack 限定パスを deploy bundle に混入させない。 |

---

## 8. 用語（ユビキタス言語）

| 用語 | 定義 |
|------|------|
| nonce | "number used once"。request 毎に発行する一意のランダム文字列。CSP の `script-src 'nonce-xxx'` に記載し、同じ値を持つ `<script nonce="xxx">` だけ実行を許可する。攻撃者は発行値を事前に知り得ないため inline 注入が無効化される。 |
| strict-dynamic | CSP Level 3 のキーワード。nonce / hash で信頼された script が動的に読み込む子 script へ信頼を伝播させ、ホスト allowlist を無視させる。App Router の動的 chunk 読み込みを壊さず nonce 単独運用を成立させるために必須。 |
| CSP3 (CSP Level 3) | Content-Security-Policy Level 3。`'strict-dynamic'` / nonce 伝播を規定する仕様。本サイクルが準拠する世代。 |
| `'unsafe-inline'` | inline script / style を無条件許可する CSP キーワード。nonce / hash と併用するとモダンブラウザ（CSP3 対応）はこれを無視する。本サイクルで削除対象。 |
| request header CSP | Next.js が「response に出す CSP に nonce が含まれているか」を判定し bootstrap script へ nonce を自動付与するための、middleware が downstream へ転送する request side の CSP ヘッダ。ブラウザ用ではない。 |
