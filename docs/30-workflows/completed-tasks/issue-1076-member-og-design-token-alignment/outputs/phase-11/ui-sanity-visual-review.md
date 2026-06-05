# UI Sanity / Visual Review（3 層評価）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## VISUAL_ON_EXECUTION 宣言

| key | value |
| --- | --- |
| タスク種別 | implementation task（UI / 意匠変更を伴う VISUAL タスク） |
| workflow_state | `implemented_local_evidence_captured` |
| 実描画 runtime 制約 | OG 画像は Cloudflare Workers ランタイムの Satori（`workers-og` の `ImageResponse`）でのみ実描画される。Node/jsdom では `HTMLRewriter` 不在で `render.tsx:62-83`（v8-ignore）が 1×1 PNG fallback へ分岐し意匠は描画されない |
| 実 screenshot | **pending**（staging runtime cycleで staging `apps/og` から取得・3 点 = TC-OG-01..03） |
| 代替証跡 | `buildHtml` 出力 HTML 文字列の自動 assert（`render-html.spec.ts` / `og-tokens.spec.ts`・Phase 4 設計） |

Visual 層は実 screenshot を伴う評価のため、現段階（implemented_local_evidence_captured）は設計レビューに留め、実ピクセル評価はstaging runtime cycleで実施する。

## 3 層評価

### 1. Semantic（意味的整合）

| 観点 | 評価 |
| --- | --- |
| 値所有権の分離 | 色/レイアウト/タイポの値所有を `og-tokens.ts`（`OG_BRAND` / `OG_LAYOUT` / `OG_TYPO`）へ集約。`render.tsx` は消費のみ（Phase 8 §8.4）。意味的に「正本 → 派生 → 消費」の一方向所有が成立 |
| 正本整合 | `OG_BRAND` は tokens.css 確定 hex の派生コピー。text/surface/border は `:root` plain hex、accent 系は `@supports not (color: oklch)` フォールバック hex を出典（Phase 2 §2.3） |
| 階層の意味付け | eyebrow（accentInk）/ title（ink・800 weight・適応サイズ）/ subtitle（body）/ footer（muted）で読み順と重要度が意味的に整合 |
| 名あり/なし耐性 | `tagLine` が常に非空（フォールバック "UBM Hyogo member"）・`titleFontSize` が長い氏名を縮小（AC-3） |

### 2. Visual（staging runtime cycleで staging 取得・現段階は設計レビュー）

現段階は実 screenshot 未取得のため、設計上の配色コントラスト観点を記述する。実ピクセルのコントラスト・余白体感はstaging runtime cycleの staging screenshot で確認する。

| 配色ペア | 用途 | 設計上の評価 |
| --- | --- | --- |
| ink `#1a1917` on panel `#ffffff` | タイトル文字 / カード背景 | 高コントラスト。タイトル可読性は十分 |
| body `#57554e` on panel `#ffffff` | サブタイトル文字 | 十分なコントラスト。本文サイズ（subtitleFontPx）で可読 |
| muted `#8a877e` on panel `#ffffff` | eyebrow / footer 文字 | footer / eyebrow 用途として可読。装飾的補助テキストの階層を下げる意図に整合 |
| accentInk `#6f4f25` on panel `#ffffff` | eyebrow 強調文字 | 暖色で強コントラスト。ブランド語標を引き立てる |
| accent `#b08049` dot | ブランドドット（`dotPx` 円） | 暖色 amber のアクセント点。面積小の装飾でコントラスト要件は緩く、ブランド色の identity を担う |
| surface `#f5f4f1` 外枠 / panel `#ffffff` カード | 背景階層 | 外枠 stone と内側 white の微差で奥行きを作る。line `#e7e5df` の境界で card を分離 |

> 設計レビュー時点では「タイトル/本文は高コントラスト、muted/accent は補助・装飾用途で可読」と判定。実画面でのコントラスト体感・要素間余白（`OG_LAYOUT` 値）の最終確認は staging screenshot（Phase 13 user-gated）で行う。

### 3. AI UX（共有面としての体験）

| 観点 | 評価 |
| --- | --- |
| ブランド一貫性 | OG はサイト外（SNS 共有）の主要露出面。暫定の青系から正本の暖色 stone/amber へ整合し、サイト本体とのブランド一貫性を回復（Phase 1 §1.2） |
| 情報の即時性 | eyebrow（UBM Hyogo）→ title（氏名/タイトル）→ subtitle（属性）→ footer（Member Directory）の縦階層で、サムネイル縮小時も上から重要情報が読める設計 |
| 再乖離防止 | `og-tokens.spec.ts` のドリフトガードで tokens.css 変更時に CI fail → OG 追従を強制。体験の一貫性が運用面で継続担保される（Phase 2 §2.7 強化ループ） |

## 判定

Semantic 層は設計完了で整合。Visual 層は設計上のコントラスト観点で良好と判定し、実ピクセル評価はstaging runtime cycleの staging screenshot 3 点（TC-OG-01..03）で確定する。AI UX 層はブランド一貫性回復という本タスクの価値に整合。blocker なし。
