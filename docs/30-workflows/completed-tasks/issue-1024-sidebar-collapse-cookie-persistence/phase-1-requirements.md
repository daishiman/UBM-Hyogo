# Phase 1: 要件定義

> issue-1024 — sidebar collapse 状態の cookie 永続化（SSR seed + lint 回避ハック撤廃）

## 1.1 真の論点（1 文）

「sidebar の collapse 状態を、lint-boundaries を正当に満たしつつ、リロード後も**初回 SSR からちらつきなく**復元する」。現行 localStorage 実装は (a) 禁止トークン検査を `"local"+"Storage"` で回避する code smell、(b) server が状態を知らず初回 render が常に expanded になり hydration 後にちらつく、の 2 点で未達。

## 1.2 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | 部分的（localStorage 版が存在） | Phase 5 は「localStorage ハック撤廃 + cookie 化の差分実装」とする |
| upstream（dev）にマージ済み | 親 Task A / Task E は dev マージ済み（現行 HEAD で実在確認） | 再実装不要。本タスクは seed 層の追加 |
| 前提タスク（依存タスク）が完了済み | 完了済み（`useSidebarState` / `SidebarShell` / `SidebarShell.server` 実在） | 依存解消タスク不要 |

`implementation_mode: "new"`（cookie 層は新規実装。ただし localStorage 版の撤廃を伴うため Phase 5 に「撤廃 → 置換」差分を明記する）。

## 1.3 タスク分類

- **NON_VISUAL**。新規 UI surface は無く、変更は state seed / 永続化 mechanism。視覚的差分は「初回ちらつきの有無」だが、静的 screenshot では有意に捕捉できず、SSR HTML inspection + 自動テストで検証する。Phase 11 は NON_VISUAL 宣言で代替証跡（focused vitest log + SSR seed evidence）を残す。
- **docs-only ではない**（CONST_004）。Issue 本文「スコープ」が cookie 実装を明示し、目的達成にコード変更が必須。

## 1.4 現行コード inventory（実測）

| ファイル | 現状の関連実装 | 命名規則 |
|----------|---------------|---------|
| `apps/web/src/components/shell/useSidebarState.ts` | `STORAGE_KEY = "ubm:shell:collapsed"` / `STORAGE_NAME = "local" + "Storage"` / `getShellStorage()` / `readPersistedCollapsed()` / `toggleCollapsed` が `storage.setItem`。`useState<SidebarStateMode>("expanded")` 固定初期値。mount effect で persisted 復元 + md viewport heuristic | camelCase 関数 / SCREAMING_SNAKE 定数 / kebab 不使用 |
| `apps/web/src/components/shell/SidebarShell.tsx` | `useSidebarState()` を引数なし呼び出し。`SidebarShellProps` に collapse seed prop 無し | PascalCase component / camelCase props |
| `apps/web/src/components/shell/SidebarShell.server.tsx` | `async function SidebarShellServer`。`getSession()` で session 取得済み（既に dynamic component）。cookie 読取り無し | 同上 |
| `apps/web/src/lib/is-browser.ts` | `browserDocument()` / `browserWindow()` / `browserLocalStorage()`（lint allowlist 登録済み正規 accessor）が既存 | camelCase getter |
| `scripts/lint-boundaries.mjs` | 禁止トークン = `localStorage` / `sessionStorage`（+ api/google import）。`document` / `cookie` は**非禁止**。allowlist は `localStorage: ["apps/web/src/lib/is-browser.ts"]` のみ | — |

## 1.5 受入条件（Issue #1024 → 現行コード写像）

| Issue 原文 AC | 本タスク受入条件 | 検証手段 |
|--------------|-----------------|---------|
| cookie ベースの collapse 永続化を実装する | AC-1: collapse toggle 時に cookie `ubm_shell_collapsed`（`true`/`false`）が `document.cookie` へ書かれる | `shell-collapse-cookie.spec.ts` / `useSidebarState.spec.tsx` |
| SSR / CSR 両対応（初期描画でのちらつき防止） | AC-2: `SidebarShellServer` が `cookies()` で当該 cookie を読み、`initialCollapsed` を `SidebarShell` → `useSidebarState` の `useState` 初期値へ seed する。cookie が collapsed=true のとき SSR HTML の `data-shell-collapsed="true"` が初回から true | `SidebarShell.server.spec.tsx` + Phase 11 SSR HTML evidence |
| collapse トグル時に cookie 書込、Server で cookie 読取り → 初期 `collapsed` seed | AC-3: cookie 読み書きは単一 source `shell-collapse-cookie.ts` に集約。server 用 pure parser と client writer を分離 | `shell-collapse-cookie.spec.ts` |
| （lint 整合） | AC-4: `"local" + "Storage"` ハックと localStorage 依存を撤廃し `pnpm lint`（`lint-boundaries` 含む）green。`grep -rn "localStorage" apps/web/src/components/shell/` が 0 件 | `pnpm lint` + grep |
| （回帰防止） | AC-5: 既存 `useSidebarState` 戻り値 shape 不変。md viewport 初期 collapsed heuristic（cookie 不在時のみ適用）は維持。`pnpm --filter @ubm-hyogo/web test` の shell 系 spec が全 pass | focused vitest |

## 1.6 スコープ外（先送りではなく本質的に別レーン）

- drawer open 状態の永続化（drawer は route 遷移で閉じる一時 state。永続化は UX 上不要）。
- collapse 状態のサーバ側ユーザー別保存（D1）。cookie は端末ローカル設定として十分であり、D1 アクセスは親不変条件 #5 で `apps/web` から禁止。
- 他の UI 設定（density 等）の cookie 化。本タスクは collapse 1 項目に限定。

> いずれも CONST_007 の「先送り」ではなく、本タスクの単一責務（collapse cookie 永続化）から本質的に外れる別関心事。今サイクルで collapse cookie 化は完結する。

## 1.7 完了条件

- AC-1〜AC-5 を満たす実装手順が Phase 5 に、テストが Phase 4/6 に、検証コマンドが Phase 9 に、DoD が Phase 10 に揃っている。
- 本仕様書群と実コード差分が一致しており、変更ファイル・シグネチャ・テスト・コマンド・DoD が追跡できる。
