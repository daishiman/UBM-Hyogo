# Phase 2: 設計

## 設計方針サマリ

collapsed 時の崩れは「各行が `px-3` を剥がさず内側 16px に圧縮される」ことが単一の真因。
したがって設計は **(1) collapsed 時の水平パディング除去 + (2) 共通 40px 角アイコン枠での中央配置** の 2 点に集約する。
CSS 正本（`globals.css`）は触らず、コンポーネントの Tailwind className 分岐で完結させる（既存の `${collapsed ? ...}` パターンを踏襲）。

## 既存コンポーネント再利用可否（[FB-SDK-07-1]）

新規 primitive / 新規 component は作らない。`SidebarShell` 配下の既存 4 コンポーネントの className を編集するのみ。
共通の 40px 角アイコン枠は新規ヘルパー関数化せず、各コンポーネントの既存 icon/avatar wrapper span に collapsed 分岐クラスを追記する（重複は最小・可読性優先）。

## レイアウト数値設計（collapsed）

```
aside (collapsed)        = 64px  (--shell-bar-w-collapsed)
  └ aside padding p-3    = 12px × 2 = 24px
     └ 内側コンテンツ領域 = 40px           ← 各行の利用可能幅
        └ 行 px (修正後)  = 0px (px-0)     ← 修正前は px-3 = 24px が残り実効16px
        └ 行 実効幅       = 40px
           └ アイコン枠   = 40px 角 (h-10 w-10) を w-full justify-center で中央
              ├ nav icon  = 18px  → 枠中央（左右余白 11px）  ✅ 収まる
              ├ avatar    = 36px  → 枠中央（左右余白 2px）   ✅ 収まる
              └ brand mark= 32px  → 枠中央（左右余白 4px）   ✅ 収まる
```

縦中心線: aside 左端から `12px(p-3) + 20px(40px枠の中心)` = **32px**（= 64px の中央）。
全行のアイコン中心がこの 32px に揃い、footer の collapse-toggle（`flex justify-center`）とも一致する。

## コンポーネント別 className 変更設計

> 実際の逐語的 before/after は Phase 5（実装手順）で確定する。ここでは設計上の差分方針を固定する。

### D-1. `SidebarNavItem.tsx`（`itemClassName` L30）

| 項目 | Before | After（設計） |
| --- | --- | --- |
| 水平パディング | `px-3`（常時） | ベースから `px-3` を除去し、`${collapsed ? "justify-center gap-0 px-0 w-full py-2" : "gap-3 px-3 py-2"}` |
| icon span（L33-38） | `inline-flex h-[18px] w-[18px] ...` | collapsed 時は `h-10 w-10`（40px 角）で中央化する wrapper を追加 or `${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}` + 内側 SVG は 18px 維持 |
| badge dot（L48-54） | `absolute right-1 top-1` | collapsed 時の 40px 枠基準で右上に収まるよう維持（はみ出し確認） |

decision: icon は collapsed 時 40px 角枠で中央、内側の `ShellIcon`（18px SVG）は変えない。badge dot は枠内右上に収める。

### D-2. `SidebarUserMenu.tsx`（`summary` className L54）

| 項目 | Before | After（設計） |
| --- | --- | --- |
| 水平パディング | `px-3`（常時） | `${collapsed ? "justify-center gap-0 px-0 w-full py-2" : "gap-2 px-3 py-2"}` |
| avatar wrapper | `SidebarUserAvatar size="md"`（36px） | collapsed 時は avatar を 40px 角枠で中央化（`SidebarUserAvatar` 自体は無変更、summary 側で中央寄せ） |
| popover（L76-79） | `absolute bottom-full left-0` | 中央寄せレイアウトでも popover 位置が破綻しないこと（left-0 維持で確認） |

decision: `SidebarUserAvatar` は無変更（36px のまま）。summary の中央寄せで avatar を 40px 枠内中央に置く。

### D-3. `SidebarBrand.tsx`（Link className L16・**collapsed 分岐新設**）

| 項目 | Before | After（設計） |
| --- | --- | --- |
| 水平パディング | `px-3 gap-2`（collapsed 分岐なし） | `${collapsed ? "justify-center gap-0 px-0 w-full py-2" : "gap-2 px-3 py-2"}` |
| mark span（L18-23） | `inline-flex h-8 w-8 ...`（32px） | collapsed 時 40px 角枠で中央化（mark は 32px 維持） |
| text span（L24-29） | `${collapsed ? "sr-only" : "flex flex-col ..."}` | 無変更（既に collapsed で sr-only） |

decision: brand に props `collapsed`（既存）を使い、Link className に collapsed 分岐を追加する。

### D-4. `SidebarShell.tsx`（`AdminPublicReturn` L32）

| 項目 | Before | After（設計） |
| --- | --- | --- |
| 水平パディング | `px-3 ... ${collapsed ? "justify-center gap-0" : "gap-3"}` | `${collapsed ? "justify-center gap-0 px-0 w-full py-2" : "gap-3 px-3 py-2"}` |
| icon span（L34-39） | `h-[18px] w-[18px]` | nav-item と同じ collapsed 40px 枠中央化で統一 |

decision: AdminPublicReturn は nav-item と同一の collapsed レイアウト規約に揃える（admin role のみ表示だが軸を統一）。

### D-5. `SidebarNav.tsx`（L18 overflow・任意）

| 項目 | Before | 判断 |
| --- | --- | --- |
| collapsed overflow | `overflow-visible` | はみ出しが px-0 中央化で解消されれば nav の overflow-visible は実害なし。挙動不変なら **無変更**。Phase 9 QA で「collapsed 時に縦スクロールが必要なほど nav 項目が多い場合の挙動」を確認し、問題があれば `overflow-y-auto overflow-x-hidden` 等へ調整 |

decision: 原則無変更。AC-2 達成（はみ出し解消）後に regression がないことを確認する保険的扱い。

## state ownership / 状態所有権（変更なしの確認）

| 状態 | 所有者 | 本タスクでの変更 |
| --- | --- | --- |
| collapsed/expanded mode | `useSidebarState`（client hook）+ cookie | 変更なし（レイアウトのみ修正） |
| drawer open | `useSidebarState` | 変更なし |
| active path | `usePathname` + `activePath` fallback | 変更なし |

本タスクは **表現層（className）のみ** を変える。状態管理・データフロー・props 契約は一切変更しない。

## 因果ループ（システム観点）

- バランスループ: collapsed 幅 64px は固定（token）→ 内側 40px は固定 → 行の水平パディングを 0 にすると icon/avatar が枠内に必ず収まる（はみ出しの強化ループを断つ）。
- 責務境界: レイアウト整列は各コンポーネントの className が所有。CSS 正本（globals.css）の `[data-shell="sidebar"]` surface 定義（overflow/sticky）は触らない → CSS とコンポーネントの責務を混在させない。

## デザイントークン整合（不変条件 #2）

- 変更は `px-*` / `py-*` / `gap-*` / `w-*` / `h-*` / `justify-*` の spacing/layout utility のみ。色トークンは追加・変更しない。
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を **新規追加しない**。`verify:tokens` の forbidden-color-literal scan に新規ヒットを出さない。
- `--shell-bar-w-collapsed`（64px）は参照のみ。トークン値は変更しない。

## システム仕様参照の確定（resource-map）

| 観点 | aiworkflow-requirements 参照先 | 整合確認 |
| --- | --- | --- |
| UI/UX | `references/ui-ux-*.md`（navigation / shell） | shell の collapsed/expanded 契約・data 属性を変えない |
| design-tokens | design tokens 仕様 | OKLch トークン正本・HEX 禁止を遵守 |

新規インターフェース/型/定数の追加は **なし**（Step 2 は N/A 見込み）。

## 設計の前提（Phase 3 でゲート判定）

1. collapsed のはみ出し・中心不一致は `px-3` 残存が単一真因であり、px-0 + 中央枠で解消する。
2. CSS 正本（globals.css）は触らずコンポーネント className で完結する（OOS-1 tooltip overflow を含めない限り）。
3. expanded は regression を出さない（既存 visual baseline を維持）。
4. API/D1/Form/endpoint は無変更（不変条件 #1 #5）。
