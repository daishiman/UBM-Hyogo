`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 12 — 実装ガイド（implementation-guide）

このガイドは 2 パート構成です。Part 1 は専門知識がなくても分かるように日常の例えで説明し、
Part 2 はエンジニアが実装に着手できる技術詳細を記します。

## Part 1 — なぜ必要か・何をするか（やさしい説明）

### 背景（なぜ必要か）

OG 画像とは、SNS や LINE でこのサイトのリンクを貼ったときに、リンクの下に自動で出てくる
「サムネイル画像」のことです。会員ページのリンクを共有すると、その会員の名前と肩書きが入った
横長のカード画像が表示されます。これはサイトの「顔」として、サイトの外（SNS）で一番たくさん
人の目に触れる場所のひとつです。

### 今の問題（要約）

今このサムネ画像だけ、サイト本体とは違う色合いになっています。たとえるなら、学校の制服が
全体としては「暖かい茶系（ベージュやこげ茶）」で統一されているのに、サムネ画像の担当者だけ
うっかり「青い制服」を着て出てきてしまっている状態です。サイトを開くと暖色なのに、SNS の
サムネだけ青いと「同じサイトなの？」と違和感が出て、ブランドの印象がちぐはぐになります。

### やること

サムネ画像の色を、学校全体の制服（サイト本体の暖色トークン）にそろえます。あわせて、文字の
大きさや余白の取り方も整えて、名前が長い会員でも名前が短い会員でも、きちんと読みやすく
収まるようにします。さらに大事なのは「次にサイト本体の色を変えたとき、サムネだけ取り残されない
ように、自動で気づける仕組み（テスト）」を入れることです。これで二度と『青い制服』に戻らない
ようにします。なお、新しい字体（serif フォント）の追加は今回はやらず、将来の検討に回します。

## Part 2 — 技術詳細（エンジニア向け）

### 背景（技術）

`apps/og/src/render.tsx` の `BRAND` 定数は青系 ad-hoc（`accent:#0068a9` / `ink:#172033`
/ `surface:#f8fafc`）で、デザイン正本 `apps/web/src/styles/tokens.css` の暖色 OKLch トークン
（stone/amber 系）と乖離している。`apps/og` は独立 Worker で `tokens.css` を実行時に import できず、
Satori（`workers-og` の HTML→画像エンジン）は `oklch()` 色関数も CSS custom property（`var(--x)`）も
解釈しない。したがって OG は `tokens.css` の確定 hex を複製した静的定数を持ち、その一致を build/test
時に保証する（fs パースによるドリフトガード）。

### 型・定数（phase-2 §2.3 をそのまま引用）

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

`titleFontSize` の戻り値は離散（76 / 64 / 54）で決定論的。テスト容易性のため `[...title].length`
（code point）で計測しサロゲートペア安全とする。

### 色マッピング表（OG key → tokens.css 出典 → hex / phase-2 §2.3 から転記）

| OG key | 役割 | tokens.css 出典 | hex |
| --- | --- | --- | --- |
| `surface` | 外側背景 | `:root --ubm-color-surface-bg` | `#f5f4f1` |
| `panel` | 内側カード背景 | `:root --ubm-color-surface-panel` | `#ffffff` |
| `ink` | タイトル文字 | `:root --ubm-color-text-primary` | `#1a1917` |
| `body` | サブタイトル文字 | `:root --ubm-color-text-secondary` | `#57554e` |
| `muted` | eyebrow/footer 文字 | `:root --ubm-color-text-muted` | `#8a877e` |
| `line` | カード境界線 | `:root --ubm-color-border-default` | `#e7e5df` |
| `accent` | ブランドドット / eyebrow | `@supports not (color: oklch)` `--ubm-color-accent`（OKLch `oklch(0.52 0.10 55)` の sRGB 正本） | `#b08049` |
| `accentInk` | 強調アクセント文字 | `@supports … --ubm-color-accent-ink` | `#6f4f25` |
| `accentSoft` | アクセント chip 背景 | `@supports … --ubm-color-accent-soft` | `#f3ece1` |

> 設計判断: text/surface/border は `:root` が plain hex のため `:root` を出典とする。accent 系は
> `:root` が `oklch()` のため Satori 非対応 → `@supports not (color: oklch)` フォールバック block の
> sRGB hex を出典とする。この出典差は `og-tokens.ts` のコメントと `og-tokens.spec.ts` のパース対象
> （`:root` か `@supports` か）に明記する。

### 実装ステップ

1. **`apps/og/src/og-tokens.ts` 新規作成**: 上記の `OG_BRAND` / `OG_TYPO` / `OG_LAYOUT` /
   `titleFontSize` を出典コメント付きで定義する（値の所有権をこのファイルへ集約）。
2. **`apps/og/src/render.tsx` 改修**: 既存 `BRAND` 定数を削除し `OG_BRAND` / `OG_TYPO` /
   `OG_LAYOUT` / `titleFontSize` を import。`buildHtml` の inline style から literal hex を排除し、
   外枠＝`OG_BRAND.surface` + `OG_LAYOUT.outerPadPx`、カード＝`OG_BRAND.panel` +
   `border {cardBorderPx}px solid OG_BRAND.line` + `border-radius cardRadiusPx`、eyebrow＝accent dot
   （`dotPx` / `OG_BRAND.accent`）+ `OG_BRAND.accentInk` + `eyebrowTracking`、title＝
   `titleFontSize(title)` + `OG_BRAND.ink`、subtitle＝`subtitleFontPx` + `OG_BRAND.body`、footer＝
   `footerFontPx` + `OG_BRAND.muted` へ整理。`buildHtml(title, subtitle)` の引数 signature は不変。
3. **3 spec の整備**:
   - `og-tokens.spec.ts`（新規）= tokens.css を fs パースし `OG_BRAND` 各色の正本 hex 一致を assert、
     `titleFontSize` 境界（≤14→76 / 15..28→64 / ≥29→54）を assert。
   - `render-html.spec.ts`（編集）= `buildHtml` が `#f5f4f1` / `#b08049` 等を含み青系 `#0068a9` /
     `#172033` を含まないこと、default / member / フォールバック 3 ケースの title・subtitle、escaping 維持を assert。
   - `render-smoke.spec.ts`（編集）= default / member 両 OG が `image/png` を返す（fallback PNG path 維持）。

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/og test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/og build
bash scripts/check-worker-size.sh apps/og/dist   # Free 3MiB 上限内（AC-5）
```

### 既知制限

- Node/jsdom では Satori 実描画不可。`render.tsx` の `imageResponse` は `HTMLRewriter` 不在時に
  1×1 PNG fallback（`renderStaticFallbackOg`）へ分岐するため、意匠は描画されない（`render.tsx:62-83`
  の v8-ignore 区間）。意匠の最終確認は staging `apps/og` で行う（Phase 13 user-gated）。

### エラー / エッジケース

| ケース | 挙動 |
| --- | --- |
| 長い日本語氏名（15 文字以上） | `titleFontSize` が 64 → 54 へ段階縮小しカード内に収める |
| member フィールド欠落 | `tagLine` がフォールバック `"UBM Hyogo member"` を返し subtitle 非空を保証 |
| 氏名 / tagLine に `& < > "` を含む | `escapeHtml` で HTML エンティティ化し描画破壊・XSS を防止 |
| サロゲートペア（絵文字等）を含む氏名 | `[...title].length` の code point 計測で文字数を安全に算出 |
| tokens.css 移動・正本 hex 変更 | `og-tokens.spec.ts` が fail → OG 側追従を CI で強制（強化ループ） |

### 設定値一覧（OG_TYPO / OG_LAYOUT）

| 区分 | キー | 値 |
| --- | --- | --- |
| OG_TYPO | `fontFamily` | `"Noto Sans JP"` |
| OG_TYPO | `eyebrowTracking` | `"0.12em"` |
| OG_TYPO | `titleMaxFontPx` | `76` |
| OG_TYPO | `titleMinFontPx` | `54` |
| OG_TYPO | `titleShrinkThreshold` | `14` |
| OG_TYPO | `subtitleFontPx` | `32` |
| OG_TYPO | `eyebrowFontPx` | `28` |
| OG_TYPO | `footerFontPx` | `24` |
| OG_LAYOUT | `width` | `1200` |
| OG_LAYOUT | `height` | `630` |
| OG_LAYOUT | `outerPadPx` | `64` |
| OG_LAYOUT | `cardPadPx` | `56` |
| OG_LAYOUT | `cardRadiusPx` | `36` |
| OG_LAYOUT | `cardBorderPx` | `2` |
| OG_LAYOUT | `dotPx` | `18` |
| OG_LAYOUT | `stackGapPx` | `28` |

## 視覚証跡（VISUAL_ON_EXECUTION）

本タスクは意匠変更を伴う VISUAL タスクだが、`implemented_local_evidence_captured` 段階のため実 OG 画像 screenshot は
**pending**（staging runtime cycleで取得）。OG 画像は Cloudflare Workers ランタイムの Satori でのみ実描画され、
Node/jsdom では fallback PNG に分岐するため、意匠 screenshot は staging `apps/og` エンドポイントから
取得する。設計時証跡（plan / metadata / manual test plan）は present。

| 区分 | 参照 | 状態 |
| --- | --- | --- |
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | present |
| capture metadata | `outputs/phase-11/phase11-capture-metadata.json` | present |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` | present |
| screenshot (default og) | `outputs/phase-11/screenshots/og-default-token-aligned.png` | pending |
| screenshot (member with tagline) | `outputs/phase-11/screenshots/og-member-with-tagline.png` | pending |
| screenshot (member fallback tagline) | `outputs/phase-11/screenshots/og-member-fallback-tagline.png` | pending |
