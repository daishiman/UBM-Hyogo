# Phase 2 — 設計

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 2.1 既存コンポーネント再利用可否（FB-SDK-07-1）

| 既存 | 再利用 | 備考 |
| --- | --- | --- |
| `buildHtml(title, subtitle)` | ✅ 拡張 | 引数 signature は維持（後方互換）。内部の inline style を `og-tokens.ts` 由来へ置換 |
| `tagLine(summary)` | ✅ 不変 | subtitle 生成ロジック。フォールバック "UBM Hyogo member" 維持 |
| `escapeHtml` | ✅ 不変 | XSS/HTML 破壊防止 |
| `renderMemberOg` / `renderDefaultOg` / `imageResponse` / `renderStaticFallbackOg` | ✅ 不変 | 呼び出し経路・fallback 分岐は変更しない |
| `loadGoogleFont` 2 weight 取得 | ✅ 不変 | font は runtime fetch 維持（bundle しない＝AC-5） |

→ 新規 UI primitive は作らない。色 / レイアウト定数の正本化と `buildHtml` 内部の magic value 除去のみ。

## 2.2 整合方式の決定（依存・責務境界）

`apps/og` は `apps/web` とは別 Worker・別 build。`tokens.css` を実行時に読めない。Satori（`workers-og` の HTML→画像エンジン）は:

- CSS custom property（`var(--x)`）を解決しない
- `oklch()` 色関数を解釈しない（sRGB hex / rgb / 名前付き色のみ）

したがって OG は **`tokens.css` の確定 hex を複製した静的定数**を持つ。正本との一致は build/test 時に保証する。

| レイヤ | 役割 | 正本 |
| --- | --- | --- |
| `apps/web/src/styles/tokens.css` | デザイントークンの**単一正本（SSOT）** | 変更しない |
| `apps/og/src/og-tokens.ts` | tokens.css 確定 hex の**派生コピー**（出典コメント付き） | 本タスクで新規 |
| `apps/og/src/__tests__/og-tokens.spec.ts` | コピーと正本の**一致を機械検証**（ドリフトガード） | 本タスクで新規 |

> これにより OG Worker の独立性（実行時 import なし）と正本整合（test ガード）を両立する。強化ループ: tokens.css 変更 → og-tokens.spec.ts fail → OG 側更新を強制。

## 2.3 色マッピング（tokens.css → OG_BRAND）

`apps/web/src/styles/tokens.css` の確定 hex を出典に複製する。

| OG key | 役割 | tokens.css 出典 | hex |
| --- | --- | --- | --- |
| `surface` | 外側背景 | `:root --ubm-color-surface-bg` | `#f5f4f1` |
| `panel` | 内側カード背景 | `:root --ubm-color-surface-panel` | `#ffffff` |
| `ink` | タイトル文字 | `:root --ubm-color-text-primary` | `#1a1917` |
| `body` | サブタイトル文字 | `:root --ubm-color-text-secondary` | `#57554e` |
| `muted` | eyebrow/footer 文字 | `:root --ubm-color-text-muted` | `#8a877e` |
| `line` | カード境界線 | `:root --ubm-color-border-default` | `#e7e5df` |
| `accent` | ブランドドット / eyebrow | `@supports not (color: oklch) --ubm-color-accent`（sRGB フォールバック = OKLch `oklch(0.52 0.10 55)` の正本 sRGB） | `#b08049` |
| `accentInk` | 強調アクセント文字 | `@supports … --ubm-color-accent-ink` | `#6f4f25` |
| `accentSoft` | アクセント chip 背景 | `@supports … --ubm-color-accent-soft` | `#f3ece1` |

> 設計判断: text/surface/border は `:root` が plain hex のため `:root` を出典とする。accent 系は `:root` が `oklch()` のため Satori 非対応 → `@supports not (color: oklch)` フォールバック block の sRGB hex を出典とする（これが OKLch 値の正本 sRGB 表現）。この出典差は `og-tokens.ts` のコメントと `og-tokens.spec.ts` のパース対象（`:root` か `@supports` か）に明記する。

### `apps/og/src/og-tokens.ts`（新規）構造

```ts
/**
 * OG Worker 用デザイントークン（派生コピー）。
 * 正本: apps/web/src/styles/tokens.css
 * - text/surface/border: :root の plain hex
 * - accent 系: `@supports not (color: oklch(0% 0 0))` フォールバック block の sRGB hex
 *   （Satori は oklch()/var() を解釈しないため hex を複製する）
 * 一致は apps/og/src/__tests__/og-tokens.spec.ts が tokens.css を fs パースして検証する。
 */
export const OG_BRAND = {
  surface: "#f5f4f1",     // --ubm-color-surface-bg (:root)
  panel: "#ffffff",       // --ubm-color-surface-panel (:root)
  ink: "#1a1917",         // --ubm-color-text-primary (:root)
  body: "#57554e",        // --ubm-color-text-secondary (:root)
  muted: "#8a877e",       // --ubm-color-text-muted (:root)
  line: "#e7e5df",        // --ubm-color-border-default (:root)
  accent: "#b08049",      // --ubm-color-accent (@supports sRGB)
  accentInk: "#6f4f25",   // --ubm-color-accent-ink (@supports sRGB)
  accentSoft: "#f3ece1",  // --ubm-color-accent-soft (@supports sRGB)
} as const;

export const OG_TYPO = {
  fontFamily: "Noto Sans JP",
  eyebrowTracking: "0.12em", // --ubm-eyebrow-tracking
  titleMaxFontPx: 76,
  titleMinFontPx: 54,
  titleShrinkThreshold: 14,  // 表示文字数 > 14 で段階縮小（長い日本語氏名対策）
  subtitleFontPx: 32,
  eyebrowFontPx: 28,
  footerFontPx: 24,
} as const;

export const OG_LAYOUT = {
  width: 1200,
  height: 630,
  outerPadPx: 64,
  cardPadPx: 56,
  cardRadiusPx: 36,   // OG canvas 用（--ubm-radius-2xl 28px を大画面向けに拡大した OG 固有値）
  cardBorderPx: 2,
  dotPx: 18,
  stackGapPx: 28,
} as const;

/** 表示文字数に応じてタイトル font-size(px) を返す（名あり/なし両ケースの視認性確保 = AC-3）。 */
export function titleFontSize(title: string): number {
  const len = [...title].length; // code point 単位（日本語 1 文字 = 1）
  if (len <= OG_TYPO.titleShrinkThreshold) return OG_TYPO.titleMaxFontPx;
  if (len <= OG_TYPO.titleShrinkThreshold * 2) return 64;
  return OG_TYPO.titleMinFontPx;
}
```

> `titleFontSize` の戻り値は離散（76 / 64 / 54）で決定論的。テスト容易性のため `[...title].length`（code point）で計測（サロゲートペア安全）。

## 2.4 `render.tsx` 改修設計（レイアウト・タイポグラフィ）

`BRAND` 定数を削除し `OG_BRAND` / `OG_TYPO` / `OG_LAYOUT` / `titleFontSize` を import。`buildHtml` を以下構造へ整理（Satori が解釈する flex inline style を維持）。

| 領域 | 設計 |
| --- | --- |
| 外枠 | `background: OG_BRAND.surface`、`padding: OG_LAYOUT.outerPadPx`、font-family `OG_TYPO.fontFamily` |
| カード | `background: OG_BRAND.panel`、`border: {cardBorderPx}px solid OG_BRAND.line`、`border-radius: cardRadiusPx`、`padding: cardPadPx`、縦 space-between |
| eyebrow | accent dot（`dotPx` 円・`OG_BRAND.accent`）+ "UBM Hyogo" 語標。`color: OG_BRAND.accentInk`、`font-size: eyebrowFontPx`、`font-weight:700`、`letter-spacing: eyebrowTracking` |
| title | `font-size: titleFontSize(title)`、`color: OG_BRAND.ink`、`font-weight:800`、`line-height:1.05` |
| subtitle | `font-size: subtitleFontPx`、`color: OG_BRAND.body`、`line-height:1.4` |
| footer | "Member Directory"。`color: OG_BRAND.muted`、`font-size: footerFontPx`、`letter-spacing: eyebrowTracking` |

> HEX 直書きは `og-tokens.ts` の `OG_BRAND` に一元化し、`render.tsx` 本文から literal hex を排除する（`render-html.spec.ts` で青系 hex 不在を assert）。`buildHtml` の引数 signature（`title`, `subtitle`）は不変＝既存呼び出し全互換。

## 2.5 名あり/なし視認性設計（AC-3）

| ケース | title | subtitle | 視認性保証 |
| --- | --- | --- | --- |
| default OG（member なし） | "UBM 兵庫支部会" | "メンバーディレクトリと活動紹介" | `titleFontSize("UBM 兵庫支部会")=76`（短い） |
| member（occupation 等あり） | `fullName` | `tagLine`（"Engineer / 1_to_10 / regular" 等） | 長い氏名は `titleFontSize` が縮小 |
| member（フィールド欠落） | `fullName` | `tagLine` フォールバック "UBM Hyogo member" | subtitle 非空保証（`tagLine` が常に非空文字列を返す既存仕様） |

`renderMemberOg` / `renderDefaultOg` の呼び出し経路は不変。視認性は `buildHtml` の階層 + 適応サイズで吸収。

## 2.6 ドリフトガード test 設計（`og-tokens.spec.ts`）

| 検証 | 方法 |
| --- | --- |
| accent 系一致 | `tokens.css` の `@supports not (color: oklch(0% 0 0))` block を正規表現抽出し `--ubm-color-accent` / `-ink` / `-soft` の hex を取得 → `OG_BRAND.accent` / `accentInk` / `accentSoft` と `toBe` |
| text/surface/border 一致 | `tokens.css` 先頭 `:root { … }` block から `--ubm-color-surface-bg` / `-panel` / `-text-primary` / `-text-secondary` / `-text-muted` / `-border-default` の hex を取得 → 対応 `OG_BRAND` と `toBe` |
| パスの堅牢性 | test から `apps/web/src/styles/tokens.css` への相対解決を `new URL`/`path.resolve` で固定。存在しない場合は明示 fail |
| `titleFontSize` 境界 | 14 文字以下 →76、15〜28 →64、29 文字以上 →54 を境界値で assert（`// length: N` コメント付き / FB-W0-RV-001） |

> このガードにより tokens.css のブランド hex が将来変わった場合、OG 側未追従が CI（`apps/og` の vitest）で fail する＝整合の継続性が運用面で閉じる（4 条件「運用性」）。

## 2.7 因果ループ・状態所有権

- **強化ループ**: tokens.css 変更 → `og-tokens.spec.ts` fail → OG_BRAND 更新 → 整合回復。
- **バランスループ**: OG レイアウト magic value 追加の誘惑 → `OG_LAYOUT` / `OG_TYPO` への一元化規約 → render.tsx 本文の literal 増加を抑制。
- **状態所有権**: 色/レイアウト/タイポの値所有権は `og-tokens.ts`。render.tsx は **消費のみ**（値を持たない）。正本所有権は `tokens.css`。3 者の所有権が分離し混在しない。

## 2.8 不変条件チェック

| 不変条件 | 判定 | 根拠 |
| --- | --- | --- |
| #1 既存 API のみ | PASS | OG endpoint surface・member fetch 経路不変 |
| #2 OKLch トークン正本（apps/web の HEX 直書き禁止） | PASS | 本タスクの hex は `apps/og`（Satori 制約）に閉じる。`verify-design-tokens` は apps/og 非対象。og-tokens は正本 hex の派生で test ガード付き |
| #5 D1 直接アクセス禁止 | PASS | `apps/og` は D1 binding を持たない |
| #6 GAS prototype 非昇格 | PASS | 無関係 |
| design-token gate（task-18 `verify-design-tokens`） | 非抵触 | scan 対象は `apps/web` のみ |
| OG size gate（`og-cd.yml`） | 不変 | font 非 bundle 維持・定数のみ変更で bundle 重量影響なし |
