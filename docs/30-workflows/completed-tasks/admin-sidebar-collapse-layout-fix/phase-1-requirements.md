# Phase 1: 要件定義

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- taskType: `implementation`
- visualEvidence: `VISUAL`（サイドバーの折りたたみ/展開の見た目が変わる）
- implementation_mode: `edit`（既存 shell コンポーネントを編集。新規は spec ファイルのみ）
- spec_classification: `implementation_spec`
- 実装区分: **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）
- workflow_state: `implemented_local_evidence_captured`（仕様書作成のみ。実装は 03.実装.md サイクルで実施）

## 実装区分の判定根拠（CONST_004）

ユーザー依頼は「サイドバーを折りたたんだ時のアイコンがはみ出している・アカウント情報が揃っていない・センターが揃っていない、collapsed の仕様がおかしいので整えて。expanded も問題があれば改善」。
これは **コンポーネントの Tailwind className（レイアウト/パディング/中央寄せ）の修正** を伴い、「整える・改善する」目的がコード変更なしには達成不能。よって **実装仕様書** とする。docs-only ではない。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch / dev に本是正が実装済みか | No（collapsed 時に各行が `px-3` を剥がさない現行コードを実 Read 確認） | 通常の実装 Phase とする |
| sidebar shell コンポーネントは存在するか | Yes（`apps/web/src/components/shell/` 一式が稼働中） | 既存編集（`implementation_mode: edit`） |
| 前提タスク（依存）は完了済みか | Yes（`unified-sidebar-shell` Task A/B/E が land 済み。本タスクはその上の bugfix） | 依存解消タスク不要 |

## 背景（スクリーンショットから確認された現象）

公開 `/members` ページ（左端に collapsed sidebar、最下部にユーザーアバター "万" と展開トグル ">"）で、
**折りたたみ（collapsed）状態**に以下の崩れが発生:

1. **アイコンはみ出し**: ナビアイコンがサイドバー枠（幅 64px）に収まらず右にずれる/欠けて見える。
2. **アカウント情報の不揃い**: 最下部のユーザーアバター行が他のナビ行と横位置が揃っていない。
3. **センター不一致**: 各要素（brand / nav アイコン / avatar / 展開トグル）の水平中心がバラバラで縦の中心線が通らない。

ユーザーは「collapsed の仕様がおかしいので整えて」「expanded も問題があれば改善」と包括的に依頼。

## 根本原因（コード調査で確定）

> すべて `apps/web` 表現層（コンポーネントの Tailwind className）。API/D1/Form/endpoint には原因がない（無罪）。

### collapsed 幅とパディングの算術

- collapsed 幅 = `--shell-bar-w-collapsed: 4rem` = **64px**（`apps/web/src/styles/tokens.css`）
- `<aside data-shell="sidebar">` の `p-3`（左右 12px×2 = 24px）→ 内側コンテンツ領域 = **40px**（`SidebarShell.tsx:102`）

### 該当箇所

| 現象 | 根本原因 | 該当箇所 |
| --- | --- | --- |
| アイコンはみ出し / 中心不一致 | nav item の className が collapsed 時も `px-3`(24px) を残す → 実効幅 40−24 = **16px** に icon 18px が収まらず溢れ、`justify-center` も 16px に潰され無効 | `SidebarNavItem.tsx:30` |
| アカウント行の不揃い | user-menu summary が collapsed 時も `px-3` を残す → avatar 36px が 16px に収まらず溢れる | `SidebarUserMenu.tsx:54` |
| brand の崩れ | brand に **collapsed 分岐そのものが無い**（常に `px-3 gap-2`、`justify-center` 無し）→ mark 32px が左寄せのまま溢れ、他要素と中心がずれる | `SidebarBrand.tsx:16` |
| admin 戻り導線の崩れ | AdminPublicReturn が collapsed 時も `px-3` を残す（admin role のみ表示） | `SidebarShell.tsx:32` |
| はみ出しのクリップ | `[data-shell="sidebar"]{overflow:hidden}` がはみ出しを切る。`SidebarNav.tsx:18` の collapsed 時 `overflow-visible` は nav 要素のもので親 aside の hidden 下では無効 | `globals.css:1986` / `SidebarNav.tsx:18` |

### 棄却した誤説（実 Read で裏取り済み・修正対象に含めない）

- 「`.ui-sidebar-user-avatar[data-size="md"]` が CSS で 40px、コンポーネントは `h-9 w-9`=36px で不整合」という指摘は **誤り**。
  `globals.css:270-504` の `.ui-sidebar-*` クラス群は現行 `shell/` コンポーネントで **一切使用されていない legacy CSS**
  （現行 `SidebarUserAvatar` は `data-shell-block="user-avatar"` のみ使い `ui-sidebar-user-avatar` クラスも `data-size` 属性も付けない）。
  40px 定義は現行 avatar にヒットしない。現行 avatar は `h-9 w-9`=36px で確定。→ この legacy CSS は触らない。

## 要件（スコープ = apps/web の sidebar shell のみ・不変条件 #1 #5 厳守）

collapsed 時に全要素が幅 64px 内で中央に整列する状態へ是正する。**API（apps/api）/ D1 schema / Google Form schema / endpoint surface / fetch URL は一切変更しない**。

### 是正の柱

1. **collapsed パディング除去（最重要）**: nav-item / user-menu / brand / admin-return の collapsed 時 className から `px-3` を外し、`px-0 w-full justify-center` へ移す（brand は分岐を新設）。
2. **アイコン枠の統一中央配置**: collapsed 時、各行のアイコン/アバター/brand mark を共通の **40px 角枠**で中央配置し、全行の水平中心を aside の縦中心線（左 12px + 20px）に一致させる。footer の collapse-toggle とも軸を揃える。
3. **active 表現の維持**: nav-item の `border-l-2` active 表現が中央寄せレイアウトで破綻しないこと。
4. **expanded regression 防止**: expanded（272px）は既存 visual baseline を壊さない。アイコン左端基準の軽微な不揃いがあれば固定幅枠で整列（over-engineering 回避）。

## Acceptance Criteria

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

## スコープ境界（CONST_007: 1 サイクル完結）

- **本サイクルで完結**: AC-1..AC-9（すべて `apps/web/src/components/shell/` の Tailwind className 修正 + テスト）。単一関心（collapsed/expanded レイアウト整合）で 1 実装サイクル（03.実装.md）で完了可能。**未タスク分離は原則 0 件**。
- **baseline（今サイクル起票なし）**:
  - **OOS-1**: collapsed 時の hover tooltip（`.ubm-shell-tooltip` は aside 右外に `position:absolute`）が `[data-shell="sidebar"]{overflow:hidden}` でクリップされうる問題。これを解くには collapsed 時の aside overflow 戦略変更（`overflow-x: visible` 化 or tooltip の `position: fixed` 化）が必要で、`height:100dvh` sticky レイアウトと全 viewport の縦スクロール挙動に影響するため独立検証を要する。主訴（はみ出し・中央揃え）とは因果が別の別関心。Phase 11 で clip の有無を実機確認し、改善判断になった場合のみ別タスク化を検討。
  - これは「分量が多い」等の先送りではなく、overflow 戦略変更が `height:100dvh` sticky と相互作用する**回帰リスクの分離**（CONST_007 例外: 技術的破綻リスク + 実施場所明記）。

## 既存コードベースの命名規則

| 対象 | 規則 | 実例 |
| --- | --- | --- |
| component ファイル | PascalCase | `SidebarNavItem.tsx` / `SidebarBrand.tsx` |
| test ファイル | co-location `*.spec.tsx`（不変条件 #8: `*.test.*` 禁止） | `__tests__/SidebarShell.spec.tsx` |
| data 属性 | `data-shell-block="<kebab>"` | `data-shell-block="nav-item"` / `"user-menu"` / `"brand"` |
| collapsed state 属性 | aside に `data-collapsed`、root に `data-shell-collapsed` | `data-collapsed="true"` |
| collapsed className 分岐 | テンプレートリテラル `${collapsed ? "..." : "..."}` | `SidebarNavItem.tsx:30` 既存パターン |
| デザイントークン | `--ubm-color-*` / `--ubm-space-*` / `--shell-bar-w*` | `var(--shell-bar-w-collapsed)` |

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| shell 親（aside / footer） | `apps/web/src/components/shell/SidebarShell.tsx` | 編集対象（AdminPublicReturn / aside layout） |
| nav item | `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集対象（collapsed px / icon 枠） |
| user menu | `apps/web/src/components/shell/SidebarUserMenu.tsx` | 編集対象（collapsed px / avatar 枠） |
| brand | `apps/web/src/components/shell/SidebarBrand.tsx` | 編集対象（collapsed 分岐新設） |
| nav container | `apps/web/src/components/shell/SidebarNav.tsx` | overflow 整合確認（任意） |
| avatar | `apps/web/src/components/shell/SidebarUserAvatar.tsx` | 参照（h-9 w-9=36px の現行サイズ確認。原則無変更） |
| tooltip | `apps/web/src/components/shell/SidebarTooltip.tsx` | 参照（OOS-1 の overflow clip 関連） |
| CSS 正本 | `apps/web/src/styles/globals.css` / `tokens.css` | 参照（`[data-shell="sidebar"]` overflow / `--shell-bar-w-collapsed`）。原則無変更 |
| 既存 shell test | `apps/web/src/components/shell/__tests__/*.spec.tsx` | 更新 / 追加対象 |

### システム仕様（aiworkflow-requirements）

> 実装前に以下のシステム仕様を確認し、既存設計との整合性を確保する。参照ファイル名は Phase 2 で resource-map から確定する。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/` 内 design tokens / UI 仕様 | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | shell ナビ / 画面構成の正本 |

## 完了条件

AC-1..AC-9 が Phase 2 以降へ trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録されている。
本タスクは `apps/web` の sidebar shell に閉じ、未タスク分離 0 件（OOS-1 は baseline 記録のみ）であること。
