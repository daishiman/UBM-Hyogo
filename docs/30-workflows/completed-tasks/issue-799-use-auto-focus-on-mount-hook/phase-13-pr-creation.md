# Phase 13 — PR 作成

## PR base / branch

- base: `dev`
- branch (例): `feat/issue-799-use-auto-focus-on-mount-hook`

## PR title (70 文字以内)

`feat(issue-799): useAutoFocusOnMount hook + error boundaries`

## PR body テンプレート

```markdown
## Summary

- `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` を新規追加し、Next.js App Router error boundary の自動 focus パターンを共通化
- 既存 root `apps/web/app/error.tsx` (i06) を hook 経由に置換
- 未対応だった `login` / `profile` / `(admin)/admin` の 3 error boundary に hook を適用し、a11y focus 管理を統一

## Why

Issue #799 (issue-769 followup) で要求された hook 抽出。調査の結果、Issue 本文の「i05 / i06 で二重化」前提は実コードと乖離しており、focus パターンは i06 (root) のみが実装済みで他 3 boundary は a11y focus 未対応だった。本 PR で hook 抽出と未対応 3 boundary の横展開を同時実施し、error boundary 横断で a11y 体験を統一する。

## Changes

- 新規: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`
- 新規: `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx`
- 編集: `apps/web/app/error.tsx`（hook 経由化）
- 編集: `apps/web/app/login/error.tsx` / `apps/web/app/profile/error.tsx` / `apps/web/app/(admin)/admin/error.tsx`（hook 適用 + ref/tabIndex 追加）
- 新規: 3 boundary 各 `error.component.spec.tsx`
- 編集: `docs/30-workflows/completed-tasks/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md`（followup consumed 更新）

## Test plan

- [ ] `mise exec -- pnpm typecheck` pass
- [ ] `mise exec -- pnpm lint` pass
- [ ] `mise exec -- pnpm --filter @ubm/web vitest run src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx` pass
- [ ] 4 boundary component spec pass
- [ ] `bash scripts/verify-pr-ready.sh` pass
- [ ] 既存 `apps/web/app/__tests__/error.component.spec.tsx` AC 不変

Refs #799
```

## 事前チェック

PR 作成前に `bash scripts/verify-pr-ready.sh` で `gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` drift を解消する。
