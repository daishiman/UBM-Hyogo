# Phase 4 — テスト作成（TDD Red 設計）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 4.1 方針

Phase 2 設計（`OG_BRAND` / `OG_TYPO` / `OG_LAYOUT` / `titleFontSize`）に対する **TDD Red** を先に書く。
実装（Phase 5）前にテストを用意し、失敗（Red）→ 実装 → Green の順で進める。本フェーズは本 wave で実装・Green化済み。

### 命名規則の事前整合（FB-01）

- 新規テストは **`*.spec.ts` のみ**（不変条件 #8。`*.test.ts` は lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix` が reject）。
- import 対象の identifier は Phase 2 と完全一致させる: `OG_BRAND` / `OG_TYPO` / `OG_LAYOUT` / `titleFontSize` / `buildHtml` / `tagLine` / `escapeHtml` / `renderMemberOg` / `renderDefaultOg`。
- `og-tokens.ts` の export はすべて `apps/og/src/og-tokens.ts` から、`render.tsx` の export はすべて `apps/og/src/render.tsx` から import する。

## 4.2 対象テストファイル

| ファイル | 区分 | 担当 AC |
| --- | --- | --- |
| `apps/og/src/__tests__/og-tokens.spec.ts` | 新規 | AC-1（正本 hex 一致 / ドリフトガード）, AC-3（`titleFontSize` 境界） |
| `apps/og/src/__tests__/render-html.spec.ts` | 編集 | AC-1（青系 hex 不在 / 正本 hex 含有）, AC-2（構造）, AC-3（名あり/なし視認性） |
| `apps/og/src/__tests__/render-smoke.spec.ts` | 編集 | AC-4（PNG 応答デグレ防止） |

## 4.3 `og-tokens.spec.ts`（新規）

### tokens.css のパス解決方針

- test ファイル（`apps/og/src/__tests__/og-tokens.spec.ts`）からの相対で正本を解決する。
  正本 = `apps/web/src/styles/tokens.css`。
- 解決は `node:path` の `path.resolve(__dirname, "../../../../apps/web/src/styles/tokens.css")` か、`new URL("../../../../apps/web/src/styles/tokens.css", import.meta.url)` を使用（vitest 設定に合わせいずれか）。
- `node:fs` の `readFileSync(cssPath, "utf8")` で読込。**ファイル不在時は明示的に `throw`（テストを fail させる）** し、`existsSync` で先に確認して `expect(existsSync(cssPath)).toBe(true)` を 1 ケース置く（パスずれを検出）。
- CSS パースは正規表現で行い、外部依存（PostCSS 等）を増やさない。

### 抽出ヘルパ（テスト内ローカル関数）

```text
// :root block の最初の { ... } を抽出
extractRootBlock(css): string        // /:root\s*\{([\s\S]*?)\}/ の捕捉群
// @supports not (color: oklch(0% 0 0)) block 内の :root { ... } を抽出
extractSupportsRootBlock(css): string // /@supports not \(color: oklch\(0% 0 0\)\)\s*\{[\s\S]*?:root\s*\{([\s\S]*?)\}/ の捕捉群
// block 文字列から指定カスタムプロパティの hex を取得
readHex(block, prop): string         // new RegExp(`--${prop}:\\s*(#[0-9a-fA-F]{3,8})`) の捕捉群
```

> 設計判断（Phase 2 §2.3 整合）: text/surface/border は `:root` が plain hex なので `extractRootBlock` を出典にする。accent 系は `:root` が `oklch()` のため、Satori 非対応 → `@supports not (color: oklch(0% 0 0))` フォールバック block（tokens.css:163-167）の sRGB hex を出典にする。

### テストケース（TC-OGT）

| TC | describe / it | 検証 | 期待値 |
| --- | --- | --- | --- |
| TC-OGT-01 | tokens.css パス解決 / "resolves canonical tokens.css path" | `existsSync(cssPath)` | `toBe(true)`（不在なら明示 fail） |
| TC-OGT-02 | (a) accent 系一致 / "matches accent hex from @supports fallback block" | `@supports` block から `--ubm-color-accent` 抽出 → `OG_BRAND.accent` | `toBe("#b08049")` |
| TC-OGT-03 | (a) accent 系一致 / "matches accent-ink hex" | 同 block の `--ubm-color-accent-ink` → `OG_BRAND.accentInk` | `toBe("#6f4f25")` |
| TC-OGT-04 | (a) accent 系一致 / "matches accent-soft hex" | 同 block の `--ubm-color-accent-soft` → `OG_BRAND.accentSoft` | `toBe("#f3ece1")` |
| TC-OGT-05 | (b) surface/text/border 一致 / "matches surface-bg" | `:root` の `--ubm-color-surface-bg` → `OG_BRAND.surface` | `toBe("#f5f4f1")` |
| TC-OGT-06 | (b) / "matches surface-panel" | `:root` `--ubm-color-surface-panel` → `OG_BRAND.panel` | `toBe("#ffffff")` |
| TC-OGT-07 | (b) / "matches text-primary" | `:root` `--ubm-color-text-primary` → `OG_BRAND.ink` | `toBe("#1a1917")` |
| TC-OGT-08 | (b) / "matches text-secondary" | `:root` `--ubm-color-text-secondary` → `OG_BRAND.body` | `toBe("#57554e")` |
| TC-OGT-09 | (b) / "matches text-muted" | `:root` `--ubm-color-text-muted` → `OG_BRAND.muted` | `toBe("#8a877e")` |
| TC-OGT-10 | (b) / "matches border-default" | `:root` `--ubm-color-border-default` → `OG_BRAND.line` | `toBe("#e7e5df")` |
| TC-OGT-11 | (c) `titleFontSize` 下限境界 / "returns max size for short title" | `titleFontSize("X".repeat(14))` `// length: 14` | `toBe(76)` |
| TC-OGT-12 | (c) / "returns max size at boundary 14" | `titleFontSize("UBM 兵庫支部会")` `// length: 8` | `toBe(76)` |
| TC-OGT-13 | (c) / "returns mid size for 15 chars" | `titleFontSize("X".repeat(15))` `// length: 15` | `toBe(64)` |
| TC-OGT-14 | (c) / "returns mid size at boundary 28" | `titleFontSize("X".repeat(28))` `// length: 28` | `toBe(64)` |
| TC-OGT-15 | (c) / "returns min size for long title" | `titleFontSize("X".repeat(29))` `// length: 29` | `toBe(54)` |
| TC-OGT-16 | (c) / "counts code points for surrogate pairs" | `titleFontSize("𠮷".repeat(14))` `// length: 14（サロゲートペアでも 14 code point）` | `toBe(76)` |

> 境界の表現は Phase 2 §2.3 / §2.6 に厳密一致: `len <= 14 → 76` / `len <= 28 → 64` / それ以外 `→ 54`。各境界値テストに `// length: N` コメントを付ける（FB-W0-RV-001）。

## 4.4 `render-html.spec.ts`（編集）

既存の `escapeHtml` / `tagLine` describe ブロックは **そのまま維持**（非回帰）。`buildHtml` describe を拡充する。

### import 追加

```text
import { buildHtml, escapeHtml, tagLine } from "../render";
import { OG_BRAND } from "../og-tokens";
```

### テストケース（TC-HTML）

| TC | describe / it | 検証 | 期待 |
| --- | --- | --- | --- |
| TC-HTML-01 | escapeHtml / 既存 2 ケース | （現状維持） | 不変 |
| TC-HTML-02 | tagLine / 既存 3 ケース（join / trim / フォールバック "UBM Hyogo member"） | （現状維持） | 不変 |
| TC-HTML-03 | buildHtml / "embeds escaped title and subtitle and fixed OG dimensions"（既存拡張） | `width:1200px;height:630px` 含む / `&lt;Title&gt; &amp; co` 含む / `&quot;Sub&quot;` 含む / `Member Directory` 含む / `<Title>` 非含有 | 既存維持 |
| TC-HTML-04 | buildHtml / "uses canonical brand hex from OG_BRAND" | `html` が `OG_BRAND.surface`(=`#f5f4f1`) / `OG_BRAND.accent`(=`#b08049`) / `OG_BRAND.ink`(=`#1a1917`) を含む | `toContain` で各々 true |
| TC-HTML-05 | buildHtml / "does not contain legacy blue ad-hoc hex" | 旧青系 hex を含まない: `#0068a9` / `#172033` / `#526070` / `#f8fafc` / `#c9d6e2` | `expect(html).not.toContain(<each>)` |
| TC-HTML-06 | buildHtml / "renders default OG title and subtitle"（AC-3 default） | `buildHtml("UBM 兵庫支部会", "メンバーディレクトリと活動紹介")` が両文字列を含む | `toContain` 両方 true |
| TC-HTML-07 | buildHtml / "renders member OG with occupation subtitle"（AC-3 member 有） | `buildHtml("山田 太郎", tagLine({ id:"m-1", fullName:"山田 太郎", occupation:"Engineer", ubmZone:"1_to_10", ubmMembershipType:"regular" }))` が `山田 太郎` と `Engineer / 1_to_10 / regular` を含む | `toContain` 両方 true |
| TC-HTML-08 | buildHtml / "renders member OG fallback subtitle"（AC-3 フォールバック） | `buildHtml("無名", tagLine({ id:"m-3", fullName:"無名" }))` が `UBM Hyogo member`（非空 subtitle）を含む | `toContain` true |

> TC-HTML-05 が AC-1 の青系排除の機械ガード。`OG_BRAND` を参照値の source of truth として TC-HTML-04 で正本 hex 含有を assert することで、render.tsx が `og-tokens.ts` 由来であることを担保する（literal 直書きの回帰を検出）。

## 4.5 `render-smoke.spec.ts`（編集）

既存の smoke を維持し、意匠改修後も Node/jsdom フォールバック path（`HTMLRewriter` 不在 → `renderStaticFallbackOg`）で PNG を返すことを継続検証する。

### テストケース（TC-SMOKE）

| TC | describe / it | 検証 | 期待 |
| --- | --- | --- | --- |
| TC-SMOKE-01 | render smoke / "returns PNG responses in the Node test runtime fallback path"（既存維持） | `renderDefaultOg()` / `renderMemberOg({ id:"m-1", fullName:"山田 太郎", occupation:"Engineer" })` 両方が `content-type` に `image/png` を含み、`arrayBuffer().byteLength > 0` | 既存と同一・不変 |

> smoke は意匠 hex には触れない（fallback path は 1x1 PNG を返すため）。AC-4 のデグレ防止 = 「呼び出し経路と PNG 応答契約が改修後も壊れていない」ことの保証。意匠の中身検証は render-html.spec.ts（pure 関数）が担う。

## 4.6 TDD Red 期待状態（実装前）

| ファイル | Red の理由（Phase 5 実装で解消） |
| --- | --- |
| `og-tokens.spec.ts` | `../og-tokens` モジュール未作成 → import 解決失敗で全ケース fail |
| `render-html.spec.ts` | `OG_BRAND` import 失敗 + 現 `render.tsx` が旧青系 hex（`#172033` 等）を含む → TC-HTML-04/05 fail |
| `render-smoke.spec.ts` | 既存 PASS（契約不変のため Red にならず Green 維持） |

## 4.7 Phase 4 完了条件

- 上記 3 ファイルのテストケースが Phase 2 identifier と完全整合した形で列挙されている。
- 命名規則（`*.spec.ts`）・境界コメント（`// length: N`）・青系 hex 排除リストが網羅されている。
- 実装は行わない（`implemented_local_evidence_captured`）。実装は Phase 5。
