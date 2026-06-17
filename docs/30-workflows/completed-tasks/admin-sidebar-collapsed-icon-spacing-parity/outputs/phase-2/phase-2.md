# Phase 2: 設計

**[実装区分: 実装仕様書]**

## 1. 既存コンポーネント再利用可否（FB-SDK-07-1）

| 観点 | 判定 |
|------|------|
| 新規コンポーネント追加 | **不要**。既存 `SidebarNavItem` / `SidebarShell` の className 条件分岐を修正するのみ |
| 新規 primitive | 生やさない（不変条件 #3） |
| 新規 token | 不要。`h-[18px]` は既存 arbitrary value パターン（展開時アイコン箱と同値）を流用 |

→ 新規 UI 実装ゼロ。品質・アクセシビリティ・HIG 準拠は既存レベルを維持。

## 2. 縦リズムの構造分析（状態所有権・責務境界）

```
SidebarShell (div, p-3, gap-3, w=272px/64px collapsed)
└─ SidebarNav (nav, flex-col, gap-3)            ← グループ間: 両状態共通
   └─ SidebarNavGroup × 3 (section, flex-col, gap-1)
      ├─ div nav-group-label (collapsed: sr-only / expanded: px-3 pt-2)
      └─ ul (flex-col, gap-0.5)                  ← 行間: 両状態共通 2px
         └─ SidebarNavItem (li > Link)
            ├─ Link (py-2, collapsed: w-full justify-center gap-0 px-0 / expanded: gap-3 px-3)
            │                          ↑ py-2(16px) 両状態共通
            └─ span icon-box ★ collapsed: h-10 w-10(40px) / expanded: h-[18px](18px)  ← ここだけ差が出る
               └─ ShellIcon svg (固定 18×18px)   ← グリフは container に依存しない
```

| レベル | クラス | collapsed | expanded | 差の有無 |
|--------|--------|-----------|----------|----------|
| グループ間 | `SidebarNav` gap-3 | 12px | 12px | なし |
| ラベル↔リスト | `SidebarNavGroup` gap-1 | 4px | 4px | なし（collapsed はラベル sr-only） |
| 行間 | `ul` gap-0.5 | 2px | 2px | なし |
| リンク上下 padding | `py-2` | 16px | 16px | なし |
| **アイコン箱の高さ** | **icon-box** | **40px** | **18px** | **★ +22px（真因）** |
| グリフ実寸 | `ShellIcon` | 18px | 18px | なし |

**結論**: 縦間隔差の唯一の発生源は icon-box の高さ差（40px vs 18px）。`py-2` を含む他要素は全て両状態共通。

## 3. 状態所有権（混在しないこと）

- `mode`（expanded/collapsed）の所有権は `useSidebarState` にあり、本変更は**所有権に非接触**。
- 描画責務は `SidebarNavItem`（presentational）。className の高さ値変更は描画責務内に閉じる。
- Facade/Engine/Service/Bridge/Store/UI の所有権混在なし（純粋 UI 層）。

## 4. 修正設計（Before / After）

| 対象 / 行 | Before | After | 理由 |
|-----------|--------|-------|------|
| `SidebarNavItem.tsx:35` icon-box | `${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}` | `${collapsed ? "h-[18px] w-10" : "h-[18px] w-[18px]"}` | 高さを展開時と同じ 18px に。幅 `w-10` は中央寄せ視覚バランスのため保持（背景なしで視覚影響ゼロ・任意） |
| `SidebarShell.tsx:36` public-return icon-box | `${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}` | `${collapsed ? "h-[18px] w-10" : "h-[18px] w-[18px]"}` | nav 行と同じ縦リズムへ統一（AC-5） |

### 4.1 ピッチ検算

- After collapsed 行ピッチ = `py-2`(16px) + icon-box(18px) + `ul gap-0.5`(2px) = **36px**
- expanded 行ピッチ = `py-2`(16px) + 行高 ~20px（text-sm line-height 優位） + `gap-0.5`(2px) = **約 38px**
- 差 ±2px（AC-1 許容内）。微差が気になる場合は collapsed icon-box を `h-5`(20px) に上げて完全一致させる選択肢を Phase 5 に残す。

### 4.2 タップ領域 / アクセシビリティの確認

- リンクの水平タップ幅は `w-full`（折りたたみバー内幅 40px）で不変。
- 縦タップ高は 56px → 36px に縮小するが、これは**展開時の行と同一**であり既存基準内。WCAG 2.5.8（最小 24px）を満たす。
- hover/active 背景は Link（`w-full`）が描画。icon-box は背景なしのため見た目の hover 領域は Link 高（36px）に追従。

## 5. ライブラリ選定

- 新規ライブラリ採用なし。Tailwind v4 既存 utility のみ。

## 6. SubAgent lane / validation path

| lane | 担当 | 並列可 |
|------|------|--------|
| A | Phase 4（テスト）/ 5（実装）/ 6（テスト拡充）/ 7（カバレッジ） | — |
| B | Phase 8（リファクタ）/ 9（QA）/ 10（最終レビュー）| A と並列可（独立 doc） |
| C | Phase 11（証跡仕様）/ 12（ドキュメント 7点）/ 13（PR） | A,B と並列可 |
| validation | gate スクリプト（phase12-compliance / gate-metadata / validate-phase-output） | 直列で締め |

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| `h-[18px]` の arbitrary value が `verify-design-tokens` で色リテラル誤検出 | 色ではなくサイズ。`verify-design-tokens` は HEX 色のみ検出のため非該当。既存 `h-[18px]` が同ファイルに存在し前例あり |
| 既存 spec の class assertion 破壊 | `SidebarNavItem.spec.tsx` は href/aria/active/textContent を検証。高さ class を直接 assert していなければ非破壊（Phase 4 で確認） |
| collapsed と expanded のアイコンが完全同寸になり「折りたたみ感」消失 | グリフは元から両状態 18px。box 高のみ変更で水平バー幅（64px vs 272px）の差で折りたたみは明確に区別可能 |
