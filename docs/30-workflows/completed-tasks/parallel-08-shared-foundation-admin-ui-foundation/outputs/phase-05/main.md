# Phase 5 成果物 — 実装

## 実コード変更 (git diff / 新規ファイル)

| Path | 種別 | 状態 |
|------|------|------|
| `apps/web/app/layout.tsx` | modify | `ToastProvider` import + `<body>` 直下 wrap 適用済 |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | create | `"use client"` + 型 + skeleton throw |
| `apps/web/src/features/admin/hooks/index.ts` | create | barrel re-export (`type` 付き) |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | create (Phase 4 由来) | 3 contract tests |

## DoD

- [x] T1〜T3 ファイル変更が `git status` で確認できる
- [x] `tsc --noEmit` 0 error (`outputs/phase-11/evidence/typecheck.log`)
- [x] `pnpm lint` 0 error (`outputs/phase-11/evidence/lint.log`)
- [x] T4/T5/T6 grep 確認は `confirm-log.md` に記録
- [x] CLAUDE.md 不変条件破壊なし
