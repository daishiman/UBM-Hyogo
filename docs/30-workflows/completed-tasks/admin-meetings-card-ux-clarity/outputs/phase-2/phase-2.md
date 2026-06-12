# Phase 2: 設計

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 2 / 13 |
| created_at | 2026-06-10 |
| concern 数 | 3（F1 CSS / F2 Drawer DOM / F3 Timeline DOM）→ 同一ファイル内セクション分割 |

## 目的

AC-1〜AC-10 を満たす最小差分の設計を、token 正本・DOM contract 保持・既存 primitive 再利用の観点で固定する。

## [FB-SDK-07-1] 既存コンポーネント再利用可否

| 観点 | 判断 |
|---|---|
| 既存 primitive 再利用 | **可**。`.ui-card` / `.admin-section-card` / `.bulk-attendance*` / `FormField` / `Input` / `Button` / `Checkbox` を再利用。新規 React primitive は作らない |
| 新規 CSS class | 最小限。**既存マークアップにある未定義 BEM を実体化**するのが主。汎用 `.admin-detail-section*` / `.admin-attendee-row*` のみ新設（invariant #3: 新規 primitive を生やしすぎない） |
| 新規 token | なし（既存 `--ubm-*` のみ） |

## 設計（concern 別）

### concern F1: globals.css CSS 契約

`shared-context.md §6` の CSS 契約を正本とする。配置は globals.css の既存 `.bulk-attendance` ブロック（198-250）近傍 or `.admin-timeline__heading .ui-badge`（1630 近傍）に隣接させ、admin 系のまとまりを保つ。

設計判断:
- **カード分離（AC-1）**: `.admin-timeline { gap: var(--ubm-space-3) }`（8→12px）。`.ui-card--flat { box-shadow: none; border: 1px solid var(--ubm-color-border-default) }` で影を消し境界線で分離。`.ui-card[data-selected]` は `border-color: var(--ubm-color-accent); background: var(--ubm-color-accent-soft)` で展開中を強調。
- **見出し整列（AC-2）**: `.admin-timeline__heading` を flex 行（date / title / badge）に。`:focus-visible` で outline（キーボード操作可視）。`:hover` で `background: var(--ubm-color-surface-panel-2)`。
- **展開分離（AC-3）**: `.admin-meeting-drawer` に `border-top` + `padding` + `background: surface-panel-2` を与え、ヘッダと展開部を視覚分離。内部は `.admin-detail-section`（border + radius + panel bg）で各セクションをサブカード化。
- **出席者行（AC-4）**: `.admin-attendee-row` に `justify-content: space-between` + `padding` + `radius` + `background: surface-bg`。`.admin-attendee-list { gap: var(--ubm-space-1) }`。

### concern F2: MeetingAttendanceDrawer.tsx DOM

`shared-context.md §7` の改修詳細を正本とする。**ステップ間 state は不変**（既存 `useState`: picked/editTitle/editHeldOn/editNote/bulkModalOpen）。wrapper 追加のみ。

DOM diff 方針（contract 保持）:

| セクション | Before | After | contract |
|---|---|---|---|
| 編集 | `<details><summary>編集</summary>...` | `<section class="admin-detail-section"><details>...` | summary テキスト維持 |
| 出席追加 | `<div role="group" aria-label="出席追加" class="flex...">` | `<div role="group" aria-label="出席追加" class="admin-detail-section"><h4 class="admin-detail-section__title">出席を追加</h4><div class="admin-detail-section__body flex flex-wrap items-end gap-2">...` | `role`/`aria-label`/`data-testid` 維持 |
| 出席者 | `<div><h4>出席者</h4><ul class="flex flex-col gap-1">...` | `<div class="admin-detail-section"><h4 class="admin-detail-section__title">出席者 ({attended.size}名)</h4><ul class="admin-attendee-list">...` | `data-testid="attendance-attendee-*"` / `data-member` / `remove-attendance-*` 維持 |
| 出席者行 | `<li class="flex items-center gap-2"><span>{name}...</span><Button>削除</Button>` | `<li class="admin-attendee-row"><span class="admin-attendee-row__name">{name}...</span><Button>削除</Button>` | li の data-testid/data-member、Button の data-testid/data-member 維持 |

> 一括追加（`BulkAttendanceChecklist`）は既存 `.bulk-attendance` セクションが自前で枠を持つため、`.admin-detail-section` で二重に囲まない。

### concern F3: MeetingTimeline.tsx DOM

最小改修。`article.ui-card.ui-card--flat` / `button.admin-timeline__heading` 構造は維持。任意で title+badge を `<span class="admin-timeline__meta">` で軽くまとめてよいが、`data-testid` を持つ badge span はそのまま残す。`aria-expanded` / `aria-label` / 全 data-testid 維持。

## target topology

| concern | target file | 変更種別 | lane |
|---|---|---|---|
| F1 | `apps/web/src/styles/globals.css` | 編集（追加） | Lane A |
| F2 | `MeetingAttendanceDrawer.tsx` | 編集（wrapper/class） | Lane B |
| F3 | `MeetingTimeline.tsx` | 編集（class） | Lane B |
| T1/T2 | `__tests__/*.spec.tsx` | 編集（append） | Lane C |

lane 数 = 3（≤3）。validation lane（typecheck/lint/vitest/verify:tokens）は直列で締める。

## validation matrix（command 単位）

| command | 検証 AC |
|---|---|
| `pnpm typecheck` | AC-9 |
| `pnpm lint` | AC-9 |
| `pnpm exec vitest run apps/web/src/features/admin/components/_meetings/__tests__` | AC-6, AC-10 |
| `pnpm verify:tokens` | AC-7 |
| `git diff dev -- apps/api`（空） | AC-8 |
| `grep -rn "bg-\[#\|text-\[#" apps/web/src/.../_meetings apps/web/src/styles/globals.css`（0） | AC-7 |

## UI コンポーネントテスト Props vs internal state（[VSCPKR-03]）

| コンポーネント | 操作対象 | テスト方法 |
|---|---|---|
| MeetingAttendanceDrawer | `attended`（external prop, ReadonlySet）/ section 見出し（静的 DOM） | props を渡して render → 見出しテキスト・行 class・data-testid を query。internal state 操作不要 |
| MeetingTimeline | `items` / `selectedId`（external prop） | props 変化で再 render し card class / data-testid を query |

→ T1/T2 は **external prop 駆動の構造検証**。internal state トグルは不要。

## DI 境界

なし（純粋な表現層改修。サービス/Port なし）。

## 成果物

- `outputs/phase-2/phase-2.md`（本ファイル）

## 完了条件

- [x] concern 別設計（F1/F2/F3）
- [x] DOM contract 保持マッピング
- [x] validation matrix
- [x] lane ≤3
- [x] 既存再利用可否判断

## タスク100%実行確認【必須】

- [x] 設計の全項目を記述
- [x] token 正本・新規 primitive 最小化を明記

## 次Phase

Phase 3（設計レビュー）。
