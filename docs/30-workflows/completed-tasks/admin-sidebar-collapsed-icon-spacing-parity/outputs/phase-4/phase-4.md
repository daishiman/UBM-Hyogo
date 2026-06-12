# Phase 4: テスト作成（TDD RED 設計）

**[実装区分: 実装仕様書]**

## 0. メタ

| key | value |
|-----|-------|
| workflow_id | admin-sidebar-collapsed-icon-spacing-parity |
| phase | 4（テスト作成 / RED） |
| 対象 | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`（既存ファイルへ追加） |
| test runner | vitest + @testing-library/react（jsdom） |
| test suffix | `*.spec.tsx` のみ（`.test.` 禁止 = 不変条件 #8） |

## 実行タスク

1. 既存 `SidebarNavItem.spec.tsx` に collapsed 時の icon-box 高さクラスを assert する回帰テストを追加する。
2. テストは jsdom 上の **className assertion**（実際の px レイアウトは測らない）で設計する。
3. 実装前は TC-1 / TC-2 が fail（RED）することを確認する。

## 参照資料

- `apps/web/src/components/shell/SidebarNavItem.tsx`（真因 L35: collapsed 時 `h-10 w-10`）
- `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`（既存テスト構造）
- Phase 1 受入条件 AC-2 / AC-3 / AC-4 / AC-7
- Phase 2 縦リズム構造分析

## 1. テスト戦略（なぜ className assertion か）

jsdom はレイアウトを計算しないため、行ピッチ（px）を `getBoundingClientRect` で測ることはできない（常に 0 を返す）。
よって AC-1（ピッチ ±2px 一致）は **Phase 11 の screenshot** で証跡化し、Phase 4 ではその真因クラスである **icon-box の高さクラス文字列**を assert することで RED→GREEN を担保する。

- collapsed 時に icon-box span が `h-10`（40px）を **含まない**こと、期待値 `h-[18px]` を **含む**ことを検証する。
- expanded 時は現状 `h-[18px] w-[18px]` が**不変**であることを検証（回帰 guard）。

## 2. テスト操作対象（VSCPKR-03 対応）

- 操作対象は外部 prop **`collapsed`**（boolean）。コンポーネント内部の state ではない。
- `SidebarNavItem` は純 presentational component（内部 state を持たず、props と `usePathname` のみで描画）。
- private method は存在しない → **private method テストは不要**。

## 3. 追加テストケース

| ID | ケース名 | 入力 props | 期待 className（icon-box span） | 根拠 |
|----|---------|-----------|-------------------------------|------|
| TC-1 | collapsed で h-10 を含まない | `collapsed={true}` | `h-10` を含まない | 真因クラスの除去確認（AC-1 の代理） |
| TC-2 | collapsed で h-[18px] を含む | `collapsed={true}` | `h-[18px]` を含む / `w-10` を含む | 確定修正値の適用確認（AC-3 の水平中央維持: `w-10` 据え置き） |
| TC-3 | expanded は h-[18px] w-[18px] 維持 | `collapsed={false}` | `h-[18px]` と `w-[18px]` を含む | expanded 不変回帰（AC-4） |
| TC-4 | collapsed でも a11y 不変 | `collapsed={true}` | icon span に `aria-hidden="true"` / ラベル span に `sr-only` | AC-4 DOM・a11y 不変 |

### icon-box span の取得方法

`render(<ul><SidebarNavItem .../></ul>)` の `container` から、`aria-hidden="true"` を持ちかつ `ShellIcon`（svg）を内包する span を取得する。
既存テストと同じ `container.querySelector` 系で取得する（例: `container.querySelector('span[aria-hidden="true"]')` のうち icon を内包する先頭 span）。className 判定は `classList.contains("h-10")` / `.contains("h-[18px]")` で行う。

## 4. 期待 RED

| ID | 実装前の結果 | 理由 |
|----|------------|------|
| TC-1 | **FAIL** | 現状 collapsed は `h-10 w-10` のため `h-10` を含む |
| TC-2 | **FAIL** | 現状 `h-[18px]` を含まない |
| TC-3 | PASS（不変確認） | expanded は変更しないため初めから green |
| TC-4 | PASS（不変確認） | a11y 属性は変更しないため初めから green |

→ TC-1 / TC-2 が RED であることを確認してから Phase 5 の実装に進む。

## 5. 既存テストへの影響

- 既存ケース（external anchor / active 判定 / collapsed sr-only label 等）は変更しない。追加のみ。
- 実装（h-10 → h-[18px]）後も既存ケースは全 PASS する（icon-box 高さに依存していないため）= AC-7 回帰なし。
