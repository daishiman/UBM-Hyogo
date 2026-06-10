# UI Sanity Visual Review — admin-sidebar-collapse-layout-fix

> **VISUAL 宣言**: 本タスクのタスク種別は **VISUAL**（collapsed/expanded サイドバーの見た目・中央軸・はみ出しが変わる）。
> workflow_state は `implemented_local_evidence_captured` であり、local screenshot 3 件を取得済み。
> 下記 Apple HIG 観点の視覚確認チェックリストは local fixture screenshot で確認済み。staging visual baseline は Phase 13 user-gated。

## 目的

折りたたみ（collapsed）/展開（expanded）サイドバーの視覚的整合を Apple Human Interface Guidelines の観点
（整列 / 中央軸 / 余白 / 視覚的階層）で確認する。本タスクは「collapsed 時に各行が `px-3` を剥がさず内側 16px に
icon/avatar/mark が溢れる + 中心軸不一致」を Tailwind className 分岐のみで是正するため、整列・中央軸・はみ出しが主な観点となる。

## 撮影結果（local fixture captured）

| TC | canonical 名 | viewport | 状態 | 対応 AC | 撮影状態 |
| --- | --- | --- | --- | --- | --- |
| TC-11-1 | `sidebar-collapsed-desktop.png` | 1280x800 | collapsed・全要素中央整列確認 | AC-1 / AC-2 / AC-3 / AC-4 | present |
| TC-11-2 | `sidebar-expanded-desktop.png` | 1280x800 | expanded・regression なし確認 | AC-5 | present |
| TC-11-3 | `sidebar-collapsed-user-menu-open.png` | 1280x800 | collapsed・user-menu popover open | AC-6（+ OOS-1 tooltip clip 実機確認） | present |

> 補助 viewport（必要に応じ）: mobile 390x844。ただし collapse トグルは `md:flex` の desktop aside のみ対象であり、
> mobile は `SidebarDrawer`（常に expanded 相当）で別経路のため、主証跡は desktop とする。

## Apple HIG 視覚確認チェックリスト

### collapsed（折りたたみ・TC-11-1 / TC-11-3）

| # | HIG 観点 | 確認項目 | 期待 | 判定 |
| --- | --- | --- | --- | --- |
| C-1 | 整列（Alignment） | brand / nav-item / user-menu / admin-return の水平パディングが除去（`px-0`）され、各行が `w-full justify-center` で中央寄せされる | 全行が中央寄せで左右非対称がない | PASS（local evidence captured） |
| C-2 | はみ出し（Clipping/Overflow） | icon(18px) / brand mark(32px) / avatar(36px) が collapsed 幅(64px) − aside `p-3`(24px) = 内側 40px 枠に収まり aside からはみ出さない | はみ出し・右ずれ・欠けがない | PASS（local evidence captured） |
| C-3 | 中央軸（Centering） | 全行のアイコン/アバターの水平中心が aside 縦中心線（左 12px + 20px = 32px）に一致し、footer の collapse-toggle とも軸が揃う（共通 40px 角枠） | 縦に通る 1 本の中心線上に全アイコンが乗る | PASS（local evidence captured） |
| C-4 | 視覚的階層（Hierarchy） | active nav-item の左ボーダー（`border-l-2` active 表現）が中央化レイアウトでも視認でき、現在地が分かる | active 行が他行と区別できる | PASS（local evidence captured） |
| C-5 | 余白（Spacing） | 各行の縦余白（`py-2`）が均等で、行間が詰まりすぎ/空きすぎでない | 行間リズムが一定 | PASS（local evidence captured） |
| C-6 | tooltip 視認性（OOS-1・baseline） | collapsed hover tooltip（`ubm-shell-tooltip`）が aside 右外で clip されず読めるか実機目視 | clip の有無を記録（改善は別関心 baseline） | pending（実装サイクル・実機目視） |

### expanded（展開・TC-11-2）

| # | HIG 観点 | 確認項目 | 期待 | 判定 |
| --- | --- | --- | --- | --- |
| E-1 | 整列（Alignment） | brand/nav-item/user-menu のアイコンとテキストが左端基準で整列し、既存 baseline どおり | regression なし | PASS（local evidence captured） |
| E-2 | 余白（Spacing） | 各行の `px-3 gap-*`（NavItem/admin-return=`gap-3` / UserMenu=`gap-2` / Brand=`gap-2`）が現行値を維持 | 余白が変化しない | PASS（local evidence captured） |
| E-3 | 視覚的階層（Hierarchy） | displayName/role のテキスト表示、active nav の強調、badge/chip の表示が既存どおり | 情報密度が変化しない | PASS（local evidence captured） |
| E-4 | 中央軸（Centering） | brand mark(32px 枠) と nav-item icon(18px 枠) のアイコン左端基準の軽微な不揃いが改善される（over-engineering は避ける） | 左端が揃う or 既存 baseline を壊さない | PASS（local evidence captured） |

## 代替 evidence（実行済み・jsdom 境界）

jsdom（focused vitest）は class / 属性付与までしか保証できず、`justify-center` / `w-full` / `px-0` / 40px 枠中央化の
描画結果（C-1..C-3 / E-1..E-4）は算出できない。その差分を実装サイクルの local fixture screenshot で埋める。

```bash
# focused vitest（collapsed/expanded className contract）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api | grep . && echo "[FAIL]" || echo "[PASS: api untouched]"
```

## 結論

local fixture screenshot 3 件で C-1..C-5 / E-1..E-4 は PASS。OOS-1 tooltip clip は baseline として記録し、staging 認証済み visual baseline のみ Phase 13 user-gated とする。
