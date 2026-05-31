---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-05-29
task_id: sidebar-shell-visual-baseline-smoke-task-f
---

# System Spec Update Summary

## Step 1-A: 変更概要

親 `unified-sidebar-shell-public-and-admin` の Task F（visual baseline + smoke）を独立 sub-workflow `sidebar-shell-visual-baseline-smoke-task-f` として昇格し、本ブランチで親 Task A-E（公開/会員/管理 3 層を共通 collapsible SidebarShell へ統合）+ Task F（Playwright spec / config / CI）の実装本体を実行した（`implemented_local_evidence_captured`）。本レビューサイクルで実装に伴う dangling 仕様書と skill を同期した。

## Step 1-B: 正本同期先

| Target | Status | 理由 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-unified-sidebar-shell-2026-05.md` | DONE | L-USHELL-001..006 を新規作成（3 層 server shell 集約 + fail-closed / activePath dead code / anonymous mockApi / layout spec 追従 / collapse state / 仕様書 dangling 同期） |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | DONE | `v2026.05.30-unified-sidebar-shell-implementation-review` dated entry を追記 |
| `.claude/skills/aiworkflow-requirements/references/{workflow-unified-sidebar-shell-...-artifact-inventory, task-workflow-active}.md` | DONE | planned path を `tests/e2e/sidebar-shell-*` → 実体 `playwright/tests/sidebar-shell/{smoke,visual,_helpers}` へ補正 |
| `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` | DONE | 「SP-USHELL-A..E」汎化パターンを追記 |
| `docs/00-getting-started-manual/specs/{09h-shell-and-fixtures, 05-pages, 00-overview, 09g-screen-blueprints-admin}.md` | DONE | shell 統合 dangling 解消（09h §1 を旧 3 層独立 shell → 共通 SidebarShell に全面書換、§2-4 fixtures 無傷 / MemberHeader / AdminSidebar）。API / D1 / Google Form schema 変更なし |
| `apps/web/playwright.config.ts` | DONE | sidebar-shell 4 project（smoke + visual desktop/tablet/mobile）実装済み（旧 deferred を解消） |

## Step 1-C: 実コード正本との整合

実コードベースを照合し、spec の主張が現行構造と一致することを確認した:

- `apps/web/tests/e2e/` は `staging-smoke.spec.ts` のみ（E2E 正本は `apps/web/playwright/tests/`）→ パストポロジ補正の前提が成立。
- `apps/web/playwright/fixtures/auth.ts` は `anonymousPage` / `memberPage` / `adminPage` / `mockApi` を export し、`*StorageState` は不在 → phase-1 §7 の補正が正しい。
- `apps/web/playwright/fixtures/viewports.ts` の mobile は `390×844`。task-F の `375×812` との差分は本 spec 専用 project の `use.viewport` で吸収し fixture は変更しない（phase-3 R3）。
- `apps/web/playwright.config.ts` は `admin-staging-visual-*` で `{arg}-admin-staging-visual-<viewport>-{platform}{ext}` を採用済み → 本 spec の `{arg}-sidebar-shell-visual-<viewport>-{platform}{ext}` は前例整合。

## Step 2: skill file update

本サイクルで task-specification-creator（`patterns-lessons-and-pitfalls.md` に SP-USHELL-A..E）と aiworkflow-requirements（`lessons-learned-unified-sidebar-shell-2026-05.md` 新規 / SKILL-changelog dated entry / 親 inventory + task-workflow-active の planned path 補正）に skill file 反映を実施した。Phase 1-13 / strict 7 / root-output artifacts parity の既存ルールは維持。
