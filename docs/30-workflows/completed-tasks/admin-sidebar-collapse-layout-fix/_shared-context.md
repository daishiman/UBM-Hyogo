# 共有設計コンテキスト — admin-sidebar-collapse-layout-fix

> Phase 4-13 を生成する各 SubAgent はまずこのファイルを読むこと。Phase 1-3（要件・設計・設計レビュー）で
> 確定した正本をここに凝縮している。各 Phase 成果物はこの内容に矛盾してはならない。

## 1. タスク identity

- task_id: `admin-sidebar-collapse-layout-fix`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。CSS/Tailwind レイアウト修正でコード変更必須）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `edit`
- status / workflow_state: `implemented_local_evidence_captured`（実装・focused vitest・local screenshot 取得済み。commit / push / PR / staging visual は user-gated）
- スコープ: `apps/web` の sidebar shell コンポーネント群のみ。API/D1/Form/endpoint 非変更（不変条件 #1 #5）
- canonical_workflow: `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/`
- created_at: 2026-06-08

## 2. ユーザー依頼（原文要約）

公開/会員/管理で共通の左サイドバーについて、**折りたたんだ（collapsed）時**に
(a) ナビアイコンがサイドバー枠からはみ出す
(b) ユーザーアカウント情報（アバター行）が他要素と揃っていない
(c) 各要素の中心（センター）が揃っていない
という崩れが起きている。collapsed の仕様を整えること。**開いた（expanded）時**にも問題があれば併せて改善する。

（添付スクリーンショットは公開 `/members` ページ。左端に collapsed sidebar のアイコン列、最下部に
ユーザーアバター "万" と展開トグル ">" が見える。）

## 3. 根本原因（コード実Readで確定済み・API/D1/Form 無罪）

すべて **apps/web 表現層（コンポーネントの Tailwind className）** に起因する。

### 3.1 collapsed 幅とパディングの算術

- collapsed sidebar 幅 = CSS 変数 `--shell-bar-w-collapsed: 4rem` = **64px**（`apps/web/src/styles/tokens.css`）
- `<aside data-shell="sidebar">` に `p-3`（左右 12px×2 = 24px）→ 内側コンテンツ領域 = **40px**
  （`SidebarShell.tsx:102` の className `... p-3 ...`）

### 3.2 各行要素が collapsed 時も `px-3` を剥がさない（主因）

| ファイル:行 | 現状の className（抜粋） | 問題 |
| --- | --- | --- |
| `SidebarNavItem.tsx:30` | `relative flex items-center rounded-sm px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-3"}` | `px-3`(24px) が collapsed 時も残る → 実効幅 40−24 = **16px** に icon 18px が収まらず溢れる。`justify-center` も 16px 領域に潰され無効 |
| `SidebarUserMenu.tsx:54` | `relative flex ... px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-2"}` | 同上。avatar 36px が 16px に収まらず溢れる（= アカウント情報の崩れ） |
| `SidebarBrand.tsx:16` | `flex items-center gap-2 rounded-sm px-3 py-2 ...`（**collapsed 分岐が存在しない**） | brand mark `h-8 w-8`(32px) が 16px に収まらず溢れる。中央寄せもされない |
| `SidebarShell.tsx:32`（`AdminPublicReturn`） | `flex items-center rounded-sm px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-3"}` | 同 NavItem（admin role のみ表示） |

### 3.3 中心軸がバラつく副因

- collapsed 時、`SidebarBrand` だけ `justify-center` を持たない（他 3 行は持つ）→ brand のみ左寄せ、他は中央寄せ意図 → 縦の中心線が不一致
- 全行に `px-3` が残るため `justify-center` 指定要素も実際は中央化されず、要素ごとに見かけの中心がずれる
- footer の `SidebarCollapseToggle` は collapsed 時 `flex justify-center`（`SidebarShell.tsx:110`）で中央 → トグルだけ中央で他要素と不揃いに見える

### 3.4 overflow の関与

- `[data-shell="sidebar"] { overflow: hidden }`（`globals.css:1986`）で aside がはみ出しをクリップ
- `SidebarNav.tsx:18` の collapsed 時 `overflow-visible` は nav 要素のもので、親 aside の `overflow:hidden` 下では無効
- → はみ出した icon は右にずれて見えるか、クリップで欠けて見える（どちらも「崩れ」として知覚される）

### 3.5 Explore 誤判定の棄却（実 Read で裏取り済み — 仕様書に書かない／修正対象にしない）

- 「`.ui-sidebar-user-avatar[data-size="md"]` が 40px、コンポーネントは `h-9 w-9`=36px で不整合」という指摘は **誤り**。
  `globals.css:270-504` の `.ui-sidebar-*` クラス群は現行 `shell/` コンポーネントで **一切使用されていない legacy CSS**
  （`SidebarUserAvatar` は `data-shell-block="user-avatar"` のみ使い、`ui-sidebar-user-avatar` クラスも `data-size` 属性も付けない）。
  よって 40px 定義は現行 avatar にヒットせず、不整合は **存在しない**。現行 avatar サイズは `h-9 w-9`=36px で確定。
  → **この legacy CSS は本タスクの修正対象に含めない**。

## 4. 修正方針（確定）

collapsed 時、各行要素の水平パディングを除去し、固定アイコン枠で中央寄せして縦中心線を一致させる。

### 4.1 数値設計（collapsed）

- aside collapsed 64px − aside `p-3`(24px) = 内側 **40px**
- 各行（brand / nav-item / user-menu / admin-return）collapsed 時: `w-full` + `justify-center` + `px-0`（水平パディング 0）
- 各行のアイコン/アバターを共通の **40px 角タップ枠**（`h-10 w-10` 相当）に中央配置する
  - icon 18px → 40px 枠中央（左右 11px 余白）→ はみ出さない
  - avatar 36px → 40px 枠中央（左右 2px）→ はみ出さない
  - brand mark 32px → 40px 枠中央 → はみ出さない
  - これにより全行のアイコン水平中心が aside の縦中心線（左 12px + 20px = 32px）に一致し、collapse-toggle とも揃う

### 4.2 className 分岐の指針（Phase 5 実装手順で逐語確定）

ベース className から `px-3` を外し、`${collapsed ? "justify-center gap-0 px-0 py-2 w-full" : "gap-3 px-3 py-2"}` の形へ移す。
（`SidebarBrand` は collapsed 分岐そのものを新設。`gap` 値は各コンポーネントの現行 expanded 値を維持。）
アイコン span は collapsed 時に `h-10 w-10`（または既存枠を中央化する `justify-center w-full`）で統一する。

### 4.3 active styling 維持

`SidebarNavItem.tsx:88` の `border-l-2 border-transparent data-[active=true]:border-[var(--ubm-color-accent)]` は維持。
collapsed 中央寄せでも左ボーダー active 表現が破綻しないこと（中央化レイアウトと両立確認）。

### 4.4 expanded 時

expanded（272px）は大きな破綻なし。**regression を出さない**ことを最優先とし、
brand mark(32px 枠) と nav-item icon(18px 枠) のアイコン左端基準の軽微な不揃いがあれば、
nav-item アイコン枠を固定幅化して左端を揃える（over-engineering は避け、既存 visual baseline を壊さない範囲）。

### 4.5 color tokens（不変条件 #2）

色は `var(--ubm-color-*)` 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の新規追加禁止。`pnpm verify:tokens` green 必須。
本修正は spacing/layout（`px-*` `justify-*` `w-*` `h-*`）中心で、色トークンは既存のまま。

## 5. 変更対象ファイル（確定）

| # | パス | 種別 | 変更概要 |
| --- | --- | --- | --- |
| 1 | `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集 | L30 itemClassName: collapsed 時 `px-0 w-full justify-center`、icon span 40px 枠中央 |
| 2 | `apps/web/src/components/shell/SidebarUserMenu.tsx` | 編集 | L54 summary: collapsed 時 `px-0 w-full justify-center`、avatar 40px 枠中央 |
| 3 | `apps/web/src/components/shell/SidebarBrand.tsx` | 編集 | L16/L24: collapsed 分岐を新設（`px-0 justify-center`）、mark 40px 枠中央 |
| 4 | `apps/web/src/components/shell/SidebarShell.tsx` | 編集 | L32 AdminPublicReturn: collapsed 時 `px-0 w-full justify-center`（NavItem と統一） |
| 5 | `apps/web/src/components/shell/SidebarNav.tsx` | 編集（任意） | L18 overflow の扱い見直し（はみ出し解消後の整合確認。挙動不変なら無変更可） |

テスト（co-location `*.spec.tsx`・不変条件 #8）:

| パス | 種別 |
| --- | --- |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 更新（collapsed class assertion 追加） |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 更新（collapsed class assertion 追加） |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 更新（collapsed レイアウト contract 追加） |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 更新（brand collapsed contract を含む横断検証） |

> CSS 正本 `globals.css` は原則 **触らない**（Tailwind className 分岐で完結）。
> もし tooltip overflow（§7 OOS-1）対応を本サイクルに含める判断になった場合のみ globals.css を編集対象に追加する。

## 6. Acceptance Criteria（正本。全 Phase が trace する）

| ID | 条件 | 検証 Phase |
| --- | --- | --- |
| AC-1 | collapsed 時、brand / nav-item / user-menu / admin-return の水平パディングが除去（`px-0`）され、各行が `w-full justify-center` で中央寄せされる | Phase 4/5/9/11 |
| AC-2 | collapsed 時、icon(18px) / brand mark(32px) / avatar(36px) が collapsed 幅(64px) 内に収まり、aside からはみ出さない | Phase 5/6/9/11 |
| AC-3 | collapsed 時、全行のアイコン/アバターの水平中心が aside の縦中心線に一致し、footer の collapse-toggle とも軸が揃う（共通 40px 角枠） | Phase 5/6/9/11 |
| AC-4 | collapsed 時もアクティブ nav-item の左ボーダー（`border-l-2` active 表現）が破綻せず維持される | Phase 6/9/11 |
| AC-5 | expanded 時にレイアウト regression がない（テキスト/アイコン配置・既存 spec 維持）。アイコン左端基準の軽微な不揃いは改善 | Phase 9/10/11 |
| AC-6 | collapsed 時に sr-only 化される displayName/role、expanded 時の表示テキストなどアカウント情報の意味的可視性が保たれる | Phase 6/9/11 |
| AC-7 | 色は `var(--ubm-color-*)` 経由のみ。`apps/web/src` 配下に HEX/`bg-[#xxx]`/`text-[#xxx]` の新規追加なし。`pnpm verify:tokens` green | Phase 6/7/9 |
| AC-8 | API(`apps/api`)/D1 migration/Google Form schema/endpoint surface/fetch URL が無変更（不変条件 #1 #5）。`apps/api` の git diff 空 | Phase 9 |
| AC-9 | `pnpm typecheck && pnpm lint && focused vitest` green。shell spec が collapsed レイアウト contract を検証 | Phase 9/10 |

## 7. スコープ境界（CONST_007: 1 サイクル完結）

- **本サイクルで完結**: AC-1..AC-9（すべて apps/web の sidebar shell コンポーネントの Tailwind className 修正 + テスト）。
  単一関心（collapsed/expanded レイアウト整合）で 1 実装サイクル（03.実装.md）で完了可能。**未タスク分離は原則 0 件**。
- **baseline（未タスク候補・今サイクルでは起票しない / Phase 12 unassigned-task-detection に baseline 記録）**:
  - **OOS-1**: collapsed 時の hover tooltip（`.ubm-shell-tooltip` は aside の右外に `position:absolute` で出る）が
    `[data-shell="sidebar"]{overflow:hidden}` でクリップされうる問題。これを解くには collapsed 時の aside overflow 戦略変更
    （`overflow-x: visible` 化 or tooltip の `position: fixed` 化）が必要で、`height:100dvh` sticky レイアウトと
    全 viewport の縦スクロール挙動に影響するため独立検証を要する。主訴（はみ出し・中央揃え）とは因果が別の別関心。
    → Phase 11 で clip の有無を実機確認し、clip が確認され改善判断になった場合のみ別タスク化を検討（baseline）。
  - これは「分量が多い」等の先送りではなく、overflow 戦略変更が height:100dvh sticky と相互作用する**回帰リスクの分離**（CONST_007 例外: 技術的破綻リスク + 実施場所明記）。

## 8. 検証コマンド（local green 基準）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
# focused vitest（repo root が vitest root のためフルパス + --root 指定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__
git diff --name-only -- apps/api   # 空であること（AC-8）
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/artifacts.json docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/outputs/artifacts.json
```

> 注: vitest config の root は repo ルート。targeted run は `apps/web/src/components/shell/__tests__` をパス指定し `--root=.` を付ける
> （`unified-sidebar-shell` 系で確認済みのパターン。`--root` 省略で No test files になる罠）。

## 9. Phase 11 evidence 方針（VISUAL / implemented_local_evidence_captured）

- local screenshot は **取得済み**。`outputs/phase-11/screenshot-inventory.json` は
  `status: "captured_local_fixture"`、各 screenshot エントリ `status: "present"`、PNG ファイルは 3 件。
- 撮影済みケース: collapsed desktop / expanded desktop / collapsed の user-menu open。
- staging 認証済み screenshot・実機撮影・commit/push/PR は Phase 13 user-gated。

## 10. gates 方針（implemented_local_evidence_captured）

- Gate-A（spec_review）: `passed`（Phase 1-13 実装仕様書を authored、真因と apps/web-only scope 確定、未タスク分離 0）
- Gate-B（implementation_review）: `passed`（実装済み）
- Gate-C（external_ops）: `pending`（commit/push/PR/staging visual は user-gated）

## 11. 既存コードベースの命名規則（不変条件・踏襲）

| 対象 | 規則 | 実例 |
| --- | --- | --- |
| component ファイル | PascalCase | `SidebarNavItem.tsx` / `SidebarBrand.tsx` |
| test ファイル | co-location `*.spec.tsx`（不変条件 #8: `*.test.*` 禁止） | `__tests__/SidebarShell.spec.tsx` |
| data 属性 | `data-shell-block="<kebab>"` | `data-shell-block="nav-item"` / `"user-menu"` / `"brand"` |
| collapsed state 属性 | aside に `data-collapsed`、root に `data-shell-collapsed` | `data-collapsed="true"` |
| デザイントークン | `--ubm-color-*` / `--ubm-space-*` / `--shell-bar-w*` | `var(--shell-bar-w-collapsed)` |
| collapsed className 分岐 | テンプレートリテラル `${collapsed ? "..." : "..."}` | `SidebarNavItem.tsx:30` 既存パターン |
