# Phase 13: PR

> issue-1024 — sidebar collapse 状態の cookie 永続化（SSR seed + lint 回避ハック撤廃）
> GitHub Issue #1024 は **CLOSED のまま現行コードへ再スコープ**して作成（reopen しない）。

## 13.1 実行条件

commit / push / PR は **user 明示承認後のみ**実行する（Gate-C）。本仕様書段階では **NOT EXECUTED**。

- base ブランチ: `dev`
- 作業ブランチ: `feat/issue-1024-sidebar-collapse-cookie-persistence`
- title: `feat(web): issue-1024 sidebar collapse 状態を cookie 永続化し SSR seed でちらつき排除`

## 13.2 PR 本文案

```markdown
## 概要

sidebar の collapse 状態を cookie（`ubm_shell_collapsed`）で永続化し、`SidebarShellServer` が
`next/headers` の `cookies()` で読み取って `initialCollapsed` を seed する。これにより初回 SSR HTML が
collapse 状態を正しく反映し、hydration 後のちらつきを排除する。あわせて `useSidebarState.ts` の
`"local" + "Storage"` 文字列分割ハックと localStorage 依存を撤廃し、lint-boundaries を正当に満たす。

Refs #1024（CLOSED のまま現行コードへ再スコープ。reopen しない）

## 変更内容

### 新規
- `apps/web/src/components/shell/shell-collapse-cookie.ts`
  cookie 名定数 `SHELL_COLLAPSE_COOKIE`（`ubm_shell_collapsed`）+ 純粋 parser
  `readCollapsedFromCookieString` + client `readCollapsedFromDocument` / `writeCollapsedCookie`
  （`@/lib/is-browser` の `browserDocument()` 経由）。
- `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`
  parser / reader / writer の focused test（全 export line/branch 100% 目標）。

### 編集
- `apps/web/src/components/shell/useSidebarState.ts`
  localStorage 一式（`STORAGE_NAME = "local" + "Storage"` / `getShellStorage`）を撤廃。
  `useSidebarState(initialCollapsed: boolean | null = null)` へ引数追加。
  `useState(initialCollapsed === true ? "collapsed" : "expanded")` で SSR seed。
  mount effect は seed !== null で早期 return、null 時のみ md viewport heuristic 維持。
  toggle 時に `writeCollapsedCookie` を呼ぶ。戻り値 shape は不変。
- `apps/web/src/components/shell/SidebarShell.tsx`
  `initialCollapsed?: boolean | null` prop を追加し hook へ伝播。
- `apps/web/src/components/shell/SidebarShell.server.tsx`
  `await cookies()` で `ubm_shell_collapsed` を読み取り `initialCollapsed` を seed。
  呼出側 3 layout は無改修。
- `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx`
  localStorage アサーションを cookie へ置換 + seed テスト追加。
- `apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx`
  `next/headers` cookies() mock を追加し `initialCollapsed` 伝播を検証。

## 受入条件
- [ ] AC-1 toggle で cookie 書込
- [ ] AC-2 SSR seed でちらつき排除（SSR HTML の `data-shell-collapsed` が初回正）
- [ ] AC-3 cookie I/O が単一 source（`shell-collapse-cookie.ts`）
- [ ] AC-4 localStorage 撤廃 + lint green
- [ ] AC-5 hook 戻り値不変 + md heuristic 維持 + shell系 spec 全 pass

## 検証
- `pnpm typecheck`
- `pnpm lint`
- `pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/shell`

## 視覚証跡
UI/UX 変更なし（NON_VISUAL）のため Phase 11 スクリーンショットなし。
代替 = focused vitest log + SSR HTML の `data-shell-collapsed` 値検査。
```

## 13.3 実行手順（user 承認後）

1. `git add apps/web/src/components/shell/`（新規 2 + 編集 5）。
2. `git commit`（メッセージ末尾に Co-Authored-By を付与）。
3. `git push -u origin feat/issue-1024-sidebar-collapse-cookie-persistence`。
4. `gh pr create --base dev --title "feat(web): issue-1024 sidebar collapse 状態を cookie 永続化し SSR seed でちらつき排除" --body-file <本文>`。
5. PR URL を `outputs/phase-13/pr-creation-result.md` へ記録（Gate-C evidence）。

> 上記はすべて **NOT EXECUTED**（user 明示承認待ち）。
