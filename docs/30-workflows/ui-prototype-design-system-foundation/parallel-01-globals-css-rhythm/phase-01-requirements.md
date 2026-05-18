---
phase: 1
title: 要件定義 — globals.css @layer components で page-level rhythm を機械化
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 1. 目的

`apps/web/src/styles/globals.css` の `@layer components` に、プロトタイプ
（`docs/00-getting-started-manual/claude-design-prototype/styles.css`）の
**page-level rhythm**（page surface / section rhythm / card chrome / shell surface /
typography scale）を selector ベースで翻訳し、**全 route が attribute だけで雰囲気を継承**できる仕組みを作る。

## 2. 機能要件

| ID | 要件 | 根拠（プロトタイプ行範囲 / spec） |
|----|------|-----------------------------------|
| FR-01 | `body` / `[data-route]` に `var(--ubm-color-surface-bg)` を背景として適用する | styles.css L74-83 / L104-107 |
| FR-02 | `[data-section]` / `[data-section-rhythm="compact\|comfortable"]` に縦余白段階を定義する | styles.css L262-268（`.content-area` padding） |
| FR-03 | `[data-card]` / `[data-card-tone="panel\|surface\|emphasis"]` に背景・陰影・border を定義する | styles.css L303-323（`.card` / `.card-flat`） |
| FR-04 | `[data-shell="topbar\|sidebar\|footer"]` に AppShell 共通 chrome（背景・border・sticky 等）を定義する | styles.css L120-260 |
| FR-05 | `[data-text="display\|title\|section\|card\|body\|caption\|eyebrow"]` に typography scale を定義する | styles.css L270-301 |
| FR-06 | すべての色は `var(--ubm-color-*)`、寸法は `var(--ubm-space-*)` / `var(--ubm-radius-*)` / `var(--ubm-shadow-*)` 経由とする | NFR-01 |
| FR-07 | 既存 `@layer base`（L70-114）と既存 `@layer components`（L116-215）の規則を破壊しない | 既存 parallel-09 G9-1..7 規則の維持 |

## 3. 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（grep gate 0 件） |
| NFR-02 | px / rem の絶対値は typography font-size / letter-spacing のみ許容、それ以外は token 経由 |
| NFR-03 | specificity は単一 attribute selector を基本とし、`!important` を用いない |
| NFR-04 | dark theme 介入はしない（MVP 非対応） |
| NFR-05 | `pnpm typecheck` / `pnpm lint` / `next build --webpack` が green |
| NFR-06 | reduce-motion / focus-visible は既存 `@layer components` 末尾規則を維持 |
| NFR-07 | 新規テストは `*.spec.{ts,tsx}` のみ |

## 4. 不変条件（CLAUDE.md 継承）

1. 既存 API endpoint surface のみ接続（CSS のみ変更）
2. OKLch トークン正本性維持
3. プロトタイプ正本順位を尊重し、新規 token を生やさない
4. D1 直接アクセス禁止（本 SW では該当なし）

## 5. スコープ境界

### IN
- `apps/web/src/styles/globals.css` の `@layer components` 末尾に新規セクションを追加
- selector / CSS 変数経由の値設定のみ

### OUT
- `tokens.css` の編集（既存維持）
- 新規 primitive 作成 / 既存 primitive の props 変更
- page.tsx / layout.tsx の編集（parallel-03 / serial-05 の責務）
- selector ベースの動的規則（tag pill / member card hover / `[data-visibility]`）— parallel-02 の責務

## 6. 受け入れ条件

1. `body` と `[data-route]` に背景色が cascade 経由で適用される
2. `[data-section]` 配下が縦リズムを持つ
3. `[data-card]` を付与した要素が panel 背景・border・陰影で表示される
4. `[data-shell]` で AppShell 3 種の chrome が一意に決まる
5. `[data-text]` で 7 段階の typography が機能する
6. grep gate `bg-\[#` / `text-\[#` / HEX 直書き が 0 件
7. `pnpm typecheck` / `pnpm lint` / `pnpm build` が exit 0

## 7. 参照

- `apps/web/src/styles/globals.css`（L11-215）
- `apps/web/src/styles/tokens.css`（L1-147）
- `docs/00-getting-started-manual/claude-design-prototype/styles.css`（L60-323 範囲を翻訳元として利用）
- `docs/00-getting-started-manual/specs/09b-design-tokens.md`
- `docs/00-getting-started-manual/specs/09c-primitives.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-02-architecture.md`（§2 layer 構造）
