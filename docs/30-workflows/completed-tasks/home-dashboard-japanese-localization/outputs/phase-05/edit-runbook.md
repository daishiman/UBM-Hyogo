# Phase 5 edit-runbook — F1–F6 の 1 ファイルずつの編集手順

> SSOT: `../../_shared-context.md`。後続実装者はこの runbook をそのまま着手単位とする。
> 各編集は「対象ファイル / 探す文字列（旧）/ 置換後（新）/ 注意点」で記述。
> 行番号は参考値（編集で前後がズレる可能性あり）。**文字列で特定**して編集すること。

---

## F1 — `apps/web/app/(public)/page.tsx`

### F1-a（C-1）: Hero の eyebrow prop 削除

- **探す文字列（旧）**（75 行付近・`<Hero variant="card"` の直後の行）:
  ```tsx
          eyebrow="UBM HYOGO · CHAPTER SITE"
  ```
- **置換後（新）**: 行ごと削除（この prop 行を丸ごと消す）。
- **注意点**: `<Hero>` の他の prop（`variant` / `title` / `subtitle` / `primaryCta` / `secondaryCta`）は不変。`Hero.tsx` 本体は編集しない（eyebrow prop はオプショナルのまま残す。`page.tsx` が渡さなければ `eyebrow ? <p data-role="eyebrow">{eyebrow}</p> : null` で描画されない）。

### F1-b（C-2）: FEATURED MEMBERS overline 削除

- **探す文字列（旧）**（94 行付近）:
  ```tsx
              <p data-role="eyebrow">FEATURED MEMBERS</p>
  ```
- **置換後（新）**: 行ごと削除。
- **注意点**: 直後の `<h2 data-role="section-heading">参加している事業者たち</h2>` は不変。`<div>` ラッパー・`<header data-role="header">` 構造・`cta-link`（全員見る →）は不変。

---

## F2 — `apps/web/src/components/public/Stats.tsx`

### F2-a（A）: 統計ラベル 4 件の日本語化

`data-role="value"` / `data-role="sub"` は不変。`data-role="label"` のテキストのみ置換。

| # | 探す文字列（旧） | 置換後（新） | 行（参考） |
| --- | --- | --- | --- |
| 1 | `<span data-role="label">Members</span>` | `<span data-role="label">公開メンバー</span>` | 44 |
| 2 | `<span data-role="label">Zones</span>` | `<span data-role="label">事業フェーズ</span>` | 49 |
| 3 | `<span data-role="label">Meetings / yr</span>` | `<span data-role="label">年間の支部会</span>` | 54 |
| 4 | `<span data-role="label">Last sync</span>` | `<span data-role="label">最終データ更新</span>` | 59 |

### F2-b（B）: 同期バッジ文言の置換

- **探す文字列（旧）**（64 行付近・`<span data-role="badge-sync">` 内のテキストノード）:
  ```tsx
              Forms 同期中
  ```
- **置換後（新）**:
  ```tsx
              自動で最新化
  ```
- **注意点**: `<span data-role="dot" aria-hidden="true" />`（点滅ドット要素）は不変。テキストノードのみ差し替える。`data-role="badge-sync"` / `data-role="sub"` ラッパーは不変。

---

## F3 — `apps/web/src/components/public/AboutUbm.tsx`

### F3-a（C-3）: ABOUT overline 削除

- **探す文字列（旧）**（50 行付近）:
  ```tsx
        <p data-role="eyebrow">ABOUT</p>
  ```
- **置換後（新）**: 行ごと削除。
- **注意点**: 直後の `<h2 data-role="section-heading">事業支援コミュニティ「UBM」</h2>` は不変。`<article data-role="about-card">` 構造は不変。

### F3-b（C-4）: THREE ZONES overline 削除

- **探す文字列（旧）**（56 行付近）:
  ```tsx
          <p data-role="eyebrow">THREE ZONES</p>
  ```
- **置換後（新）**: 行ごと削除。
- **注意点**: 直後の `<h2 data-role="section-heading">UBM区画</h2>` は不変。`<article data-role="zones-card">` / `zone-rows` / 各 `zone-row` は不変。

---

## F4 — `apps/web/src/components/public/Timeline.tsx`

### F4（C-5）: RECENT MEETINGS overline 削除

- **探す文字列（旧）**（51 行付近）:
  ```tsx
          <p data-role="eyebrow">RECENT MEETINGS</p>
  ```
- **置換後（新）**: 行ごと削除。
- **注意点**: 直後の `<h2 data-role="section-heading">最近の支部会</h2>` は不変。`<header data-role="header">` / `chip-cadence`（毎月第2木曜開催）/ `dot` は不変。

---

## F5 — `apps/web/src/components/public/CallToActionCTA.tsx`

### F5（C-6）: FOR MEMBERS overline 削除

- **探す文字列（旧）**（24 行付近）:
  ```tsx
          <p data-role="eyebrow">FOR MEMBERS</p>
  ```
- **置換後（新）**: 行ごと削除。
- **注意点**: 直後の `<h2 data-role="heading">{heading}</h2>` は不変。`<div data-role="copy">` / `body` / `cta-button` / 外部 link（target="_blank" + rel="noopener noreferrer"）は不変（不変条件 #7）。

---

## F6 — `apps/web/src/styles/legacy-public.css`

> 行番号はあくまで参考値。CSS を上から削除すると後続行がズレるため、**セレクタ文字列で特定**して削除すること。

### F6-a: dead eyebrow ルール 4 件を削除

以下 4 ルールをブロックごと（セレクタ行〜閉じ `}` まで）削除する。

| # | 削除するセレクタ（ブロック先頭） | 行レンジ（参考） |
| --- | --- | --- |
| 1 | `[data-component="call-to-action-cta"] [data-role="eyebrow"] {` | 312–318 |
| 2 | `[data-component="about-ubm"] [data-role="eyebrow"] {` | 887–894 |
| 3 | `[data-component="featured-members"] [data-role="eyebrow"] {` | 984–991 |
| 4 | `[data-component="timeline"] [data-role="header"] [data-role="eyebrow"] {` | 1020–1027 |

各ブロックは `font-size` / `letter-spacing` / `text-transform: uppercase` / `color` / `margin` 等のプロパティを含む。ブロック全体（`{` から対応する `}` まで）を削除する。

### F6-b（保持）: Hero eyebrow ルールは削除しない

- **保持するセレクタ**（817–824 行付近）:
  ```css
  [data-component="hero"][data-variant="card"] [data-role="eyebrow"] { ... }
  ```
- **理由**: `Hero.tsx` は eyebrow prop を依然サポートする汎用コンポーネント。home が prop を渡さないだけで、他用途では eyebrow が描画され得るため dead でない。**誤って削除しないこと。**

### F6-c: CTA heading の margin-top を 0 に調整

- **対象セレクタ**（320–323 行付近）:
  ```css
  [data-component="call-to-action-cta"] [data-role="heading"] {
    margin-top: var(--ubm-space-2);
    color: inherit;
  }
  ```
- **探す文字列（旧）**:
  ```css
    margin-top: var(--ubm-space-2);
  ```
  （`[data-component="call-to-action-cta"] [data-role="heading"]` ブロック内のもの）
- **置換後（新）**:
  ```css
    margin-top: 0;
  ```
- **注意点**: `color: inherit;` は不変。eyebrow 削除後、heading が copy ブロックの先頭要素になるため、eyebrow との分離余白だった `margin-top` を 0 にして上端余白を消す。他のセレクタ（`[data-role="body"]` の `margin-top: var(--ubm-space-2)` など）は対象外（不変）。色値の追加・HEX 直書きは一切しない（不変条件 #4）。
