---
phase: 4
title: 入出力契約 — HTML attribute と CSS 変数の対応表
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: spec_created
---

# Phase 4 — 入出力・データ契約

[実装区分: 実装仕様書]

## 1. 契約形式

本 SW は CSS のみを扱うため、データ契約は **「HTML attribute（入力） → CSS 変数経由のスタイル（出力）」** の対応表として規定する。

## 2. attribute 契約

### 2.1 `data-route`

| 値 | 用途 | 適用要素 | 適用 layout |
|----|------|---------|------------|
| `public` | 公開系 route | `<main>` または route group root | `app/(public)/layout.tsx` |
| `member` | 会員系 route | 同上 | `app/(member)/layout.tsx` |
| `admin` | 管理系 route | 同上 | `app/(admin)/layout.tsx` |

任意属性。未指定でも `body` 既定が cascade される。

### 2.2 `data-section` / `data-section-rhythm`

| `data-section-rhythm` | 縦余白 (`padding-block`) | 用途 |
|---------------------|--------------------------|------|
| 未指定（既定） | `var(--ubm-space-8)` (32px) | 通常 section |
| `compact` | `var(--ubm-space-4)` (16px) | 高密度（管理画面 table 周辺） |
| `comfortable` | `var(--ubm-space-8)` (32px) | 通常 |
| `loose` | `var(--ubm-space-12)` (48px) | Hero / Feature 強調 |

`data-section` 単独でも既定値が適用される。

### 2.3 `data-card` / `data-card-tone`

| `data-card-tone` | background | border | shadow | radius |
|-----------------|-----------|--------|--------|--------|
| 未指定（既定 = `panel`） | `--ubm-color-surface-panel` | `--ubm-color-border-default` | `--ubm-shadow-xs` | `--ubm-radius-lg` |
| `panel` | 同上 | 同上 | 同上 | 同上 |
| `surface` | `--ubm-color-surface-bg-2` | `--ubm-color-border-default` | none | `--ubm-radius-md` |
| `emphasis` | `--ubm-color-surface-panel-2` | `--ubm-color-border-strong` | `--ubm-shadow-md` | `--ubm-radius-lg` |
| `flat` | `--ubm-color-surface-bg` | `--ubm-color-border-default` | none | `--ubm-radius-md` |

### 2.4 `data-shell`

| 値 | 主要スタイル | 由来（プロトタイプ） |
|----|------------|--------------------|
| `topbar` | position: sticky / top: 0 / z-index: 10 / bg: panel / border-bottom / backdrop-filter: blur(12px) / padding: `--ubm-space-3 --ubm-space-8` | styles.css L238-249 |
| `sidebar` | position: sticky / top: 0 / height: 100vh / bg: panel / border-right / padding: `--ubm-space-6 --ubm-space-4` | styles.css L120-130 |
| `footer` | bg: surface-bg-2 / border-top / padding: `--ubm-space-8` | styles.css L216-223 派生 |

### 2.5 `data-text`

| 値 | font-size | font-weight | line-height | letter-spacing | color |
|----|----------|------------|-------------|----------------|-------|
| `display` | `--ubm-text-3xl` (32px) | 600 | 1.15 | -0.025em | `--ubm-color-text-primary` |
| `title` | `--ubm-text-2xl` (24px) | 600 | 1.2 | -0.02em | `--ubm-color-text-primary` |
| `section` | `--ubm-text-xl` (20px) | 600 | 1.3 | -0.01em | `--ubm-color-text-primary` |
| `card` | `--ubm-text-lg` (16px) | 600 | 1.35 | -0.005em | `--ubm-color-text-primary` |
| `body` | `--ubm-text-base` (13.5px) | 400 | 1.7 | 0 | `--ubm-color-text-secondary` |
| `caption` | `--ubm-text-sm` (12.5px) | 400 | 1.5 | 0 | `--ubm-color-text-secondary` |
| `eyebrow` | `--ubm-text-xs` (11px) | 500 | 1.4 | 0.16em（uppercase 用） | `--ubm-color-text-muted` |

## 3. CSS 変数依存表（出力）

本 SW 内で参照する `--ubm-*` トークンの最終一覧:

```
--ubm-color-surface-bg
--ubm-color-surface-bg-2
--ubm-color-surface-panel
--ubm-color-surface-panel-2
--ubm-color-text-primary
--ubm-color-text-secondary
--ubm-color-text-muted
--ubm-color-border-default
--ubm-color-border-strong
--ubm-radius-md
--ubm-radius-lg
--ubm-shadow-xs
--ubm-shadow-md
--ubm-space-3
--ubm-space-4
--ubm-space-6
--ubm-space-8
--ubm-space-12
--ubm-text-xs
--ubm-text-sm
--ubm-text-base
--ubm-text-lg
--ubm-text-xl
--ubm-text-2xl
--ubm-text-3xl
```

すべて `apps/web/src/styles/tokens.css` で定義済。新規トークン追加は本 SW では行わない。

## 4. cascade 互換性

| 後段で上書きされる可能性 | 緩和策 |
|-----------------------|--------|
| Tailwind utility（`bg-surface` 等）が同 specificity で適用 | cascade 順で後勝ちにより自然に調整。`!important` 不要 |
| parallel-02 の動的規則（`:hover`, `[aria-selected]`） | 本 SW 側は base state のみ、動的状態は parallel-02 が同 selector に追加 |
| parallel-03 の AppShell layout が `data-shell` 属性を付与 | layout 側が attribute を付ければ自動適用 |
