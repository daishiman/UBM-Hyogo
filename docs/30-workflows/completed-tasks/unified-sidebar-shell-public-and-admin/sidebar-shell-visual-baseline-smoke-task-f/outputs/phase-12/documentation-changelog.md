---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-05-29
task_id: sidebar-shell-visual-baseline-smoke-task-f
---

# Documentation Changelog

## 2026-05-29

| Path | Change |
| --- | --- |
| `index.md` | frontmatter / 背景 / パストポロジ補正表 / Scope / Phase 一覧 / strict 7 導線を追加 |
| `artifacts.json` / `outputs/artifacts.json` | root/output parity と Gate-A/B/C を追加 |
| `phase-1-requirements.md` .. `phase-13-pr.md` | Phase 1-13 仕様を追加 |
| `outputs/phase-12/main.md` | strict 7 入口を追加 |
| `outputs/phase-12/implementation-guide.md` | Part 1/2 + 実装ステップ + 検証コマンド + 既知制限を追加 |
| `outputs/phase-12/system-spec-update-summary.md` | 正本同期判定 + 実コード照合結果を追加 |
| `outputs/phase-12/documentation-changelog.md` | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件）を追加 |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback 判定 + 30 思考法 evidence を追加 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings 準拠の compliance check を追加 |

## 実コード変更（親 Task A-E + Task F を本ブランチで実行）

| Path | Change |
| --- | --- |
| `apps/web/src/components/shell/`（24 files） | 共通 SidebarShell（`shell-config` / `SidebarShell(.server)` / `SidebarNav*` / `SidebarUserMenu` / `SidebarDrawer` / `useSidebarState` 他）+ `__tests__/` 8 spec を新規 |
| `apps/web/app/(public|member|admin)/layout.tsx` | async server 化 + `SidebarShellServer` 委譲（旧 per-layer header/sidebar 撤去） |
| `apps/web/app/(public)/page.tsx`（旧 `app/page.tsx`）/ privacy / terms | `(public)` route group へ移動しシェル配下に収容 |
| `apps/web/src/components/{public/PublicHeader, layout/MemberHeader, layout/AdminSidebar}.tsx`（+ specs 計 4） | 削除（SidebarShell へ統合） |
| `apps/web/src/styles/tokens.css` | shell トークン 5 件追加 |
| `apps/web/playwright/tests/sidebar-shell/{_helpers, sidebar-shell-smoke.spec, sidebar-shell-visual.spec}.ts` | Task F: smoke S1-S6 + visual V1-V7 + 共通 helper |
| `apps/web/playwright.config.ts` | `sidebar-shell-{smoke, visual-desktop/tablet/mobile}` 4 project 追加 + default project testIgnore |
| `.github/workflows/playwright-smoke.yml` | smoke step + `visual (sidebar-shell)` 3 viewport matrix 追加 |

## 本レビューサイクルで検出・修正した差分

| Path | Change |
| --- | --- |
| `apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts` / `sidebar-shell-visual.spec.ts` | anonymous 系 7 ケース（S1/S4/S5/S6・V1/V4/V6）に `mockApi` 注入。mock API 未起動で `/` が error boundary に落ちる実バグ修正 |
| `apps/web/app/(member)/layout.spec.tsx` | 旧仕様（`member-shell`/`topbar`/同期 render）から SidebarShell 統合 async パターンへ追従（2 fail 解消） |
| `apps/web/src/components/shell/SidebarShell.tsx` / `SidebarShell.server.tsx` / 3 layout / 2 shell spec | `activePath` dead code 削除（middleware が `x-pathname` 未注入・`SidebarShell` 未使用） |
| `apps/web/app/(admin|public)/layout.spec.tsx` | dead `vi.mock("next/headers")` 除去 |
| `docs/00-getting-started-manual/specs/{09h-shell-and-fixtures, 05-pages, 00-overview, 09g-screen-blueprints-admin}.md` | shell 統合に伴う dangling 解消（09h は旧 3 層独立 shell → 共通 SidebarShell へ全面更新） |
| `.claude/skills/aiworkflow-requirements/*` / `.claude/skills/task-specification-creator/*` | lessons-learned / SKILL-changelog / 親 inventory planned path / patterns 反映 |

## 補足

- 本 changelog は spec 作成 + 実装実行 + 本レビュー改善の全差分を記録する。CI Linux baseline / regression dry-run / commit / push / PR は Gate-B/C user-gated。
