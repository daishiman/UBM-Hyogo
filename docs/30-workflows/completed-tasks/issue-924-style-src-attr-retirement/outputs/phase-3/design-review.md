# Phase 3: 設計レビュー — issue-924 style-src-attr 撤去

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL]`

---

## 1. 観点別レビュー

### 1.1 CSP 仕様適合

| 観点 | 評価 | コメント |
|------|------|--------|
| `style-src-attr` omit 時の fallback | OK | CSP3 仕様で `style-src-attr` 未指定時は `style-src` にフォールバック。`style-src` は nonce 単独のため属性 style は禁止扱いとなり、目的成立。 |
| nonce 仕様不変条件 | OK | `script-src` / `style-src` / `style-src-elem` の出力ロジック・middleware の nonce 生成は変更しない。issue #871 の不変条件を保持。 |
| `report-only` mode 維持 | OK | mode 切替は別 followup スコープ。 |

### 1.2 UX / visual regression

| 観点 | 評価 | コメント |
|------|------|--------|
| Avatar の hue 12 段階量子化 | 条件付き OK | 30 deg 差は視認上識別可能。同一 hue 衝突は seed 数 × 12 = 衝突確率 1/12。組織規模を考慮し許容判定。色覚多様性は OKLch tokens の hue 配置に整合させて緩和。 |
| Icon の data-size 標準化 | OK | 既存 design system 5 段階 (16/20/24/32/40) に揃える。非標準 size は Phase 5 で棚卸し、最寄り標準値に丸めるか専用ルール追加。 |
| ZoneDistribution SVG 化 | 条件付き OK | pixel-perfect 再現は SVG / linear-gradient で異なる場合がある（補間方式・端処理）。許容 tolerance 内に収まるかは Phase 11 visual baseline 確認で判定。 |

### 1.3 代替案検討

| 代替案 | 検討結果 | 不採用理由 |
|--------|---------|---------|
| **A. inline style 保持 + `style-src-attr 'unsafe-hashes'` 化** | 不採用 | hash 列挙が動的 hue/size/percentage で爆発。属性 style 全文の hash が必要なため動的値完全列挙不可能。 |
| **B. inline style 保持 + nonce 属性化（`<element style="..." nonce="...">`）** | 不採用 | CSP3 仕様で `nonce` は `script` / `style` element と HTTP header 用。属性 style に対する nonce 検証は仕様外。 |
| **C. CSS-in-JS（styled-components / emotion）導入** | 不採用 | nonce 化は可能だが、library 追加 + Cloudflare Workers bundle size 増 + #871 が分離した過渡境界の趣旨と乖離。 |
| **D. CSS Module 専用拡張 + Tailwind utility 併用（採用）** | 採用 | 既存 token システムと整合。Cloudflare Workers bundle に余計なランタイム不要。Avatar/Icon の動的ケースも CSS rule で吸収可能。 |
| **E. ZoneDistribution の inline gradient を `<style nonce>` 注入で対応** | 不採用 | `<style>` 要素なら nonce 適用可能だが、percentage が re-render 毎に変動する component で `<style>` 動的生成は冗長。SVG が自然。 |

### 1.4 grep gate

| 観点 | 評価 | コメント |
|------|------|--------|
| `rg "style={{"` の誤検出 | OK | コメント内 / 文字列リテラル内の `style={{` は通常存在しない。Phase 5 でリスト化し例外 allowlist は導入しない方針。 |
| smoke/harness ファイルへの適用 | OK | `__smoke__` / `visual-harness` も production と同じ CSP で配信されるため除外しない。 |
| OG 画像（`ImageResponse`）の除外 | OK | PNG として配信され HTML を経由しないため CSP 評価対象外。grep gate も `apps/web/app/opengraph-image.tsx` 系を含めて検出するが、当該ファイルに `style={{` は元々無い（`ImageResponse` の style prop は React-DOM とは別 API）。 |

---

## 2. テスト戦略の妥当性

| 観点 | 評価 | コメント |
|------|------|--------|
| unit `not.toContain('style-src-attr')` | OK | `buildCspDirective` 出力文字列を assert すれば仕様達成判定可能。 |
| Playwright smoke の実 response 検証 | OK | response header の規制名（`Content-Security-Policy-Report-Only`）を `cspMode` 不変条件に従って parse する。 |
| visual baseline 退行確認 | OK | 既存 Playwright visual spec を再実行し pixel diff ≤ tolerance で AC-5 / AC-6 を保証。Avatar / ZoneDistribution / Icon は新規 baseline 更新が必要になる可能性あり（Phase 11 で判断）。 |

---

## 3. 残課題・前提整理

| 項目 | 状態 |
|------|------|
| Avatar の 12 bucket 色値の OKLch 化 | Phase 5 で `tokens.css` に追記 |
| Icon の非標準 size 棚卸し | Phase 5 で `rg "<Icon\s.*size="` を実行 |
| ZoneDistribution の `<rect>` width / x 累積計算 | Phase 5 で `segments.reduce` ロジック明示 |
| smoke/harness の `style={{` 撤去後の seam testing | Phase 4 のテスト計画で再確認 |

---

## 4. 判定

| 条件 | Verdict |
|------|---------|
| 矛盾なし | PASS — `style-src-attr` 撤去と nonce 仕様不変が両立 |
| 漏れなし | PASS — 17 ファイル + security-headers.ts + tests + grep gate を網羅 |
| 整合性あり | PASS — `tokens.css` 正本 / `data-*` 属性パターン既存と整合 |
| 依存関係整合 | PASS — issue #871 nonce 化マージ済みを前提に followup として完結 |

**設計レビュー合格 — Phase 4 へ進む。**
