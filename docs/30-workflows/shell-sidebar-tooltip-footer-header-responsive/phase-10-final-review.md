---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 10
phase_name: 最終レビュー
created_at: 2026-06-03
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 10: 最終レビュー

## 10.1 AC 達成可否マトリクス

Phase 9 の検証手段と Phase 1.4 の AC を 1 対 1 突合。local semantic 実測は focused shell Vitest 5 files / 33 tests PASS。visual 実測は staging visual user gate で埋める。

### レーン A（collapsed ツールチップ）

| AC | 期待 | 検証手段 | 計画判定 |
|----|------|----------|----------|
| AC-A1 | collapsed で nav item ホバー/フォーカスにツールチップ（`role="tooltip"`） | `SidebarTooltip.spec` / `SidebarNavItem.spec` | PASS（手段定義済） |
| AC-A2 | expanded はツールチップ非描画（children 直返し） | `SidebarNavItem.spec`（expanded で wrap 不在） | PASS |
| AC-A3 | tooltip が一意 `id` + trigger に `aria-describedby` | `SidebarTooltip.spec`（describedby = tooltipId・連結含む） | PASS |
| AC-A4 | tooltip の色/影/角丸が token 経由（HEX 0） | `verify:tokens` green + `globals.css` grep | PASS |
| AC-A5 | AdminPublicReturn / UserMenu / CollapseToggle も collapsed で tooltip | `SidebarShell.spec` / `SidebarUserMenu.spec` / `SidebarCollapseToggle.spec` | PASS |
| AC-A6 | 既存アクセシブル名を壊さず二重読み上げにならない | `SidebarNavItem.spec`（name=label 維持・tooltip は description）+ axe 違反 0 | PASS |

### レーン B（フッター sticky 固定）

| AC | 期待 | 検証手段 | 計画判定 |
|----|------|----------|----------|
| AC-B1 | フッターが viewport 下端 sticky 固定・スクロール中常時表示 | Phase 11 Playwright visual `public-footer-sticky-bottom.png` + 手動スクロール | PASS（visual / 手動で担保・jsdom 不可は honest scope） |
| AC-B2 | フッター背景が不透明（`--ubm-color-surface-bg`） | `legacy-public.css` grep + visual | PASS |
| AC-B3 | フッターの色が token 経由（HEX なし） | `verify:tokens` green | PASS |

### レーン C（モバイルヘッダー sticky 固定）

| AC | 期待 | 検証手段 | 計画判定 |
|----|------|----------|----------|
| AC-C1 | `< md` で mobile-bar が `sticky top-0` 固定・スクロール中表示 | `SidebarShell.spec`（class assert）+ Phase 11 visual `mobile-header-sticky.png` + 手動 | PASS |
| AC-C2 | mobile-bar の z-index が `z-30`（drawer 40 より下・本文より上） | `SidebarShell.spec`（class `z-30`） | PASS |
| AC-C3 | `md` 以上で mobile-bar は従来通り hidden（回帰なし） | `SidebarShell.spec`（class `md:hidden` 維持） | PASS |

## 10.2 blocker 判定

- 全 AC に検証手段が定義済み（Phase 9.1 / 9.2）。spec 段階での **blocker は 0**。
- レーン B の `AC-B1` は jsdom で sticky 挙動を評価できない構造的制約があるが、Phase 11 visual + 手動で担保する設計（Phase 1 index の「検証境界」に honest scope として明記済み）→ blocker ではない。

## 10.3 不変条件再 grep（実装後確認）

```bash
# I-1: apps/api 差分 0
git diff --name-only dev...HEAD | grep -E '^apps/api/'   # 期待: 出力なし

# I-2 / AC-A4 / B3: shell・public CSS に HEX 直値が無い
grep -rnE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/globals.css | grep -i tooltip   # 期待: なし
grep -nE '(bg|text|border)-\[#' apps/web/src/components/shell/SidebarShell.tsx     # 期待: なし

# I-3: 汎用 primitive を増やしていない
grep -rn 'Tooltip' apps/web/src/components/ui/   # 期待: なし

# I-4: tooltip が新規 JS state を持たない
grep -nE 'useState' apps/web/src/components/shell/SidebarTooltip.tsx   # 期待: なし

# I-6: mobile-bar の md:hidden（表示制御）が不変・sticky のみ加算
grep -nE 'md:hidden' apps/web/src/components/shell/SidebarShell.tsx    # 期待: mobile-bar に維持
```

## 10.4 観察事実との照合

- 既存 sidebar collapse / expand 挙動（`useSidebarState` / collapse cookie）が回帰していないこと（I-4 / I-5）。
- nav item の数・順序・accessible name（sr-only ラベル / aria-current）が不変であること（navigation drift なし・Phase 8.3）。
- 既存 shell test（`SidebarShell.spec` / `SidebarNavItem.spec`）が tooltip 追加後も green を維持すること（加算であり既存 query を壊さない）。

## 10.5 MINOR 指摘 / 非起票の責務境界

| # | 指摘 | 区分 | 扱い |
|---|------|------|------|
| M-1 | 汎用 Tooltip primitive の `apps/web/src/components/ui/` 化 | scope 外（I-3 / YAGNI） | 非起票。今回の実装に不要な未使用 API を増やすため、現時点では改善ではない |
| M-2 | フッター sticky の会員 / 管理レイアウトへの適用 | scope 外（Phase 1.6） | 非起票。会員レイアウトは現状フッター無し・管理は sidebar footer（C1 で sticky 済み）で、対象面が異なる |
| M-3 | ツールチップのモバイル（タッチ hover）対応 | 構造的対象外 | collapsed sidebar は `md+` のみ存在（`< md` は drawer の expanded ラベル可視）。タッチ hover は対象外であり未タスクにもしない |

→ MINOR はいずれも責務独立のスコープ境界であり、本サイクルの blocker ではない。M-1 / M-2 / M-3 は今回の実装目的に必要な欠落ではないため、Phase 12 でも未タスク化しない。

## 10.6 進行判定

すべて計画 PASS・blocker 0。local semantic evidence は取得済み。visual gate で fail が出た場合は Phase 5 / 6 / 8 へ戻る。
