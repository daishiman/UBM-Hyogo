# Phase 4 — Task Breakdown

| ID | タスク | 種別 | 並列可 | 依存 | 状態 |
| --- | --- | --- | --- | --- | --- |
| T-01 | `fetchAuthed` 既存 spec の網羅確認 (200/401/403/500/network) | test | ◯ | — | 既存で網羅済み (`authed.spec.ts`) |
| T-02 | `toLoginRedirect` / `normalizeRedirectPath` の 5 ケース | test | ◯ | — | 既存で網羅済み (`login-redirect.spec.ts`) |
| T-03 | `Toast.tsx` に variant 追加 | code | ◯ | — | 完了 |
| T-04 | `Toast.spec.tsx` 新規（variant 描画 + auto-dismiss） | test | × | T-03 | 完了 |
| T-05 | `useAdminMutation.ts` を実装 | code | × | T-03 | 完了 |
| T-06 | `useAdminMutation.spec.tsx` 新規 (6 ケース DI) | test | × | T-05 | 完了 |
| T-07 | `features/admin/hooks/index.ts` re-export | code | × | T-05 | 完了 |
| T-08 | `auth-session-policy.md` 生成 | docs | ◯ | — | 完了 |
| T-09 | Phase 11 evidence (typecheck/lint/test/build) | verify | 最終 | T-01..T-07 | 完了 |
| T-10 | Phase 12 必須 7 ファイル同期 | docs | 最終 | T-09 | 完了 |
