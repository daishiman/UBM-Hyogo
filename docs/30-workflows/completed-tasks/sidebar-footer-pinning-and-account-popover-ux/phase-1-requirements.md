# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 1 / 13 |
| 名称 | 要件定義 |
| spec_classification | implementation_spec |
| task_type | implementation |
| visual_category | VISUAL |
| implementation_mode | new |
| created_at | 2026-06-02 |
| branch | feat/sidebar-footer-pinning-and-account-popover-ux |

## 目的

統一 sidebar shell の UI/UX 不具合 4 件（C1 フッター固定 / C2 collapse はみ出し / C3 アカウント popover 外側クリック閉じ / C4 main footer sticky）を、**既存 API・D1・auth・Google Form schema を一切変更せず**、`apps/web/src/components/shell/` と既存 CSS 正本の編集だけで 1 実装サイクル内に解消するための、scope・受入条件・inventory・命名規則を固定する。

## 実行タスク

### Step 0: P50 チェック（既実装確認・必須）

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在するか | **No** — `git log --oneline -5` は本タスクの commit を含まない。staging 上で 4 件の不具合が再現中（ユーザー報告 2026-06-02）。 | 通常の新規実装（`implementation_mode: new`） |
| upstream（dev）にマージ済みか | **No** — 該当修正は dev tip（`eb8ecd958`）に未含。 | 未マージとして扱う |
| 前提タスク（統一 shell primitive / collapse cookie / mobile drawer）完了済みか | **Yes** — `unified-sidebar-shell-public-and-admin` / `issue-1024` / `issue-1016` は completed-tasks 済。現行 HEAD に `SidebarShell.tsx` / `SidebarUserMenu.tsx` / `useSidebarState.ts` / `globals.css` の `[data-shell="sidebar"]` 実在を確認。 | 依存解消タスク不要。本タスクは既存 shell 上の additive / 後方互換修正 |

> P50 結論: 既実装ゼロの **新規実装**。ただし「新規コンポーネント追加」ではなく「既存 shell コンポーネント＋既存 CSS の挙動修正」。重複ファイル作成リスクはないが、**既存 DOM 観測契約属性（`data-shell` 等）を壊さない**ことが最重要。

### Step 1: 既存命名規則・コード規約の確認（記録）

| 観点 | 現行コードの規則 | 本タスクでの遵守 |
|------|------------------|------------------|
| コンポーネントファイル | PascalCase（`SidebarShell.tsx`）、client は先頭 `"use client";` | 維持 |
| DOM 観測契約属性 | `data-shell="sidebar\|main\|mobile-bar"` / `data-shell-block="nav\|nav-item\|user-menu\|user-menu-popover\|user-avatar"` / `data-role="public-return\|copyright"` / `data-component="public-footer\|admin-sidebar-public-return"` / `data-action="profile\|edit-request\|admin-dashboard\|login"` | 削除・改名禁止（I-7）。新規追加は kebab-case |
| 色・寸法 | `var(--ubm-color-*)` / `var(--shell-*)` トークン。Tailwind arbitrary は `w-[var(--shell-bar-w)]` 形式 | HEX 直書き禁止（AC-5） |
| ブラウザ API | `apps/web/src/lib/is-browser.ts` の `browserDocument()` / `browserWindow()` 経由（直接 `document`/`window` は ESLint で reject） | C3 の listener は `browserDocument()` 経由（I-5） |
| テストファイル | `__tests__/*.spec.tsx`（`*.test.*` 禁止 = 不変条件 #8） | `.spec.tsx` のみ |
| vitest 実行 | リポジトリルートから `pnpm exec vitest run --root=. --config=vitest.config.ts <paths>` | Phase 4-9 で踏襲 |

### Step 2: inventory（変更対象の固定）

| ファイル | 種別 | 関与 concern | 主要箇所 |
|---------|------|------------|---------|
| `apps/web/src/styles/globals.css` | 編集 | C1, C2 | `[data-shell="sidebar"]`（行 1417 付近 / 1547 付近の 2 ブロック）。`min-height:100vh` → `height:100dvh` + `overflow:hidden` |
| `apps/web/src/components/shell/SidebarShell.tsx` | 編集 | C1, C2, C4 | aside（行 92-101）2 段構成化 + `overflow-hidden`、`<main>`（行 117-124）flex-column 化、`AdminPublicReturn`（行 23-42）collapsed 中央寄せ |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | 編集 | C2, C3 | `useEffect` 追加（外側クリック + Escape）、summary collapsed 中央寄せ |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集 | C2 | collapsed `justify-center`、badge collapsed ドット化 |
| `apps/web/src/styles/legacy-public.css` | 編集 | C4 | `[data-component="public-footer"]` `margin-top:40px` → `margin-top:auto`（行 716 付近） |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | テスト編集 | C1, C2, C4 | 固定フッター領域 / main flex-column / collapse 構造の契約追加 |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | テスト編集 | C3 | 外側クリック / Escape close、内側維持 |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | テスト編集/新規 | C2 | collapsed justify-center / badge ドット |

### Step 3: 受入条件（AC）の番号付き固定

- **AC-1**（C1）: md+ sidebar で nav が viewport 超過時、下部 3 要素（公開サイトに戻る[admin]・user menu・collapse トグル）が常時画面最下部に固定。nav 領域のみ内部スクロール。
- **AC-2**（C2）: collapse 時 4rem 幅に全アイコンが収まり横はみ出しゼロ。collapsed はアイコン中央寄せ + テキスト/矢印 sr-only + badge ドット。
- **AC-3**（C3）: popover open 中に外側クリック / Escape で閉じる。route 変化 close（既存）維持。内側（popover 内リンク以外の余白）クリックでは開維持。
- **AC-4**（C4）: PublicFooter が短コンテンツページで viewport 最下部に配置。長コンテンツでは末尾に自然配置 + 余白保持。
- **AC-5**: API/D1/auth/Form schema 不変。色寸法 tokens 経由（HEX 禁止）。
- **AC-6**: 既存テスト回帰なし + 新規テストで AC-1〜4 保護。

### Step 4: targeted test ファイルリスト（[FB-UI-02-2] 全件 test 回避）

メモリ制約下で全件 `pnpm test` を避け、以下を対象指定実行する:

```
apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx
apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx
apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx
apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx
apps/web/src/components/public/__tests__/PublicFooter.spec.tsx
apps/web/app/(public)/layout.spec.tsx
```

## 参照資料

- `apps/web/src/components/shell/SidebarShell.tsx`（aside / main レイアウト正本）
- `apps/web/src/components/shell/SidebarUserMenu.tsx`（`<details>` popover 正本）
- `apps/web/src/components/shell/SidebarNavItem.tsx` / `SidebarNav.tsx`（nav 構造）
- `apps/web/src/styles/globals.css`（`[data-shell="sidebar"]` 行 1417/1547）
- `apps/web/src/styles/legacy-public.css`（`[data-component="public-footer"]` 行 716）
- `apps/web/src/lib/is-browser.ts`（`browserDocument()` — document 唯一の入口）
- `apps/web/src/styles/tokens.css`（`--shell-bar-w` / `--shell-bar-w-collapsed` 等）
- 親 spec: `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/`
- aiworkflow-requirements: `ui-ux-*.md`（shell 観測契約・design tokens）

## 実行手順

1. P50 チェックを実施し、`git log --oneline -5` と `grep` で既実装ゼロを確認する。
2. 4 concern の根本原因を index.md の根本原因テーブルへ確定記録する（完了）。
3. inventory・命名規則・AC・targeted test list を本ファイルへ固定する（完了）。
4. Phase 2 へ設計を引き渡す。Phase 1-3 完了まで Phase 4（テスト計画）へ進まない。

## 統合テスト連携

- 既存統合テスト: `apps/web/app/(public)/layout.spec.tsx` P-5（PublicFooter が shell 配下に存在）を**壊さない**。
- 新規統合観点: AC-1（固定フッター領域の DOM 存在）・AC-3（popover 開閉）・AC-4（main flex-column + footer margin-auto）を component spec で保護。E2E（playwright-smoke）はスコープ外（既存 visual gate に委譲）。

## 多角的チェック観点（AIが判断）

- **システム系**: 状態所有権 — popover 開閉は `<details>.open` を正本（React state を新設しない / I-2）。sidebar 高さ固定は CSS 層の責務、JS 計測に依存しない（I-6）。
- **戦略・価値系**: 4 件はいずれも「見える・閉じる・はみ出さない」という基本可用性の欠落であり、UX コスト > 実装コスト。1 PR で束ねるのが妥当（先送り理由なし → CONST_007 単一サイクル）。
- **問題解決系**: 真の論点は「sidebar が viewport 高さに拘束されていない」（C1/C2 の共通根）と「ネイティブ `<details>` の外側クリック非対応」（C3）。C4 は独立だが同 shell・低コスト。

## サブタスク管理

| ID | concern | 主担当ファイル | Phase 5 タスク |
|----|---------|--------------|---------------|
| C1 | フッター固定 | globals.css / SidebarShell.tsx | T1 |
| C2 | collapse はみ出し | SidebarShell.tsx / SidebarNavItem.tsx / SidebarUserMenu.tsx / globals.css | T2 |
| C3 | popover 外側クリック | SidebarUserMenu.tsx | T3 |
| C4 | main footer sticky | SidebarShell.tsx / legacy-public.css | T4 |

## 成果物

- `outputs/phase-1/requirements.md`（本 Phase 本文と同期した要件サマリ。本ファイルを正本とする）
- index.md の根本原因テーブル / AC / scope（確定済）

## 完了条件

- [x] P50 チェックを実施し既実装ゼロを記録した
- [x] 4 concern の根本原因をコード行番号付きで確定した
- [x] AC-1〜AC-6 を番号付きで固定した
- [x] inventory（編集 5 ソース + 3 テスト）を固定した
- [x] 既存命名規則・DOM 観測契約属性・ブラウザ API 入口を記録した
- [x] targeted test ファイルリストを列挙した

## タスク100%実行確認【必須】

- [x] 全実行タスク（Step 0-4）を完了
- [x] 必須成果物（要件サマリ）を本ファイルに記載
- [x] Phase 2 開始条件（Phase 1 完了）を満たす

## 次Phase

[Phase 2: 設計](phase-2-design.md)
