---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 3
phase_name: 設計レビュー
created_at: 2026-06-03
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 3: 設計レビュー（Phase 4 進行可否ゲート）

## 3.1 要件レビュー思考法（一次結論）

| 観点 | 結論 |
|------|------|
| 真の論点 | 「collapsed で機能が分からない」「フッター/ヘッダーがスクロールで消える」= **viewport 端で常に文脈を保持できない** という単一の UX 欠落。3 レーンはいずれも「常に文脈を見せる」という共通価値に収束する独立タスク。 |
| 依存・責務境界 | A/B/C は相互非依存（並列実装可）。A は shell 内 4 コンポーネント + CSS、B は public CSS 1 箇所、C は shell mobile-bar の class 1 箇所。状態所有はいずれも増やさない（CSS / class のみ）。 |
| 価値とコスト | 最大価値 = A（collapsed の機能可視化、毎操作の認知コスト削減）。コスト最小 = B/C（CSS/class のみ）。A の新規 `SidebarTooltip` が唯一の新規ファイルで、複雑性はそこに局所化。 |
| 改善優先順位 | A（新規 + 4 適用箇所）→ C（class 1 箇所）→ B（CSS 1 箇所）。ただし 1 サイクル / 1 PR で全レーン完了（CONST_007）。 |
| 4 条件 | 価値性=PASS（認知コスト削減が明確）/ 実現性=PASS（依存 0・既存 token と prop で実装可）/ 整合性=PASS（state 所有を増やさず z-index 階層を全レーンで整合）/ 運用性=PASS（`verify-design-tokens` / focused vitest / Playwright visual で回帰検出可能）。 |

## 3.2 設計上の判断（resolved）

| # | 論点 | 判断 |
|---|------|------|
| D-1 | ツールチップ実装方式 | **CSS カスタムツールチップ**（ユーザー確定）。ライブラリ非依存・`tokens.css` 色・`:hover`/`:focus-within` 駆動。native title は採用しない（遅延・スタイル不可）。 |
| D-2 | a11y の name/description 二重化 | trigger の accessible name（sr-only ラベル / aria-label）を維持し、tooltip は `role="tooltip"` + `aria-describedby` の **description** として付与。name を tooltip へ移管しない（二重読み上げ回避・AC-A6 / I-8）。 |
| D-3 | `<details>/<summary>` への wrap | `SidebarTooltip` の `<span>` wrap は `<details>` 直下子が `<summary>` でなければならない制約と衝突する。**user menu のみ `<summary>` を `relative` にして内部へ `role="tooltip"` バブルを直接配置**（同 CSS class 流用）。`SidebarNavItem` / `AdminPublicReturn` / `CollapseToggle` は `SidebarTooltip` wrap を使う。 |
| D-4 | フッター固定方式 | `position: sticky; bottom: 0`（fixed ではなく sticky）。sidebar 幅オフセットや本文 padding 調整が不要で、`main` を containing block として viewport 下端ピン留めが成立（2.2.2）。 |
| D-5 | ヘッダー固定方式 | inline Tailwind `sticky top-0 z-30`（global CSS ルール新設ではなく既存 inline スタイルへ追加）。class が `SidebarShell.spec` で直接 assert 可能（testability）。 |
| D-6 | z-index 階層 | drawer 40 > tooltip 30 = mobile-bar 30 > footer 20 = popover 20。同値（tooltip/mobile-bar、footer/popover）は同時表示しないため衝突なし（2.3.2）。 |
| D-7 | スコープ分離 | 汎用 Tooltip primitive 化 / フッターの会員・管理適用 / タッチ hover は責務独立でスコープ外（Phase 1 §1.6）。先送りではなく構造境界。本サイクルで必要な欠落ではないため未タスク化しない。 |

## 3.3 リスクと緩和

| リスク | 緩和 |
|--------|------|
| `main` 祖先に `overflow: hidden` があり sticky footer が効かない / sidebar の overflow が tooltip をクリップする | Phase 5 で `shell-root` / `div.flex-1.flex-col` / `main` の overflow を grep 確認。`<aside>` は collapsed tooltip を外側へ出すため `overflow-visible` とする |
| `<li>` 直下に tooltip wrap を挟むと nav リンクの clickable 幅が縮む | `.ubm-shell-tooltip-wrap` を `display: block`（リンク幅維持）にする。`SidebarNavItem.spec` で `data-shell-block="nav-item"` が link 要素として存在し続けることを assert |
| token 名 typo（`--ubm-text-xs` 等が未定義） | Phase 5 着手時に `tokens.css` を grep し実在 token のみ使用。未定義は fallback 値（`12px` 等）を併記 |
| `verify-design-tokens` が新規 CSS の色を HEX と誤検出 | 色は全て `var(--ubm-color-*)` を使用。z-index / opacity / space は色でないため対象外 |
| 既存 shell test の回帰（collapsed の DOM 変化） | Phase 6 で `SidebarShell.spec` / `SidebarNavItem.spec` の既存 assert（nav 数・aria-current・collapsed sr-only）が緑を維持するか確認。tooltip 追加は加算であり既存 query を壊さない設計 |

## 3.4 ゲート判定

- Phase 1 の AC（A1-A6 / B1-B3 / C1-C3）はすべて検証手段が定義済み。
- 設計上の未決事項（D-1〜D-7）は本 Phase ですべて resolved。
- 依存タスク無し・既存 token と prop で実装可能・1 サイクル完結（CONST_007）。

→ **PASS。Phase 4（テスト計画）へ進行可能。**
