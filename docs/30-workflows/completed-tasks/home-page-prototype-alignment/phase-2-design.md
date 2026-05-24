# Phase 2 — システム設計（CSS rule 設計）

## 1. 配置方針

新規 CSS rule はすべて **`apps/web/src/styles/legacy-public.css` の末尾**に追記する（同ファイルは既に公開コンポーネントの data-attr rule 集約箇所。`globals.css` の `@layer components` 末尾に分散させると責務が割れるため避ける）。

責務:
- `tokens.css`: OKLch token 定義のみ（**追記不要**）
- `globals.css`: Tailwind 連携 + base rhythm のみ（**追記不要**）
- `legacy-public.css`: 公開／管理コンポーネントの data-attr 駆動 rule（**今回ここに追記**）

## 2. プロトタイプ → data-attr 移植マッピング

| プロトタイプ class | 対応コンポーネント / data-attr | 主要 declaration |
| --- | --- | --- |
| `.topbar` + `.topbar-nav` | `[data-component="public-header"]` | sticky top, padding `14px 28px`, border-bottom, backdrop-filter blur, flex row, justify-content space-between |
| `.card.stat` の親 `.grid-4` | `[data-component="stats"] [data-role="stat-grid"]` | `display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;` 901px 未満で 2 column / 600px 未満で 1 column |
| `.card.stat` | `[data-component="stats"] li[data-stat]` | card 化（panel bg, border, radius, padding `18px 20px`, shadow-xs） |
| `.stat-label` / `.stat-value` | `li[data-stat] [data-role="label"]` / `[data-role="value"]` | label: 11px uppercase letter-spacing 0.12em color text-3 / value: 32px bold |
| `.grid-3`（ZoneIntro 用 3 column） | `[data-component="zone-intro"] [data-role="zone-list"]` | `display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;` 901px 未満で 1 column |
| `.card` + zone tone | `li[data-zone]` | panel bg, border-left 4px solid `var(--ubm-color-zone-*)` （TSX 側で inline style 済）、padding 20px, radius `var(--ubm-radius-lg)` |
| `.timeline` + `.tl-row` | `[data-component="timeline"] ol > li` | grid 3 column `88px 1fr auto`, gap 16px, padding `12px 0`, border-bottom 1px solid token border。`:last-child { border-bottom: 0 }` |
| `.topbar` の対極（フッター） | `[data-component="public-footer"]` | padding top/bottom 32px, border-top, flex column gap 8px, text size 12px text-3 |
| `.member-grid-comfy` | `[data-component="member-grid"]` | `display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px;` `[data-density="dense"]` で minmax(240px, 1fr) gap 12px |

## 3. token 利用

すべての色は `tokens.css` の variable 経由:

- 背景: `var(--ubm-color-surface-panel)` / `var(--ubm-color-surface-bg)` / `var(--ubm-color-surface-bg-2)`
- 文字: `var(--ubm-color-text-primary)` / `var(--ubm-color-text-secondary)` / `var(--ubm-color-text-muted)`
- border: `var(--ubm-color-border-default)` / `var(--ubm-color-border-strong)`
- radius: `var(--ubm-radius-md)` / `var(--ubm-radius-lg)`
- shadow: `var(--ubm-shadow-xs)` / `var(--ubm-shadow-sm)`
- zone tone: `var(--ubm-color-zone-a)` / `-b` / `-c`

> token 名が tokens.css と一致しない場合は実装着手時の grep で確認し、実在名に置換する（CONST 不一致なら token 名は実値優先）。

## 4. レスポンシブ閾値

- `@media (max-width: 900px)` で stat-grid を 2 column、zone-list を 1 column、public-header の nav を折り返し
- `@media (max-width: 600px)` で stat-grid を 1 column、timeline の grid を 2 行（date を上段に）

## 5. アクセシビリティ

- focus-visible outline は globals.css の token に従う（追記不要）
- `[data-component="public-header"] nav a[aria-current="page"]` で active state を表現（ボーダー下線）

## 6. テスト方針

- snapshot test 既存（`apps/web/src/components/public/__tests__/*.spec.tsx`）は構造変更しないため pass 維持
- 新規 Playwright visual test は範囲外（既存 `playwright-smoke / visual` で検出される。差分許容範囲は task-01 Phase 11 で確定）

## 7. 完了条件（Phase 2）

- 配置方針確定（legacy-public.css 末尾追記）
- マッピング表確定（プロトタイプ → data-attr）
- token 名一覧確定
- レスポンシブ閾値確定
