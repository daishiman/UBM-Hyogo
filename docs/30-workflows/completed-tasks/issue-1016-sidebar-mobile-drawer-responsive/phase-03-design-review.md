# Phase 3 — 設計レビュー（ゲート）

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
|------|------|------|
| 真の論点 | PASS | 「`drawerOpen` state が宙ぶらりん（未消費）で mobile ナビが機能しない」が主問題。Trigger/Drawer の実装でクローズ |
| 責務境界 | PASS | state=hook、scroll lock/focus=Drawer、open trigger=Trigger と分離。UserMenu close と drawer close を別 state に保つ |
| 依存関係 | PASS | Task A 基盤（context/state/shell）に積むのみ。新規 endpoint / D1 / API 非接触 |
| 価値とコスト | PASS | 価値=mobile/tablet で shell が機能。コスト=~350 LOC。外部ライブラリ追加なしでコスト抑制 |
| hydration 安全性 | PASS | 初期 state は SSR で expanded 固定、mount 後 effect で確定。CSS が即時 breakpoint 担保 |

## MINOR 指摘（Phase 12 で最終判定）

| ID | 指摘 | 対応 |
|----|------|------|
| M-1 | drawer children と `<aside>` children の共通化余地 | Phase 8 で比較し、drawer 固有の close button / overlay footer と aside 固有の collapse toggle があり、helper 抽出は条件分岐を増やすため不採用 |
| M-2 | `--ubm-color-overlay-scrim` トークン未確認 | Phase 5 で新規 token を増やさず、既存 text token + opacity を backdrop に限定して解消 |
| M-3 | `is-browser.ts` に matchMedia 正規 getter がない | Phase 5 で `browserMatchMedia(query)` を追加して解消。scoped eslint-disable は不要 |

## ブロッカー

なし。Phase 4 へ進行可能。

## 命名規則整合性チェック（FB-SDK-07-4）

- `SidebarMobileTrigger` / `SidebarDrawer`: 既存 `Sidebar*` PascalCase に整合 ✅
- `data-component="shell-drawer-*"` / `shell-mobile-trigger-button`: 既存 `shell-*` kebab に整合 ✅
- `id="shell-drawer"` ↔ `aria-controls="shell-drawer"`: 一致 ✅

## 完了条件

- [x] 5 観点レビュー PASS
- [x] MINOR 指摘を記録（Phase 12 で未タスク化なしと判定）
- [x] ブロッカーなしを確認 → Phase 4 進行可
