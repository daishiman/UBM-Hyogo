---
phase: 1
title: 要件定義 — プロトタイプ selector ベース CSS 規則の移植
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
created_at: 2026-05-18
owner: daishiman
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 1. 目的

プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/styles.css` の selector ベース規則のうち、UX 上必須の「インタラクション可視化」3 規則 (G3-1 / G3-2 / G3-3) を `apps/web/src/styles/globals.css` の `@layer components` に転記する仕様を定義する。

本サブワークフローは parallel-01 (page-level rhythm) と同じ `globals.css` を編集するため、責務範囲と merge 戦略は Phase 2 / Phase 9 で明示する。

## 2. 背景

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-prototype-ux-css/spec.md:25-62` で G3-1/2/3 の課題提起と仮実装方針は確定済
- ただし当該 spec は MVP recovery 用の最小修正単位として記述されたもので、本 workflow (greenfield foundation) では「rhythm 全体機械化」と「selector 規則」を責務分離して並列実装する
- 旧 spec の規則はそのまま継承するが、`@layer components` 内での配置順序・既存規則との merge 方式・将来拡張への余地を本サブワークフローで再整理する

## 3. 機能要件

### 3.1 G3-1: Tag pill 選択時 fill

| 項目 | 要件 |
|------|------|
| selector | `[data-component="tag-pill"][aria-selected="true"]` |
| 配色 | `background: var(--ubm-color-text-primary); color: var(--ubm-color-surface-panel); border-color: var(--ubm-color-text-primary);` |
| transition | `all var(--ubm-dur-fast, .15s) var(--ubm-ease-standard, ease)` |
| hover (非選択時) | `border-color: var(--ubm-color-border-strong);` |
| 非選択時 (既定) | 背景は `var(--ubm-color-surface-bg)`、border `var(--ubm-color-border-default)`、文字 `var(--ubm-color-text-secondary)` |

### 3.2 G3-2: Member card hover elevation

| 項目 | 要件 |
|------|------|
| selector | `[data-component="member-card"]` |
| transition | `border-color`, `box-shadow` を `var(--ubm-dur-fast)` で変化 |
| hover | `border-color: var(--ubm-color-border-strong); box-shadow: var(--ubm-shadow-sm);` |
| focus-visible | `outline: 2px solid var(--ubm-color-accent); outline-offset: 2px;` |
| 非 hover (既定) | `box-shadow: var(--ubm-shadow-xs, none);` (既存 surface に追加しない) |

### 3.3 G3-3: Visibility marker

| 項目 | 要件 |
|------|------|
| selector | `[data-visibility="public" \| "member" \| "admin"]` |
| 共通装飾 | `border-left: 3px solid <token>; padding-inline-start: 12px; position: relative;` |
| `public` | border `var(--ubm-color-ok)` / `::before` content `"🌍"` |
| `member` | border `var(--ubm-color-zone-b)` / `::before` content `"👥"` |
| `admin` | border `var(--ubm-color-danger)` / `::before` content `"🔐"` |
| icon 配置 | `::before { margin-inline-end: 6px; }` 装飾扱い (`aria-hidden` は markup 側で担保) |

## 4. 非機能要件

- HEX / `bg-[#...]` / `text-[#...]` の直書きを禁止 (verify-design-tokens gate 適合)
- 全ての値は `var(--ubm-*)` 経由
- 既存 `@layer components` 規則 (parallel-09 G9-1..G9-7) と selector 衝突しない
- 既存 Tailwind utility が selector 規則を上書きしないよう、`@layer components` で specificity を担保 (`[data-component][aria-selected]` の 0,2,0 で十分)
- `@media (prefers-reduced-motion: reduce)` 配下では transition が無効化される (既存規則を継承)

## 5. 受け入れ条件 (Acceptance Criteria)

| ID | 条件 |
|----|------|
| AC-01 | `apps/web/src/styles/globals.css` の `@layer components` 末尾に G3-1/2/3 セクションが追加されている |
| AC-02 | tag pill の `aria-selected="true"` に対して背景塗りつぶしが視覚反映される (Playwright visual で確認可) |
| AC-03 | member card に hover した時、border-color と box-shadow が transition で変化する |
| AC-04 | `[data-visibility="public\|member\|admin"]` の各値で左ボーダー色と icon が切り替わる |
| AC-05 | `pnpm typecheck` / `pnpm lint` / `pnpm build` が green |
| AC-06 | `verify-design-tokens` CI gate が green (HEX 直書き 0 件) |
| AC-07 | parallel-01 と同時に作業しても merge 衝突を最小化できる構造 (Phase 2 で明示) |

## 6. スコープ外

- tag pill / member card / visibility marker の markup 側 (`MemberFilters.client.tsx` / `MemberCard.tsx` / `MemberDetailSections.tsx`) への `data-*` / `aria-*` 属性付与 — これらは parallel-01..04 のうち markup 関連サブワークフローもしくは serial-05 (page binding) で実施する
- API 側に `visibility` field を追加する変更
- 新規 primitive 追加 / Tailwind config 拡張

## 7. 参照

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-prototype-ux-css/spec.md:25-62`
- `docs/00-getting-started-manual/claude-design-prototype/styles.css:808-828`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-02-architecture.md:55-68`
- `apps/web/src/styles/globals.css:116-215`
- `apps/web/src/styles/tokens.css`
