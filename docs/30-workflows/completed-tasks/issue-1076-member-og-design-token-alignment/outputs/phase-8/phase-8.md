# Phase 8 — リファクタリング

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 8.1 リファクタリング方針

OG 意匠の値（色 / レイアウト / タイポグラフィ）の **所有権を `render.tsx` から `og-tokens.ts` へ移す**ことが本リファクタの核心。`render.tsx` は値を持たず**消費のみ**する状態へ整理し、暫定の青系 ad-hoc 配色を正本（`tokens.css`）由来の暖色 stone/amber hex へ置換する。これにより値所有権が分離し、`og-tokens.spec.ts` のドリフトガードが成立可能になる（Phase 2 §2.7 強化ループ）。

## 8.2 対象 / Before / After / 理由（FB-RT-03）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `render.tsx` 色定数 | `const BRAND = { ink:"#172033", muted:"#526070", surface:"#f8fafc", accent:"#0068a9", line:"#c9d6e2" }`（暫定の青系 ad-hoc・inline 所有） | `og-tokens.ts` の `OG_BRAND`（surface/panel/ink/body/muted/line/accent/accentInk/accentSoft）を import 参照。render.tsx 本文に hex literal を残さない | 値所有権の分離。色正本（tokens.css）との整合と、`og-tokens.spec.ts` によるドリフトガードを可能化（AC-1） |
| `render.tsx` レイアウト magic number | `buildHtml` 内 inline literal（`padding:64px` / `border-radius:36px` / `padding:56px` / `width:18px;height:18px` / `gap:28px` / `border:2px` 等） | `OG_LAYOUT`（outerPadPx / cardPadPx / cardRadiusPx / cardBorderPx / dotPx / stackGapPx / width / height）参照へ | レイアウト値の一元化。OG canvas 固有の spacing/radius 所有権を `og-tokens.ts` に集約し本文の magic 値を排除（AC-2） |
| `render.tsx` タイポグラフィ magic number | `font-size:76px`（固定）/ `font-size:34px` / `font-size:30px` / `font-size:26px` / `letter-spacing:0` / `line-height` literal | `OG_TYPO`（titleMaxFontPx / titleMinFontPx / titleShrinkThreshold / subtitleFontPx / eyebrowFontPx / footerFontPx / eyebrowTracking）+ `titleFontSize(title)` 適応サイズ参照 | タイポ階層の一元化と、名あり/なし両ケースの視認性確保（AC-3）。固定 76px を表示文字数適応サイズへ |
| `BRAND.accent` 単一青系の二重用途 | eyebrow テキスト色とドット色が同一 `#0068a9` を直接共有 | eyebrow テキストは `OG_BRAND.accentInk`（`#6f4f25`）、ドットは `OG_BRAND.accent`（`#b08049`）に役割分離 | 配色の意味的分離（強調文字 / ブランドドット）と暖色トークン整合 |
| `FONT_FAMILY` literal | `render.tsx` のローカル定数 | `OG_TYPO.fontFamily`（`"Noto Sans JP"`）へ集約（`loadGoogleFont` 呼び出しの family も同源を参照） | font family 名の単一所有。フォント定義の二重定義排除 |

## 8.3 navigation / duplicate drift 削減

| 重複 | 解消 |
| --- | --- |
| 色値の二重定義（render.tsx の `BRAND` と正本 tokens.css の暖色トークンが別系統で並存していた） | `render.tsx` に色値を残さず `OG_BRAND` 1 箇所へ集約。正本 hex の派生コピーは `og-tokens.ts` のみが保持し、`render.tsx` は参照のみ |
| accent 色の用途混在 | accent（ドット）/ accentInk（強調文字）/ accentSoft（chip 背景）へ役割名で分離し、用途ごとの値所有を明確化 |
| layout/typo magic 値の散在 | `buildHtml` 本文に散在した数値を `OG_LAYOUT` / `OG_TYPO` の名前付き定数へ寄せ、新規 magic 値の追加を構造的に抑制（Phase 2 §2.7 バランスループ） |

## 8.4 リファクタ後の所有権境界（不変条件として固定）

| 値の種類 | 所有 | 消費 |
| --- | --- | --- |
| デザイントークン正本（SSOT） | `apps/web/src/styles/tokens.css` | （変更しない） |
| OG 用派生 hex / layout / typo 定数 | `apps/og/src/og-tokens.ts`（`OG_BRAND` / `OG_LAYOUT` / `OG_TYPO` / `titleFontSize`） | `render.tsx` |
| HTML 組成・font fetch・ImageResponse 分岐 | `apps/og/src/render.tsx`（`buildHtml` / `tagLine` / `escapeHtml` / `renderMemberOg` / `renderDefaultOg` / `imageResponse`） | router |

> `render.tsx` から値所有を剥がすことで「render は値を持たない」という不変条件が成立し、ドリフトガード（`og-tokens.spec.ts`）と HEX 不在 assert（`render-html.spec.ts`）が意味を持つ。`buildHtml(title, subtitle)` の引数 signature は不変＝既存呼び出し全互換（Phase 2 §2.1）。
