# Phase 13 — PR Summary（実装完了後にユーザー承認の上で使用）

## PR タイトル案

`feat(issue-800): error boundary focus hook and a11y rollout`

## Base ブランチ

`dev`（CLAUDE.md 既定）

## Summary

- `useAutoFocusOnMount` を追加し、root / profile / login / admin の error boundary focus 管理を統一
- profile / login / admin に `aria-live="assertive"` / digest 表示 / `logger.error` 構造化ログ / dev-only stack 表示を横展開
- focused tests 5 files / 31 cases で hook と各 boundary を検証
- 関連 Issue: Refs #800 (CLOSED 状態のため `Closes` / `Fixes` / `Resolves` は使わない)

## Test plan

- [x] `pnpm -F "@ubm-hyogo/web" typecheck` 0 error
- [x] `pnpm -F "@ubm-hyogo/web" lint` 0 error
- [x] focused Vitest 5 files / 31 tests PASS
- [ ] `git diff --name-only dev...HEAD` が実装範囲と Phase 文書に一致
- [ ] 手動 SR smoke（任意 / NVDA or VoiceOver）

## 変更ファイル

- `apps/web/app/profile/error.tsx`
- `apps/web/app/profile/__tests__/error.component.spec.tsx`
- `apps/web/app/error.tsx`
- `apps/web/app/login/error.tsx`
- `apps/web/app/login/__tests__/error.component.spec.tsx`
- `apps/web/app/(admin)/admin/error.tsx`
- `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx`
- `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`
- `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx`
- `docs/30-workflows/completed-tasks/issue-800-profile-error-focus-transfer/**`（仕様書一式）

## ユーザー承認待ち

commit / push / `gh pr create` はユーザー指示後に実施。
