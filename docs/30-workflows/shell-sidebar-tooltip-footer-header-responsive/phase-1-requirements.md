---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 1
phase_name: 要件定義
created_at: 2026-06-03
task_type: implementation
visual_category: VISUAL
implementation_mode: new
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
source_request: ユーザー直接依頼（サイドバー collapsed ツールチップ / フッター常時表示 / モバイルヘッダー常時表示）
---

# Phase 1: 要件定義

[実装区分: 実装仕様書] — 3 改善はいずれもコンポーネント新規追加・既存 shell コンポーネント編集・CSS 変更を伴い、「ホバーで内容がわかる」「常に表示される」という目的はドキュメントのみでは達成できない（CONST_004: ユーザーは特に docs-only を指定していないが、仮に指定があっても実態優先で実装仕様書とする）。

## 1.1 ゴール

公開 staging のスクリーンショットを起点としたユーザー依頼を、3 レーンの実装に分解する。

1. **レーン A（collapsed ツールチップ）**: サイドバーを閉じた（collapsed）時、ナビゲーションアイコン等の icon-only コントロールにマウスホバー（およびキーボードフォーカス）すると、その項目のラベル（「会員ディレクトリ」「マイページ」等）がツールチップで表示される。ユーザーが「何をしているのか」をホバーで把握できるようにする。
2. **レーン B（フッター sticky 固定）**: 公開サイトのフッター（プライバシーポリシー / 利用規約 / 著作権）を画面下端に固定し、スクロール位置に関わらず常時表示する（ユーザー確定: sticky bottom）。
3. **レーン C（モバイルヘッダー sticky 固定）**: スマートフォン表示（`< md`）時のヘッダー帯（mobile-bar）を画面上端に固定し、スクロール中も常時表示する。

## 1.2 現状（調査結果）

| 対象 | 現状実装 | 問題 |
|------|----------|------|
| collapsed nav | `SidebarNavItem.tsx`：collapsed 時 `justify-center gap-0`、ラベルは `<span className="sr-only">`。`<a>`/`<Link>` に `title` 無し | アイコンのみで意味不明・ホバーで何も出ない |
| collapsed 公開に戻る | `SidebarShell.tsx` `AdminPublicReturn`：collapsed 時のみ `title="公開サイトに戻る"` 付与 | native title のみ（遅延大・見た目貧弱・他コントロールは未対応） |
| collapsed ユーザーメニュー / collapse toggle | `aria-label` のみ。ホバー視覚表示なし | アイコンのみで意味不明 |
| 公開フッター | `legacy-public.css` `[data-component="public-footer"]`：`margin-top: auto`（C4 でコンテンツ末尾に配置済み）。`position` 指定なし（static） | スクロール上端側にいると見えない＝「常時表示」でない |
| モバイルヘッダー（mobile-bar） | `SidebarShell.tsx`：`flex ... bg-[var(--shell-bar-bg)] px-3 py-2 md:hidden`。`position` 指定なし（static） | スクロールすると一緒に流れて画面外へ消える |

> Tooltip 専用ライブラリ（radix-ui / headlessui 等）は **未導入**。`apps/web/src/components/ui/` に汎用 Tooltip primitive も無い。ユーザー確定方針により、shell 固有の軽量 `SidebarTooltip`（CSS カスタムツールチップ）を新設する。

## 1.3 スコープ（変更対象ファイル一覧）

### 新規（2）

| # | path | レーン | 修正内容 |
|---|------|--------|---------|
| 1 | `apps/web/src/components/shell/SidebarTooltip.tsx` | A | CSS カスタムツールチップの shell 固有 wrapper（Client）。children（icon-only コントロール）を包み、`role="tooltip"` バブルを描画。表示は CSS `:hover`/`:focus-within` 駆動。`collapsed === false` の場合はラップせず children をそのまま返す |
| 2 | `apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx` | A | tooltip の DOM 契約（role / id / aria-describedby 連携 / collapsed=false パススルー / label 表示）を検証 |

### 編集（コード 6 / テスト 5 / CSS 2）

| # | path | レーン | 修正内容 |
|---|------|--------|---------|
| 3 | `apps/web/src/components/shell/SidebarNavItem.tsx` | A | collapsed 時に nav `<a>`/`<Link>` を `SidebarTooltip` でラップ（label を渡す）。`aria-describedby` 連携。sr-only ラベルは accessible name として維持 |
| 4 | `apps/web/src/components/shell/SidebarUserMenu.tsx` | A | collapsed 時、avatar trigger（`<summary>`）を `SidebarTooltip`（label="ユーザーメニュー"）でラップ |
| 5 | `apps/web/src/components/shell/SidebarCollapseToggle.tsx` | A | collapsed 時、トグルボタンを `SidebarTooltip`（label="サイドバーを展開"）でラップ |
| 6 | `apps/web/src/components/shell/SidebarShell.tsx` | A + C | A: `AdminPublicReturn` の `title` 属性を `SidebarTooltip`（label="公開サイトに戻る"）へ置換。C: mobile-bar `<div data-shell="mobile-bar">` に `sticky top-0 z-30` を付与 |
| 7 | `apps/web/src/styles/globals.css` | A | shell セクションに `.ubm-shell-tooltip` 系 CSS（位置 / 表示トリガ / token 色・影・角丸）を追加 |
| 8 | `apps/web/src/styles/legacy-public.css` | B | `[data-component="public-footer"]` を `position: sticky; bottom: 0; z-index; background: var(--ubm-color-surface-bg)` 化 |
| 9 | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | A | collapsed で tooltip ラップ・`aria-describedby` 配線・expanded で非ラップを assert |
| 10 | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | A + C | mobile-bar の `sticky`/`top-0`/`z-30` class、AdminPublicReturn の tooltip 化を assert |
| 11 | `apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx` | A | collapsed で tooltip ラップを assert（既存無ければ新規） |

> **PublicFooter.tsx は変更しない**: レーン B は `legacy-public.css` の CSS のみで達成する（`[data-component="public-footer"]` selector 既存）。

## 1.4 受け入れ条件（AC）

### レーン A（collapsed ツールチップ）

| ID | 内容 | 検証方法 |
|----|------|---------|
| AC-A1 | collapsed 時、nav item をホバー / フォーカスするとラベルがツールチップ（`role="tooltip"`）として表示される | `SidebarTooltip.spec` / `SidebarNavItem.spec`：collapsed render で `role="tooltip"` 要素が存在し textContent=label |
| AC-A2 | expanded 時はツールチップを描画しない（ラベルが既に可視のため） | `SidebarNavItem.spec`：expanded render で tooltip wrapper 不在（children 直返し） |
| AC-A3 | tooltip は `role="tooltip"` + 一意 `id` を持ち、trigger に `aria-describedby={id}` が付く | `SidebarTooltip.spec`：trigger の `aria-describedby` が tooltip `id` と一致 |
| AC-A4 | tooltip の背景 / 文字色 / 影 / 角丸は `tokens.css` 経由（HEX 直書き / `bg-[#xxx]` なし） | `verify:tokens` green + `globals.css` の grep（HEX 0） |
| AC-A5 | AdminPublicReturn / UserMenu trigger / CollapseToggle も collapsed 時 tooltip 表示 | `SidebarShell.spec` / `SidebarCollapseToggle.spec`：各 collapsed で tooltip 要素存在 |
| AC-A6 | 既存のアクセシブル名（sr-only ラベル / aria-label）を壊さず、二重読み上げにならない | `SidebarNavItem.spec`：collapsed でリンクの accessible name が label のまま（tooltip は description）。axe 違反 0 |

### レーン B（フッター sticky 固定）

| ID | 内容 | 検証方法 |
|----|------|---------|
| AC-B1 | 公開フッターが viewport 下端に sticky 固定され、スクロール中も常時表示される | Phase 11 Playwright visual（`public-footer-sticky-bottom.png`）+ 手動スクロール確認 |
| AC-B2 | フッター背景が不透明（`--ubm-color-surface-bg`）でコンテンツがフッター下を透けない | `legacy-public.css` の grep（`background: var(--ubm-color-surface-bg)`）+ visual |
| AC-B3 | フッターの色は token 経由（HEX なし） | `verify:tokens` green |

### レーン C（モバイルヘッダー sticky 固定）

| ID | 内容 | 検証方法 |
|----|------|---------|
| AC-C1 | `< md` で mobile-bar が `sticky top-0` 固定、スクロール中も表示 | `SidebarShell.spec`：mobile-bar class に `sticky` / `top-0` + Phase 11 手動スクロール |
| AC-C2 | mobile-bar の z-index が drawer（z-40）より下・コンテンツより上（`z-30`） | `SidebarShell.spec`：class に `z-30` |
| AC-C3 | `md` 以上では mobile-bar は従来通り hidden（回帰なし） | `SidebarShell.spec`：class に `md:hidden` が維持されている |

## 1.5 不変条件

- **I-1**: API endpoint / D1 / Google Form schema / auth middleware に触らない（CLAUDE.md 不変条件 #5・UI prototype alignment 不変条件 #1）。本タスクは純 `apps/web` UI。`apps/api` 差分は 0。
- **I-2**: 色・寸法は `tokens.css` 経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate 対象）。ツールチップ・フッター背景も token 経由。
- **I-3**: 新規 primitive は shell 固有の `SidebarTooltip` 1 個のみ。`apps/web/src/components/ui/` の汎用 primitive は増やさない（プロトタイプ正本順位 #3）。
- **I-4**: state owner は既存 `useSidebarState` 1 系のみ。ツールチップは CSS（`:hover` / `:focus-within`）駆動で新規 JS state を持たない。
- **I-5**: collapsed 判定は既存 `collapsed` prop 由来。新規の collapsed source を作らない。
- **I-6**: breakpoint 判定は CSS（Tailwind `md:`）正本。mobile-bar の `md:hidden`（表示制御）は不変、`sticky top-0 z-30`（固定）のみ追加。
- **I-7**: 新規 test は `*.spec.{ts,tsx}` のみ（CLAUDE.md 不変条件 #8）。
- **I-8**: 既存 a11y（aria-label / sr-only ラベル / aria-current / role="dialog" drawer）を壊さない。

## 1.6 スコープ外（先送りではない責務境界）

- 汎用 Tooltip primitive の `apps/web/src/components/ui/` 化 → 本タスクは shell 固有 chrome に閉じる（汎用化は YAGNI。将来 admin table 等で実需要が発生した時点で改めて判断する。本サイクルでは未使用 API を増やすため未タスク化しない）。
- フッターの会員 / 管理レイアウトへの sticky 適用 → 会員レイアウトは現状フッター無し、管理レイアウトは sidebar footer（C1 で sticky 済み）。本タスクは公開フッターのみ。
- ツールチップのモバイル（タッチ）対応 → collapsed サイドバーは `md+` の desktop/tablet のみ存在（`< md` は drawer 表示で常に expanded ラベル可視）。タッチ hover は構造的に対象外。
- 既存 collapse cookie / drawer / responsive 挙動（Task E 系）の変更 → 不変。

## 1.7 P50 チェック

| # | 項目 | 結果 |
|---|------|------|
| P50-1 | ユーザー依頼が `[実装区分: 実装仕様書]` に該当（コード変更必須） | YES（CONST_004 実態判定） |
| P50-2 | 前提実装（C1-C4 = commit `41292e38a`）が dev に存在 | YES（現ブランチは dev 先端 = `41292e38a` を含む。collapsed / mobile-bar / public-footer の現行実装を前提に積む） |
| P50-3 | 既存 shell コンポーネント（SidebarNavItem / SidebarUserMenu / SidebarCollapseToggle / SidebarShell）と `collapsed` prop 伝播が存在 | YES（調査確認済） |
| P50-4 | `tokens.css` の surface/text/border/shadow/radius token + `verify-design-tokens` gate 稼働 | YES（task-18 導入済） |
| P50-5 | 既存 shell test（`SidebarShell.spec.tsx` 等）が Vitest + RTL で `data-shell-block` query パターン | YES（調査確認済） |
| P50-6 | apps/web の vitest filter 名・実行コマンド | YES（`apps/web/package.json`：`vitest run --root=../.. --config=vitest.config.ts apps/web`） |
| P50-7 | Playwright staging-visual-authenticated project が稼働（Phase 11 baseline 用） | YES（`apps/web/playwright/tests/visual-staging-authenticated/`） |

→ 全 P50 PASS。新規 cycle（`implementation_mode: new`）として Phase 2 着手可能。前提タスクは存在せず（C1-C4 は dev 既マージ済み）、本タスク単独で 1 サイクル完了可能（CONST_007 充足）。
