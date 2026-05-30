# Phase 12 — Documentation Changelog

## 2026-05-28: workflow 新規作成

- `docs/30-workflows/completed-tasks/member-header-admin-link/index.md` 新規
- `docs/30-workflows/completed-tasks/member-header-admin-link/artifacts.json` 新規
- `docs/30-workflows/completed-tasks/member-header-admin-link/phase-1-requirements.md` 〜 `phase-10-final-review.md` 新規（10 ファイル）
- `docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-11/manual-test-result.md` 新規
- `docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-12/main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `skill-feedback-report.md` / `unassigned-task-detection.md` / `phase12-task-spec-compliance-check.md` 新規（7 ファイル）
- `docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-13/pr-creation-result.md` 新規
- `docs/30-workflows/completed-tasks/member-header-admin-link/outputs/artifacts.json` 新規（root artifacts mirror）

## 由来

親 workflow `public-header-logged-in-nav-cleanup` の `tasks/task-e-member-header-admin-link.md` を独立 workflow として切り出した。原典 Task E 仕様は維持。

## 2026-05-28: implementation 反映

- `apps/web/src/lib/auth-view/` に `AuthView` / `resolveAuthView()` / `getAuthView()` を追加
- `apps/web/src/components/layout/MemberHeader.tsx` に `authView` prop、`data-auth-state`、admin CTA を追加
- `apps/web/app/(member)/layout.tsx` を async 化し、`getAuthView()` から `<MemberHeader authView={authView} />` へ配信
- focused Vitest 9件、workspace typecheck、workspace lint、grep gate を Phase 11 evidence に保存
- header 単体の local visual sanity として `outputs/phase-11/screenshots/member-header-member.png` / `member-header-admin.png` を保存し、Phase 12 実装ガイドへ参照を追加
