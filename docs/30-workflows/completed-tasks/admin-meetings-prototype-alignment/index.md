# Workflow: admin-meetings-prototype-alignment

`/admin/meetings`（list） と `/admin/meetings/[id]`（detail）の UI/UX を
プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）の
デザイン言語に整流するワークフロー。

- ブランチ: `docs/admin-meetings-prototype-alignment`（実装時は `feat/admin-meetings-prototype-alignment` を派生）
- ベースブランチ: `dev`
- 親ワークフロー（先行/参照）: `docs/30-workflows/admin-ui-prototype-alignment/`（Task A〜E の primitive 群と layout が前提）
- スコープ: UI 層のみ（既存 API endpoint surface は不変。DB schema 変更なし）
- 不変条件:
  1. 既存 API endpoint (`/admin/meetings`, `/admin/meetings/:id`, `POST /meetings`, `PATCH /meetings/:id`, `/meetings/:id/attendances`, `/meetings/:id/export.csv`) のみ使用
  2. OKLch token のみ（HEX 直書き / `bg-[#xxx]` 禁止）
  3. `safeServerFetch` 経由・section 単位 fail-soft 維持
  4. `apps/web` から D1 直接アクセス禁止
  5. `features/admin/components/_shared` の primitives（`AdminPageHeader` / `AdminSectionCard` / `AdminTable` / `AdminStat` / `AdminEmptyState` / `AdminSectionErrorClient`）を採用
  6. attendance 候補は `isDeleted=true` 除外（不変条件 #15）
  7. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由

## タスク表

| Task | スコープ | 想定ファイル数 | 並列 |
|------|---------|--------------|------|
| [Task A — /admin/meetings list 再設計](tasks/task-A-meetings-list-redesign.md) | list ページ全体 + `MeetingPanel` 解体 → 新 components 3点 | 6 |  ─ |
| [Task B — /admin/meetings/[id] detail 整流](tasks/task-B-meeting-detail-alignment.md) | detail ページの primitive 整流 + attendance UI 改修 | 4 | A と並列可（共有 component 衝突なし） |

## Phase 成果物

| Phase | 成果物 |
|-------|--------|
| Phase 1 Requirements | `outputs/phase-1/phase-1.md` |
| Phase 2 Design | `outputs/phase-2/phase-2.md` |
| Phase 3 Design Review | `outputs/phase-3/phase-3.md` |
| Phase 4 Implementation Plan | `outputs/phase-4/phase-4.md`（タスク分割の根拠） |
| Phase 5 Implementation | `outputs/phase-5/phase-5.md`（各 Task の Phase 5 を参照） |
| Phase 6 Test Expansion | `outputs/phase-6/phase-6.md` |
| Phase 7 Coverage Check | `outputs/phase-7/phase-7.md` |
| Phase 8 Refactoring | `outputs/phase-8/phase-8.md` |
| Phase 9 Quality Assurance | `outputs/phase-9/phase-9.md` |
| Phase 10 Final Review | `outputs/phase-10/phase-10.md` |
| Phase 11 Manual Test | `outputs/phase-11/phase-11.md`（staging visual + browser smoke） |
| Phase 12 Documentation | `outputs/phase-12/phase-12.md` / `outputs/phase-12/main.md` + strict 7 |
| Phase 13 PR | `outputs/phase-13/phase-13.md` |
