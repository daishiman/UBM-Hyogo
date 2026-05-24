# Phase 3: 設計レビュー — issue-871 CSP nonce 化

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=NON_VISUAL]`

> Phase 2 設計のセルフレビュー。リスク評価・代替案棄却理由・不変条件整合・可用性確認方針・SRP 観点をレビューし、GO 判定を出す。

---

## 1. リスク 4 項目の評価と対策

| ID | リスク | 影響度 | 対策（Phase 2 設計のどこで担保するか） | 残リスク |
|----|--------|--------|----------------------------------------|----------|
| R-① | Next.js 自前 bootstrap inline script に nonce が伝播せず、`'unsafe-inline'` 削除後に hydration script がブロックされ全画面が壊れる | 高 | Phase 2 §2 / §4: **request header に nonce 入り CSP をセット**する公式手順を厳守。Next.js はこれを検知し bootstrap script へ nonce を自動付与する。AC-06（19 routes violation 0）で実測検証 | 低（公式パターン） |
| R-② | Cloudflare Workers edge / OpenNext で `await headers()` が `x-nonce` を取得できない | 中 | Phase 2 §8: OpenNext build + HTTP smoke で取得可否を実測。取得不可なら request context 経由へフォールバック。なお Next.js 自動付与は request header CSP 経由で成立するため、layout の `headers()` 取得が失敗しても bootstrap script の nonce 付与自体は壊れない | 低 |
| R-③ | inline `style=` 属性の棚卸し漏れで一部画面が `style-src 'unsafe-inline'` 削除後に violation を出す | 中 | Phase 1 で `grep -rc 'style={{'` → 12 ファイル 16 箇所を棚卸し済み。Phase 2 §6 で静的=class化 / 動的=CSS変数バインドの方針確定。AC-06 で 19 routes 実測 | 中（動的値の CSS 変数化が全件対応必要。Phase 4/5 でファイル単位展開） |
| R-④ | `'strict-dynamic'` 配下で第三者 script（外部 CDN / 解析タグ等）が nonce/伝播を持たず不動作 | 中 | Phase 4 で第三者 script 棚卸しを行う。現状 `apps/web/src` の `<script>` / `next/script` 本番利用は要確認（Phase 1 grep ではテストファイルのみ hit）。`'strict-dynamic'` は nonce script が読み込む子 script に信頼伝播するため、`next/script` 経由なら nonce 付与で動作。直書き外部 `<script>` があれば nonce 付与へ移行 | 低〜中 |

---

## 2. 代替案検討と棄却理由

| 代替案 | 内容 | 棄却理由 |
|--------|------|---------|
| **A. `'strict-dynamic'` なし（nonce 単独）** | `script-src 'self' 'nonce-x'` のみ | App Router の動的 chunk 注入が nonce 無しでブロックされ、ナビゲーション/部分 hydration が壊れる（Phase 2 §7）。元 issue 前提だが実態に不適合のため上書き |
| **B. `style-src` を `'unsafe-inline'` 据置** | script だけ nonce 化し style はそのまま | `'unsafe-inline'` を 1 つでも残すと AC-04（0 hit）未達。style 経由の CSS exfiltration / data-uri 系攻撃面も残る。CONST_007（先送り禁止・1 サイクル完結）違反。よって style も同サイクルで nonce 化 |
| **C. hash ベース CSP（nonce なし）** | inline script/style を sha256 hash で許可 | App Router は request 毎に動的 chunk が変わり hash 列挙が非現実的。SPA 的動的注入に不適。nonce + strict-dynamic が App Router の正解 |
| **D. `style-src-attr 'unsafe-inline'` で属性インラインを温存** | 属性だけ別 directive で許可 | `'unsafe-inline'` 文言が残り AC-04 と grep gate に抵触。属性インラインの攻撃面も残す。よって class/CSS 変数化で属性自体を撤廃する方針を優先 |

---

## 3. 不変条件との整合チェック

| 不変条件 | 整合判定 | 根拠 |
|----------|---------|------|
| `getEnv()` / `getPublicEnv()` 経由のみ（process.env 直接禁止） | ✅ | nonce 生成は env を参照しない（crypto のみ）。`buildSecurityHeaderConfig()` は既存どおり `getPublicEnv()` 経由。新規 process.env 参照を増やさない（middleware 既存の `authSecret` は本サイクル対象外・不変） |
| D1 直接アクセス禁止 | ✅ | nonce 化は D1 を一切触らない |
| `next build --webpack` 正本 | ✅ | 設計に Turbopack 限定パスを混入させない。OpenNext build で headers() を検証（§8） |
| cspMode（report-only）不変 | ✅ | `buildSecurityHeaderConfig()` の `cspMode: "report-only"` を変更しない。header 名は `Content-Security-Policy-Report-Only` のまま（AC-08） |
| `127.0.0.1:8888` 焼き込み禁止 | ✅ | nonce 化で新規ローカルエンドポイント追加なし |
| `'unsafe-inline'` 将来禁止 grep gate | ✅ | NFR-06 / 変更ファイル一覧に grep gate 追加を明記 |
| admin form input は FormField 経由（#9） | 影響なし | 本サイクルは form input を増やさない。inline style リファクタは既存コンポーネント内部のスタイル移設のみ |

---

## 4. edge runtime での crypto / headers() 可用性確認方針

| API | 可用性 | 確認方法 |
|-----|--------|---------|
| `crypto.getRandomValues` | Cloudflare Workers / edge runtime で標準提供（Web Crypto） | Phase 6 unit で `generateNonce()` が非空文字列を返すこと、Phase 7 統合で 2 回呼び出し結果が異なることを確認 |
| `btoa` | Workers で利用可 | 同上 unit で例外なく実行されること |
| `await headers()`（next/headers, RSC） | Next.js 16 で async。OpenNext での RSC 動作は実測必須 | Phase 8 `next build --webpack` 成功 + Phase 11 相当 HTTP smoke で response CSP に nonce が乗ることを確認。layout の取得失敗時は §R-② フォールバック |
| `NextResponse.next({ request: { headers } })` | 公式 API | Playwright smoke で `x-nonce` 転送と response CSP nonce を間接確認 |

---

## 5. SRP 観点（security-headers.ts を SSOT に保つ）

- **CSP directive 文字列の構築責務は `security-headers.ts` の `buildCspDirective` に一本化**する。middleware は「nonce を生成して cfg に渡す」「request/response に注入する」配送責務のみを持ち、directive 文字列を自前で組み立てない（SSOT 維持）。
- nonce 生成（`generateNonce`）は middleware の関心事（request ライフサイクル単位）であり security-headers.ts には置かない。security-headers.ts は「与えられた nonce を directive に埋める」純関数性を保つ → テスト容易（入力 cfg → 出力 string）。
- layout は「`x-nonce` 取得 → 独自 inline へ伝播」の表示責務のみ。CSP 文字列を知らない。
- 結論: 責務分離は維持され、SSOT は `buildCspDirective` 一箇所。

---

## 6. レビュー指摘と解消

| # | 指摘 | 解消 |
|---|------|------|
| 1 | Phase 2 §3.2 初稿で「後方互換分岐に `'unsafe-inline'` を残す」と書いたが AC-04（0 hit）と矛盾 | Phase 2 §3.2 / §9 で確定: nonce 未指定時は `script-src 'self'` / `style-src 'self'`（inline 不許可・`'unsafe-inline'` 含まない）に倒す。矛盾解消済み |
| 2 | layout で nonce を取得しても現状 inline が無く「未使用変数」になり lint fail し得る | Phase 2 §5 / Phase 4 で対応決定（`void nonce` ではなく実伝播口確保、または取得を将来導入時点まで遅延）。**レビュー判断: 現状 inline 0 件なら layout の nonce 取得は必須でない（Next.js 自動付与は request header CSP 経由で成立）。最小変更として layout 変更を「将来の伝播口確保」目的に留め、未使用 lint を避けるなら本サイクルでは layout を変更しない選択も可**。Phase 5 実装計画で最終決定 |
| 3 | inline `style=` 動的値の CSS 変数化が全件必要で工数増 | Phase 4 test-plan / Phase 5 implementation-plan でファイル単位に展開。AC-06 の 19 routes violation 0 を満たす最小集合に絞る（report-only のため段階対応も可だが本サイクルで完了させる方針＝CONST_007） |
| 4 | 第三者 script の有無が Phase 1 で未確定（grep はテストのみ hit） | Phase 4 で本番 `<script>`/`next/script` 棚卸しを必須タスク化（R-④） |

---

## 7. 設計 GO 判定

| 判定軸 | 結果 |
|--------|------|
| 機能要件 FR-01..09 を設計が満たす | ✅ |
| 受け入れ基準 AC-01..08 の検証経路が定義済み | ✅（AC-05/06 は Phase 4 で具体化） |
| 不変条件すべて整合 | ✅ |
| リスク 4 項目に対策あり | ✅（R-③ のファイル単位展開を Phase 4/5 へ委譲） |
| SRP / SSOT 維持 | ✅ |
| 公式 Next.js CSP パターン準拠 | ✅ |

**判定: GO**。Phase 4（テスト計画）へ進む。残課題は以下を後続 Phase で確定する:
- inline `style=` 16 箇所のファイル単位リファクタ計画（Phase 5）
- 本番第三者 script 棚卸し（Phase 4 / R-④）
- layout の nonce 取得を本サイクルで行うか否かの最終決定（Phase 5・指摘#2）
- OpenNext build での `await headers()` 実動作確認（Phase 8 / Phase 11）
