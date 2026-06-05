# system-spec-update-summary — issue-1024

> GitHub Issue #1024 は CLOSED のまま現行コードへ再スコープ（reopen しない）。NON_VISUAL / implemented_local_evidence_captured。

## Step 1-A: 完了タスク記録

- task_id: `issue-1024-sidebar-collapse-cookie-persistence`
- 内容: sidebar collapse 状態を cookie（`ubm_shell_collapsed`）で永続化し、`SidebarShellServer` の
  `cookies()` 読取りで `initialCollapsed` を seed して初回 SSR ちらつきを排除。あわせて
  `useSidebarState.ts` の `"local" + "Storage"` 回避ハック + localStorage 依存を撤廃。
- 区分: 実装仕様書（CONST_004）。state seed / 永続化 mechanism 変更を伴うコード変更タスク。
- 状態: implemented_local_evidence_captured（実コード・focused tests・web lint/typecheck・grep gate は本サイクルで実走済み。browser manual smoke / commit / push / PR は user-gated）。

## Step 1-B: 実装状況

- 現状: **implemented_local_evidence_captured**（apps/web shell code changed; focused local evidence captured）。
- 新規 2: `shell-collapse-cookie.ts` / `__tests__/shell-collapse-cookie.spec.ts`。
- 編集 5: `useSidebarState.ts` / `SidebarShell.tsx` / `SidebarShell.server.tsx` /
  `__tests__/useSidebarState.spec.tsx` / `__tests__/SidebarShell.server.spec.tsx`。
- 実走ゲート: `pnpm --filter @ubm-hyogo/web lint` PASS、`pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx` PASS（3 files / 15 tests）。

## Step 1-C: 関連タスク

- 親: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`。
- sibling: Task A（SidebarShell primitive）/ Task E（mobile drawer + 初期 collapsed 判定、md heuristic）。
- 起点: `admin-layout-sidebar-shell-migration/outputs/phase-12/unassigned-task-detection.md`（FU-ALSSM-001）。
- 重複なし: 既存タスクはいずれも cookie 永続化 / SSR seed を実装していない（localStorage 経由のみ）。

## Step 2: 新規インターフェース

| 公開要素 | shape | 公開範囲 |
|----------|-------|----------|
| `SHELL_COLLAPSE_COOKIE_NAME` | `"ubm_shell_collapsed"`（const） | workflow-local（`apps/web/src/components/shell` 内） |
| `parseShellCollapsedCookie(value: string \| undefined)` | `=> boolean` | workflow-local |
| `readCollapsedFromDocument()` | `=> boolean \| null` | workflow-local |
| `writeShellCollapsedCookie(collapsed: boolean)` | `=> void` | workflow-local |
| `useSidebarState(initialCollapsed?: boolean \| null)` | 戻り値 shape 不変・引数 optional 追加 | workflow-local（既存 hook の後方互換拡張） |
| `SidebarShellProps.initialCollapsed` | `boolean \| null`（optional） | workflow-local |

- **aiworkflow-requirements 公開契約更新**: **N/A**。本タスクの公開 export は `apps/web/src/components/shell` 内に閉じた
  shell 実装の局所インターフェースであり、AIWorkflowOrchestrator の API / IPC / 状態管理契約（正本仕様）に該当しない。
  したがって `references/` 正本の更新箇所は存在しない。
- 該当する正本セクション: なし（D1 schema / API endpoint / Google Form / auth 契約はいずれも不変）。
- **aiworkflow-requirements 運用台帳更新**: `quick-reference.md` / `resource-map.md` / changelog / artifact inventory / lessons-learned は反映済み。
