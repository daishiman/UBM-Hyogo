---
task_id: shell-sidebar-tooltip-footer-header-responsive
spec_classification: implementation_spec
state: implemented_local_evidence_captured
created_at: 2026-06-03
task_type: implementation
visual_category: VISUAL
implementation_mode: new
parent_workflow: null
source_request: ユーザー直接依頼（サイドバー collapsed アイコンのツールチップ / フッター常時表示 / モバイルヘッダー常時表示）
branch: feat/shell-sidebar-tooltip-footer-header-responsive
---

# shell サイドバー collapsed ツールチップ + フッター sticky 固定 + モバイルヘッダー sticky 固定

UBM 兵庫支部会メンバーサイト `apps/web` の shell（サイドバー / フッター / モバイルヘッダー）の UX を 3 点改善する実装仕様書ディレクトリ。2026-06-03 の automation-30 改善サイクルで実コードへ反映し、focused shell Vitest 5 files / 33 tests、web typecheck、web lint、web verify-design-tokens、root verify:tokens の PASS と local browser screenshots 3 PNG present まで確認した。staging visual screenshot / commit / push / PR は user-gated。

## 実装区分

`[実装区分: 実装仕様書]` — 3 改善はいずれもコンポーネント新規追加・既存 shell コンポーネント編集・CSS 変更を伴い、ドキュメントのみでは「ホバーで内容がわかる」「常に表示される」という目的を達成できない（CONST_004: 実態優先で実装仕様書と判定）。

## 背景 / 元依頼

公開 staging（`ubm-hyogo-web-staging`）のスクリーンショットを起点に、ユーザーから次の 3 点の改善依頼を受けた:

1. **サイドバー collapsed 時のアイコンが何の機能か分からない** → ホバー（およびフォーカス）でラベルをツールチップ表示し、何をしているのかが分かるようにする。
2. **フッターを常に表示したい** → 公開サイトのフッターを画面下端に sticky 固定し、スクロール中も常時表示する（ユーザー確定: sticky bottom）。
3. **ヘッダーをスマートフォン表示で常に表示したい** → モバイル（`< md`）のヘッダー帯（mobile-bar）を sticky top 固定し、スクロール中も常時表示する。

## ゴール（3 レーン）

| レーン | 概要 | 主担当ファイル |
|--------|------|----------------|
| **A: collapsed ツールチップ** | 新規 `SidebarTooltip`（CSS カスタムツールチップ）を作り、collapsed 時の icon-only コントロール（nav item / 公開に戻る / ユーザーメニュー / collapse toggle）をラップしてホバー/フォーカスでラベルを表示。`tokens.css` の色・影・角丸を使用、`role="tooltip"` + `aria-describedby` で a11y 連携。 | `SidebarTooltip.tsx`（新規）、`SidebarNavItem.tsx` / `SidebarShell.tsx` / `SidebarUserMenu.tsx` / `SidebarCollapseToggle.tsx`（編集）、`globals.css`（ツールチップ CSS） |
| **B: フッター sticky 固定** | 公開フッター `[data-component="public-footer"]` を `position: sticky; bottom: 0` 化し、不透明背景（surface-bg token）で常時表示。 | `legacy-public.css`（編集） |
| **C: モバイルヘッダー sticky 固定** | mobile-bar に `sticky top-0 z-30` を付与し、`< md` でスクロール中も固定表示。z-index は drawer（z-40）より下・コンテンツより上。 | `SidebarShell.tsx`（mobile-bar 帯・編集） |

## スコープ（変更対象ファイル一覧）

### 新規（2）

| path | レーン | 種別 |
|------|--------|------|
| `apps/web/src/components/shell/SidebarTooltip.tsx` | A | 新規 Client component |
| `apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx` | A | 新規 test |

### 編集（コード 7 / CSS 2）

| path | レーン | 種別 |
|------|--------|------|
| `apps/web/src/components/shell/SidebarNavItem.tsx` | A | 編集（collapsed で tooltip ラップ） |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | A | 編集（collapsed の avatar trigger に tooltip） |
| `apps/web/src/components/shell/SidebarCollapseToggle.tsx` | A | 編集（collapsed で tooltip） |
| `apps/web/src/components/shell/SidebarShell.tsx` | A + C | 編集（AdminPublicReturn の `title` を tooltip 化 / mobile-bar に `sticky top-0 z-30`） |
| `apps/web/src/styles/globals.css` | A | 編集（ツールチップ CSS・shell セクション） |
| `apps/web/src/styles/legacy-public.css` | B | 編集（public-footer sticky bottom） |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | A | 編集（collapsed tooltip 配線 assert） |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | A + C | 編集（mobile-bar sticky / AdminPublicReturn tooltip assert） |
| `apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx` | A | 新規（collapsed tooltip assert） |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | A | 編集（summary 内 tooltip assert） |

> **B（フッター）と C（ヘッダー）の検証境界**: Lane B は純粋な CSS（`position: sticky`）変更のため jsdom unit test では sticky 挙動を検証できない。Lane B の主検証は Phase 11 の Playwright visual baseline + 手動スクロール確認とする（honest scope）。Lane C は mobile-bar の class（`sticky top-0 z-30`）を `SidebarShell.spec.tsx` で assert（DOM 契約）+ Phase 11 で実スクロール確認。

## Phase 一覧

| Phase | 名称 | ファイル |
|-------|------|---------|
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計 | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA / CI gate | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / Evidence | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | PR | [phase-13-pr.md](phase-13-pr.md) |

## 不変条件（要旨）

- **I-1**: API endpoint / D1 / Google Form schema / auth middleware は不変（CLAUDE.md 不変条件 #5・UI prototype alignment 不変条件 #1）。本タスクは純 `apps/web` UI。
- **I-2**: 色・寸法は `tokens.css` 経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` CI gate 対象）。ツールチップ・フッター背景も token 経由。
- **I-3**: 新規 primitive は shell 固有の `SidebarTooltip` 1 個のみ。`apps/web/src/components/ui/` の汎用 primitive は増やさない（プロトタイプ正本順位 #3: 未掲載画面も既存 primitives で構成、shell collapsed tooltip は shell 固有 chrome のため shell 配下に閉じる）。
- **I-4**: state owner は既存 `useSidebarState` 1 系のみ。ツールチップは CSS（`:hover` / `:focus-within`）駆動で新規 JS state を持たない（I-E2 系の踏襲）。
- **I-5**: collapsed 判定は既存 `collapsed` prop 由来。新規の collapsed source を作らない。
- **I-6**: breakpoint 判定は CSS（Tailwind `md:`）を正本とする。mobile-bar の表示/非表示（`md:hidden`）は不変、sticky 化のみ追加。
- **I-7**: 新規 test は `*.spec.{ts,tsx}` のみ（CLAUDE.md 不変条件 #8）。
- **I-8**: 既存の a11y（aria-label / sr-only ラベル / aria-current）を壊さない。ツールチップ追加でアクセシブル名が二重読み上げにならない設計とする。

## 関連 / 参照

- 直近コミット `41292e38a`（C1-C4: sidebar footer 固定 / collapse はみ出し / account popover / main footer sticky）が前提。本タスクはその上に積む。
- 既存 shell 実装: `apps/web/src/components/shell/`（SidebarShell / SidebarNavItem / SidebarUserMenu / SidebarCollapseToggle / shell-config / icons）
- 公開フッター: `apps/web/src/components/public/PublicFooter.tsx` + `apps/web/src/styles/legacy-public.css`
- デザイントークン正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md`
