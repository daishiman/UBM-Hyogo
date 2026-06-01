---
task_id: issue-1024-sidebar-collapse-cookie-persistence
spec_classification: implementation_spec
state: implemented_local_evidence_captured
created_at: 2026-05-31
task_type: implementation
visual_category: NON_VISUAL
implementation_mode: new
issue: 1024
issue_state: CLOSED
issue_state_note: GitHub Issue #1024 は CLOSED。本仕様書は CLOSED のまま現行コードへ再スコープして作成する（reopen しない）。
parent_workflow: docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/
source_task: docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/phase-12/unassigned-task-detection.md (FU-ALSSM-001)
branch: feat/issue-1024-sidebar-collapse-cookie-persistence
---

# issue-1024 — sidebar collapse 状態の cookie 永続化（SSR seed + lint 回避ハック撤廃）

GitHub Issue #1024（FU-ALSSM-001）を **現行コードに再スコープ**した Phase 1-13 単一責務実装仕様書ディレクトリ。後続の実装プロンプト（`03.実装.md`）が、このディレクトリだけを読めば確実にコードへ反映できる粒度で記述する。

## 実装区分

`[実装区分: 実装仕様書]` — cookie 永続化・SSR seed・既存 client hook / server entry の編集を伴うコード変更タスクであるため（CONST_004）。Issue 本文の「スコープ」も cookie ベース永続化の実装を明示しており、docs-only ではない。

## 調査サマリ（issue 前提の陳腐化）

Issue #1024 起票（2026-05-29）当時の前提「`useSidebarState.ts` は永続化を撤廃し in-memory に限定」は**現行コードでは陳腐化**している。現行 HEAD（`apps/web/src/components/shell/useSidebarState.ts`）は永続化を復活させているが、その手段が問題を含む:

```ts
const STORAGE_NAME = "local" + "Storage";          // lint-boundaries の禁止トークン検査を文字列分割で回避
function getShellStorage() { return win?.[STORAGE_NAME] as Storage; }  // 実質 localStorage を直接使用
```

| 観点 | 現行実態 | 本タスクでの扱い |
|------|---------|-----------------|
| UX 症状（リロードで collapse 状態リセット） | localStorage で**解消済み** | 維持（cookie へ移行しても永続化は継続） |
| Issue 指定の **cookie 方式** | 未実装（localStorage 代替） | **実装する**（本タスク core） |
| **SSR seed / 初回ちらつき防止** | 未達。server は常に `expanded` 描画 → mount 後補正でちらつき | **実装する**（server で cookie 読取り → `initialCollapsed` seed） |
| **lint-boundaries 遵守** | `"local"+"Storage"` で禁止トークン検査を回避（code smell） | **撤廃する**（cookie は `localStorage`/`sessionStorage` トークンを含まないため正当に lint clean） |

## ゴール（要旨）

1. sidebar collapse 状態を **cookie（`ubm_shell_collapsed`）で永続化**する。toggle 時に client が `document.cookie` へ書き込む。
2. `SidebarShellServer`（server component）が `next/headers` の `cookies()` で当該 cookie を読み取り、`initialCollapsed` を `SidebarShell` → `useSidebarState` へ seed する。これにより**初回 SSR HTML が collapse 状態を正しく反映し、hydration 後のちらつきを排除**する。
3. `useSidebarState.ts` の `"local" + "Storage"` 文字列分割ハックと localStorage 依存を**撤廃**し、lint-boundaries を正当に満たす。
4. SSR seed と client toggle の cookie 読み書きを単一 source（新規 `shell-collapse-cookie.ts`）へ集約する。

## スコープ（新規 2 / 編集 4）

### 新規（2）

- `apps/web/src/components/shell/shell-collapse-cookie.ts` — cookie 名定数 + 純粋 parser（server 用）+ client writer。
- `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` — parser / writer の focused test。

### 編集（4）

- `apps/web/src/components/shell/useSidebarState.ts` — localStorage ハック撤廃 + `initialCollapsed: boolean | null` seed 引数追加 + toggle 時 cookie 書込。
- `apps/web/src/components/shell/SidebarShell.tsx` — `initialCollapsed?: boolean | null` prop 追加 → `useSidebarState` へ伝播。
- `apps/web/src/components/shell/SidebarShell.server.tsx` — `cookies()` 読取り → `initialCollapsed` を `SidebarShell` へ渡す。
- `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` — localStorage アサーションを cookie へ置換 + seed テスト追加。
- `apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx` — `next/headers` cookies() mock で `initialCollapsed` 伝播を検証（既存 spec への追記）。

> 編集は実質 4 ソース + 2 spec。`SidebarShell.server.spec.tsx` / `useSidebarState.spec.tsx` は既存テストの更新。

## 前提（prerequisite）

本 spec は親 workflow の Task A（`SidebarShell` primitive）/ Task E（drawer + 初期 collapsed 判定）が **dev にマージ済み**であることを前提とする（現行 HEAD で実在を確認済み）。本タスクはその上に cookie seed 層を**追加**する後方互換変更であり、新規 state store を増やさない。

## 不変条件（要旨）

- I-1: `useSidebarState()` の戻り値 shape `{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }` は不変。引数のみ optional 追加（後方互換）。
- I-2: collapse/drawer の state owner は `useSidebarState` 1 系のみ。新規 state store を増やさない。
- I-3: API endpoint / D1 / Google Form schema / auth middleware は不変（親不変条件 #5）。
- I-4: 色・寸法は tokens 経由。HEX 直書き / `bg-[#xxx]` 禁止（本タスクは CSS 変更なし）。
- I-5: Web Storage 禁止トークン（`localStorage` / `sessionStorage`）を `apps/web/src` 配下へ新規に焼き込まない。cookie は `scripts/lint-boundaries.mjs` の禁止トークン対象外。`document` アクセスは `apps/web/src/lib/is-browser.ts` の `browserDocument()` 経由とする。
- I-6: cookie は `httpOnly` を付けない（client が読み書きするため）。`path=/`・`SameSite=Lax`・`max-age` 付き。秘匿情報を含まない UI 設定のみ。
- I-7: SSR seed 経路（`cookies()` → `initialCollapsed` → `useState` 初期値）と client 初期 render が同値となり、hydration mismatch を起こさない。

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

- 親: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`
- 起点記録: `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/phase-12/unassigned-task-detection.md`（FU-ALSSM-001）
- sibling: Task A（SidebarShell primitive）/ Task E（mobile drawer + 初期 collapsed 判定）
