---
task_id: sidebar-footer-pinning-and-account-popover-ux
spec_classification: implementation_spec
state: implemented_local_evidence_captured
created_at: 2026-06-02
task_type: implementation
visual_category: VISUAL
implementation_mode: new
issue: null
issue_state: none
parent_workflow: docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/
source_task: ユーザー報告（2026-06-02 staging スクリーンショット: 公開ホームページ `/` を admin 閲覧時の sidebar / footer UI/UX 不具合）
branch: feat/sidebar-footer-pinning-and-account-popover-ux
---

# sidebar footer 固定 + アカウント popover 外側クリック閉じ + collapse はみ出し + main footer sticky

UBM 兵庫支部会メンバーサイトの **統一 sidebar shell（`apps/web/src/components/shell/`）の UI/UX 不具合 4 件**を 1 実装サイクルで解消した Phase 1-13 単一責務実装仕様書ディレクトリ。本サイクルで実コード・focused component tests・Phase 11/12 同期まで反映済み。commit / push / PR / staging authenticated screenshot は user-gated。

## 実装区分

`[実装区分: 実装仕様書]` — CSS レイアウト（`globals.css` / `legacy-public.css`）と React コンポーネント（`SidebarShell.tsx` / `SidebarUserMenu.tsx` / `SidebarNavItem.tsx`）の編集を伴う UI/UX 修正であり、コード変更なしには「常に最下部に見える」「外側クリックで閉じる」「はみ出さない」という目的が達成できないため（CONST_004）。ユーザー依頼も「タスク仕様書に起こして」＝実装前提。docs-only ではない。

## ユーザー報告（原文要約）

staging（`ubm-hyogo-web-staging`）の **公開ホームページ `/` を管理者ログイン状態で閲覧**したスクリーンショットに対する報告:

1. **下部の「公開サイトに戻る」とユーザーアイコンがスクロールしないと表示されない** → 常に最下部に見えるようにしたい。プライバシーポリシー・利用規約も同様。
2. **フッター部分（プライバシーポリシー / 利用規約 / コピーライト）がうまく機能していない**ように見える。
3. **サイドバーを閉じた（collapse）時、アイコンの部分がはみ出してしまう**。
4. **アイコンをホバー/クリックで表示される「プロフィール編集 / 申請 / 管理者ダッシュボード」メニューが、他の場所をクリックしても閉じない**（常に開きっぱなし。アイコンを再度押さないと閉じない）→ 管理できるようにしたい。

## 根本原因（コード調査結果）

| # | 症状 | 根本原因 | 対象 |
|---|------|---------|------|
| C1 | 下部の「公開サイトに戻る」/ ユーザーメニュー / collapse トグルがスクロールしないと見えない | `[data-shell="sidebar"]` が `min-height: 100vh`（**高さ固定でない**）。admin nav は 14 項目（`SidebarShell.spec` 確認）で viewport を超え、`<aside>` 全体が伸長 → 下部領域が画面外へ押し出される。`position: sticky; top: 0` のため上端は固定されるが下端は fold 下。nav の `flex-1 overflow-y-auto` は親が伸びるため発火しない。 | `globals.css`（`[data-shell="sidebar"]`）/ `SidebarShell.tsx`（aside レイアウト） |
| C2 | collapse 時アイコンがはみ出す | collapse 幅 `--shell-bar-w-collapsed: 4rem`（64px）に対し、各 nav item / public-return / user-menu summary が `px-3`（左右 24px）+ `gap-3`（12px）+ アイコン/アバターのまま左寄せレイアウトを維持し、aside に `overflow` クリップが無い。badge（Chip）は collapsed でも padding を持ち横にはみ出す。 | `SidebarShell.tsx`（aside `overflow`）/ `SidebarNavItem.tsx` / `SidebarUserMenu.tsx` / `SidebarShell.tsx` 内 `AdminPublicReturn` |
| C3 | アカウント popover が外側クリックで閉じない | `SidebarUserMenu` は ネイティブ `<details>` ベース。`<details>` は **summary 以外の外側クリックでは閉じない**（route 変化時のみ `useEffect` で `open=false`）。Escape も未対応。 | `SidebarUserMenu.tsx` |
| C4 | main footer がうまく機能しない | `PublicFooter`（`(public)/layout.tsx` のみ描画）は `[data-component="public-footer"] { margin-top: 40px }` 固定で、`<main data-shell="main">` が `flex-1` のみ（flex column でない）。コンテンツが短いページで footer が viewport 最下部に張り付かず中途半端な位置になる（sticky footer 不成立）。 | `SidebarShell.tsx`（`<main>`）/ `legacy-public.css`（`public-footer`） |

## 受入条件（AC）

- **AC-1**: デスクトップ（md+）sidebar で nav 項目が viewport を超えても、「公開サイトに戻る」（admin のみ）・ユーザーアバター/メニュー・collapse トグルが**常に画面最下部に固定表示**される（ページスクロール不要）。**nav 領域のみが内部スクロール**する。
- **AC-2**: collapse（折りたたみ）時、sidebar 幅 4rem 内に全アイコンが収まり**横方向にはみ出さない**。collapsed では各項目のアイコンを中央寄せし、テキスト/外部リンク矢印は sr-only、badge は数値でなくドット表示にする。
- **AC-3**: ユーザーメニュー popover が開いている状態で、**popover/summary の外側をクリックすると閉じる**。**Escape キー**でも閉じる。route 変化での自動 close（既存挙動）は維持する。
- **AC-4**: `PublicFooter`（プライバシーポリシー / 利用規約 / コピーライト）が、コンテンツが短いページでも **viewport 最下部に配置**される（sticky footer）。コンテンツが長いページでは従来通りコンテンツ末尾に自然配置され、視覚的な余白を保つ。
- **AC-5**: 既存 API endpoint / D1 / Google Form schema / auth middleware は**不変**（親不変条件 #5）。色・寸法は `tokens.css` 経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate 非抵触）。
- **AC-6**: 既存テスト（`SidebarShell.spec` / `SidebarUserMenu.spec` / `(public)/layout.spec` / `PublicFooter.spec` 等）が**回帰なくパス**し、新規追加テストで AC-1〜AC-4 を保護する。

## スコープ（編集 5 / 新規 0 ソース + テスト追加）

### 編集（ソース 5）

- `apps/web/src/styles/globals.css` — `[data-shell="sidebar"]` を `min-height: 100vh` → `height: 100dvh`（+ `overflow: hidden`）へ（C1/C2）。重複ブロック（行 1417 付近 / 1547 付近の 2 箇所）双方を整合させる。
- `apps/web/src/components/shell/SidebarShell.tsx` — aside を「ブランド + スクロール nav（`flex-1 overflow-y-auto`）」と「固定フッター領域（公開サイトに戻る + user menu + collapse トグル, `shrink-0`）」の 2 段構成へ再編。aside に `overflow-hidden`。`<main>` を `flex flex-col` 化（C1/C2/C4）。`AdminPublicReturn` の collapsed 中央寄せ。
- `apps/web/src/components/shell/SidebarUserMenu.tsx` — `browserDocument()` 経由で `pointerdown`（外側クリック）+ `keydown`（Escape）リスナを登録し、open 時のみ外側操作で `details.open=false`。collapsed summary を中央寄せ（C2/C3）。
- `apps/web/src/components/shell/SidebarNavItem.tsx` — collapsed 時に item を `justify-center`、badge を collapsed ではドット表示へ（C2）。
- `apps/web/src/styles/legacy-public.css` — `[data-component="public-footer"]` の `margin-top: 40px` → `margin-top: auto`（sticky footer）。`<main>` flex-column 化と併用（C4）。

### テスト追加/更新

- `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` — フッター固定領域 / `<main>` flex-column / collapse overflow 構造の DOM 契約を追加。
- `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` — 外側クリック / Escape で `details.open=false`、内側クリックで開状態維持の挙動を追加。
- `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` — collapsed 時の `justify-center` / badge ドット契約を追加（既存があれば追記）。

> 新規ソースファイルは増やさない（既存 shell コンポーネント＋既存 CSS 正本の編集に閉じる）。`browserDocument()`（`apps/web/src/lib/is-browser.ts`）を document アクセスの唯一の入口として再利用する。

## 不変条件（要旨）

- I-1: `useSidebarState()` の戻り値 shape `{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }` と `SidebarShell` の public props は不変（後方互換）。
- I-2: collapse/drawer の state owner は `useSidebarState` 1 系のみ。新規 state store を増やさない。`SidebarUserMenu` の popover 開閉は `<details>` の `open` 属性を引き続き正本とし、React state を新設しない（ref 経由制御）。
- I-3: API endpoint / D1 / Google Form schema / auth middleware は不変（親不変条件 #5）。
- I-4: 色・寸法は tokens 経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。新規寸法が必要なら既存 `--shell-*` トークンを使う。
- I-5: `document` / `window` アクセスは `apps/web/src/lib/is-browser.ts` の `browserDocument()` / `browserWindow()` 経由とする（直接 `document` 参照は ESLint で弾かれる）。`localStorage` / `sessionStorage` 禁止トークンを新規に焼き込まない。
- I-6: SSR HTML と client 初期 render の DOM 構造が一致し、hydration mismatch を起こさない。footer 固定はレイアウト CSS（margin-auto / flex）で実現し、JS 計測に依存しない。
- I-7: `data-shell`/`data-shell-block`/`data-role`/`data-component`/`data-action` 等の既存観測契約属性を削除しない（テスト・auth-slot 契約の正本）。
- I-8: `<details>`/`<summary>` のネイティブ開閉・キーボード操作・`aria-haspopup="menu"` を壊さない。外側クリック閉じは additive な listener として実装する。

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

## 関連 task

- 親: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`（統一 shell primitive）
- sibling: `issue-1024-sidebar-collapse-cookie-persistence`（collapse cookie 永続化）/ `issue-1016-sidebar-mobile-drawer-responsive`（mobile drawer）/ `admin-sidebar-public-return-link`（#1021 公開サイトに戻る導線）
- 関連: `task-c-public-member-sidebar-shell-integration`（PublicFooter を shell 配下へ保持した layout 統合）
