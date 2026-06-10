# 実装ガイド — admin-sidebar-collapse-layout-fix

本ガイドは「サイドバー collapsed/expanded レイアウト是正」タスクの実装ガイドである。Part 1（初学者・中学生レベル）と
Part 2（開発者・技術者レベル）の 2 部構成で記す。本タスクは `implemented_local_evidence_captured` であり、apps/web の実コード差分・focused vitest・
local Playwright screenshot は本サイクルで取得済みである。Part 2 末尾の検証コマンドは実行済みである。
className 断片は実コード（`apps/web/src/components/shell/*.tsx`）を Read して引用しており、手書き推測ではない。

---

## Part 1: やさしい説明（中学生レベル）

### なぜ必要か（先に「困りごと」から）

パソコンの画面の左はしに、メニューが並んだ「ほそ長い棚（たな＝サイドバー）」があるとします。この棚は、
ボタンを押すと「広げた状態（中の文字も見える）」と「たたんだ状態（アイコンだけの細い棚）」を切りかえられます。
ところが今は、棚を**たたんだとき**に、アイコンが棚のわくからはみ出したり、いちばん下の「あなたのアカウント（顔のマーク）」が
他のアイコンとそろっていなかったりして、見た目がガタガタになっています。せっかくスッキリ見せるためにたたんだのに、
かえって散らかって見えてしまうので、たたんだときの並びをきれいに整える必要があります。

### 何が壊れているか（3 つの困りごと）

1. **アイコンが棚からはみ出す**: たたんだ細い棚（横はば 64 ますぶん）の中なのに、アイコンの左右に「すきま（よはく）」を
   入れる設定（`px-3`）がそのまま残っているため、アイコンを置く場所が狭くなりすぎて、はみ出してしまいます。
   小さいお弁当箱に、ふちの飾りを大きくつけたままおかずを詰めようとして、おかずが箱からあふれるような状態です。
2. **アカウントの顔マークがそろわない**: いちばん下の顔マーク（アバター）も同じ理由で、置く場所が足りずにずれます。
3. **まんなかの線がそろわない**: アイコンを「まんなかに置く」つもりの指定があるのに、よけいなよはくのせいで
   実際にはまんなかにならず、行ごとに中心の位置がバラバラに見えます。いちばん上のロゴ（ブランド）にいたっては
   「たたんだとき用の指定」がそもそも無く、ひとりだけ左寄りになっています。

### 何をするか（棚を整える例え）

本だなに本を立てるとき、本の高さがそろうように仕切り板（しきりいた）を立てて、まんなかにそろえて並べると、
ずっと見やすくなりますよね。このタスクでやるのは、まさに「たたんだ棚のために、よけいなよはくを取って、
ぜんぶのアイコンを同じ大きさのまんなかわくにそろえて置き直す」作業です。

- **よけいなよはくを取る**: たたんだときは左右のよはく（`px-3`）をゼロ（`px-0`）にします。
- **同じ大きさのまんなかわくを用意する**: ロゴ・メニュー・アカウント・もどるボタンのアイコンを、ぜんぶ「40 ますぶんの
  四角いわく」のまんなかに置きます。こうすると、どの行のアイコンも左右の中心がぴったりそろい、棚からもはみ出しません。
- **ロゴにもたたんだとき用の指定を足す**: 今まで無かったロゴの「たたんだとき」の並べ方を新しく足して、ほかの行とそろえます。

### どこまでやるか（やること・やらないこと）

今回やるのは、あくまで「**たたんだ／広げた棚の並べ方（見た目）を整える**」ところまでです。色や文字の意味は変えません。
画面のデータを取ってくるしくみ（サーバーのプログラム）にもいっさいさわりません。
また、たたんだときにアイコンの右に出る「ふきだし（マウスを乗せると名前が出る小さな説明）」が、棚のふちで切れてしまう
別の問題（OOS-1）は、直すと棚の高さやスクロールの動き全体に影響が出やすい（＝こわれやすい）ので、今回は「切れているか確認する」
だけにとどめ、直すかどうかは別の宿題（別タスク）として切り分けます。

### 専門用語セルフチェック

| 専門用語の例 | 日常語への言い換え例 |
| --- | --- |
| collapsed（コラプスト） | 「たたんだ状態（アイコンだけの細い棚）」 |
| expanded（エクスパンデッド） | 「広げた状態（文字も見える棚）」 |
| パディング（padding / `px-3`） | 「中身のまわりに入れるすきま・よはく」 |
| 中央寄せ（justify-center） | 「ものを左右のまんなかにそろえて置くこと」 |
| className（クラス名） | 「見た目をきめる『名前付きの設定ふだ』」 |
| トークン（デザイントークン） | 「色やよはくを決める『共通の色見本・物差し』」 |

---

## Part 2: 技術詳細（開発者レベル）

### 全体方針

- **`apps/web` の sidebar shell コンポーネント完結の UI/UX 是正**。新しい API endpoint / D1 schema / Google Form schema / fetch URL は一切追加・変更しない（不変条件 #1 #5、AC-8）。
- 崩れの根本原因（`_shared-context.md` §3 で実 Read 確定）: collapsed 幅 `--shell-bar-w-collapsed: 4rem`(64px) − aside `p-3`(24px) = 内側 40px に対し、
  各行が `px-3`(24px) を collapsed 時も剥がさないため実効幅 16px となり、icon 18px / avatar 36px / brand mark 32px が収まらず溢れる。
  さらに `justify-center` も 16px 領域に潰されて無効化し、`SidebarBrand` は collapsed 分岐自体が存在しないため左寄せのまま縦中心線が不一致になる。
- 修正は spacing/layout（`px-*` `justify-*` `w-*` `h-*`）の className 分岐のみ。新トークン / 新 primitive は生やさない（不変条件 #2 #3）。
- 色は `var(--ubm-color-*)` 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の新規追加なし（AC-7、`verify:design-tokens` gate）。色トークンは既存のまま変更しない。
- Explore の「`.ui-sidebar-user-avatar[data-size="md"]` 40px 不整合説」は legacy CSS が現行 shell で未配線のため棄却（`_shared-context.md` §3.5）。修正対象に含めない。

### 変更 4 コンポーネント（+ 任意 1）の Before → After 要約

className 断片は実コードから引用（行番号は本仕様作成時点）。

| # | ファイル | 種別 | Before（実コード引用） | After（修正方針） |
| --- | --- | --- | --- | --- |
| 1 | `apps/web/src/components/shell/SidebarNavItem.tsx`（L30 `itemClassName`） | 編集 | `relative flex items-center rounded-sm px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-3"}` | collapsed 時に `px-3` を分岐外へ移し `${collapsed ? "justify-center gap-0 px-0 py-2 w-full" : "gap-3 px-3 py-2"}` 形へ。icon span（L33-36 `inline-flex h-[18px] w-[18px] ...`）を collapsed 時 40px 角枠中央へ（AC-1/2/3/4） |
| 2 | `apps/web/src/components/shell/SidebarUserMenu.tsx`（L54 summary） | 編集 | `relative flex cursor-pointer list-none items-center rounded-sm px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-2"}` | collapsed 時に `px-0 w-full justify-center` を分岐へ移す。`SidebarUserAvatar size="md"`(36px) を 40px 角枠中央へ（AC-1/2/3/6） |
| 3 | `apps/web/src/components/shell/SidebarBrand.tsx`（L16 / L24） | 編集 | `flex items-center gap-2 rounded-sm px-3 py-2 focus-visible:...`（**collapsed 分岐なし**）。mark span `inline-flex h-8 w-8 ...`（32px） | collapsed 分岐を新設し `${collapsed ? "justify-center gap-0 px-0 w-full" : "gap-2 px-3"}` 形へ。mark を 40px 角枠中央へ。L24 の `collapsed ? "sr-only" : "..."` は維持（AC-1/2/3） |
| 4 | `apps/web/src/components/shell/SidebarShell.tsx`（L32 `AdminPublicReturn`） | 編集 | `flex items-center rounded-sm px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-3"}` | NavItem と統一し collapsed 時 `px-0 w-full justify-center`。icon span（L34-37 `inline-flex h-[18px] w-[18px] ...`）を 40px 角枠中央へ（AC-1/2/3） |
| 5 | `apps/web/src/components/shell/SidebarNav.tsx`（L18） | 無変更 | `flex flex-1 flex-col gap-3 ${collapsed ? "overflow-visible" : "overflow-y-auto"}` | はみ出し解消後の overflow 整合を確認し、挙動不変のため無変更 |

テスト（co-location `*.spec.tsx`・不変条件 #8）:

| パス | 種別 | 検証内容 |
| --- | --- | --- |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 更新 | collapsed 時 className に `px-0` / `w-full` / `justify-center` を含み、`px-3` を含まないこと。active 行で `data-[active=true]:border-[var(--ubm-color-accent)]` 維持 |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 更新 | collapsed 時 summary className の中央化 class assertion。displayName/role span が `sr-only`（AC-6） |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 更新 | collapsed レイアウト contract（全行が共通中央化 class を共有）。`aside[data-collapsed]` 整合 |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 更新 | `SidebarShell` 経由で brand/nav/public-return/user-menu の collapsed contract をまとめて検証。brand は collapsed 時 `justify-center px-0` と 40px mark 枠を確認 |

### className 設計（collapsed 分岐の指針）

- ベース className から `px-3` を外し、`${collapsed ? "justify-center gap-0 px-0 py-2 w-full" : "gap-3 px-3 py-2"}` の形へ移す。
  `gap` 値は各コンポーネントの現行 expanded 値を維持（NavItem/AdminPublicReturn=`gap-3` / UserMenu=`gap-2` / Brand=`gap-2`）。
- 各行のアイコン/アバター span を collapsed 時に共通の **40px 角タップ枠**（`h-10 w-10` 相当の `inline-flex items-center justify-center`）で中央配置する。
  - icon 18px → 40px 枠中央（左右 11px 余白）→ はみ出さない
  - avatar 36px → 40px 枠中央（左右 2px）→ はみ出さない
  - brand mark 32px → 40px 枠中央 → はみ出さない
- これにより全行のアイコン水平中心が aside 縦中心線（左 12px + 20px = 32px）に一致し、footer の `SidebarCollapseToggle`
  （`SidebarShell.tsx:110` の collapsed 時 `flex justify-center`）とも軸が揃う（AC-3）。
- `SidebarBrand` は collapsed 分岐そのものを新設する（現状は分岐なしで左寄せ）。

### active styling 維持（AC-4）

`SidebarNavItem.tsx:88` の `border-l-2 border-transparent data-[active=true]:border-[var(--ubm-color-accent)]
data-[active=true]:bg-[var(--shell-active-bg)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent-ink)]` は維持する。
collapsed 中央寄せでも左ボーダー active 表現が破綻しないことを spec / 視覚確認で両立検証する。

### トークン使用（HEX 直書き禁止・AC-7）

本修正は spacing/layout 中心で色トークンは既存のまま。新規に `oklch(...)` / `#rrggbb` / `bg-[#...]` / `text-[#...]` を書かない。
既存の `text-[var(--ubm-color-text-primary)]` / `hover:bg-[var(--shell-active-bg)]` / `border-[var(--ubm-color-accent)]` 等は変更せず保持する。
`mise exec -- pnpm verify:tokens` を green に保つ（不変条件 #2）。

### エッジケース・既知制限

| ケース | 挙動 / 制限 |
| --- | --- |
| collapsed の displayName/role | `SidebarUserMenu.tsx:57` の `collapsed ? "sr-only" : "..."` を維持し、意味的可視性を保つ（AC-6） |
| collapsed の nav-item ラベル | `SidebarNavItem.tsx:39` の `collapsed ? "sr-only" : "flex-1"` を維持。中央化は icon span のみ対象 |
| collapsed の external link 矢印 | `SidebarNavItem.tsx:43` の `item.external && !collapsed` で collapsed 時非表示。中央化と両立 |
| collapsed の badge dot | `SidebarNavItem.tsx:48-55` の `absolute right-1 top-1` dot は 40px 枠中央化後も absolute 配置で破綻しない（要視覚確認） |
| collapsed hover tooltip clip（OOS-1） | **本タスクのスコープ外（baseline）**。`[data-shell="sidebar"]{overflow:hidden}`（`globals.css:1986`）下で aside 右外 `position:absolute` の `ubm-shell-tooltip` が clip されうる。overflow 戦略変更は `height:100dvh` sticky と相互作用する回帰リスクのため別タスク候補（`unassigned-task-detection.md`） |
| mobile drawer | `SidebarDrawer`（`SidebarShell.tsx:116`）は常に expanded 相当で本修正対象外。collapse トグルは `md:flex` の desktop aside のみ |
| expanded regression | expanded は大きな破綻なし。`px-3 gap-*` の現行値を維持し regression を出さないことを最優先（AC-5） |

### 検証コマンド（実行済み）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
# focused vitest（repo root が vitest root のためパス指定 + --root=. を付ける。省略で No test files の罠）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__
# API 非変更（AC-8）
git diff --name-only -- apps/api   # 空であること
```

### 視覚証跡

本タスクは VISUAL（collapsed/expanded サイドバーの見た目が変わる）であるため、
pixel screenshot は **captured_local_fixture** として本サイクルで取得済みである（PNG 3 件）。
`outputs/phase-11/screenshot-inventory.json` は `status: "captured_local_fixture"`、各 screenshot エントリは `status: "present"` で
local visual evidence を表現する。staging 認証済み baseline は Phase 13 user-gated とする。詳細は [`../../phase-11-manual-test.md`](../../phase-11-manual-test.md) と
[`../phase-11/manual-test-result.md`](../phase-11/manual-test-result.md) を参照する。
