# I-02 admin mutation error 型統合

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | i02-admin-error-type-unify |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02-admin-error-type-unify/spec.md` |
| canonical_workflow | `docs/30-workflows/i02-admin-error-type-unify/`（in-place fix で完結予定。副作用拡大時のみ昇格） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| evidence_state | LOCAL_COMMAND_EVIDENCE_CAPTURED |
| 実装対象 | `apps/web/src/features/admin/hooks/useAdminMutation.ts`; `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`; `apps/web/src/features/admin/hooks/index.ts` |
| 作成日 | 2026-05-17 |
| Phase 13 | not_started |

## Summary

`apps/web/src/features/admin/hooks/useAdminMutation.ts` に存在する独自 error class
`AdminMutationHttpError` を削除し、`@/lib/fetch/authed` の共通 error class
（`AuthRequiredError` / `FetchAuthedError`）に統一する。これにより parallel-10 の
401 → `/login?redirect=...` redirect logic が admin mutation 経由でも自動発火するようになる。

`useAdminMutation` の戻り値型 `AdminMutationResult.error` の外形（`Error | null`）は不変。
内部 throw / instanceof 判定のみ置換する非破壊リファクタである。

## Scope

### 含む

- `useAdminMutation` 内の `AdminMutationHttpError` class 定義を削除
- 401 throw を `AuthRequiredError`、非 2xx throw を `FetchAuthedError` に置換
- hook 内 `instanceof AdminMutationHttpError` 分岐を新 class に置換
- `useAdminMutation.spec.ts` の expected error class 更新
- `hooks/index.ts` から旧 `AdminMutationHttpError` export を削除
- typecheck / lint / focused tests の green 化

### 含まない

- `apps/web/src/lib/fetch/authed.ts` の class signature 変更
- 新規 redirect URL helper の追加（既存 `toLoginRedirect` を流用し、hook 内は optional DI で接続）
- API endpoint 側の error response 変更
- D1 schema 変更
- commit / push / PR 作成

## Phase 一覧

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-01.md` | completed |
| 2 | `outputs/phase-02.md` | completed |
| 3 | `outputs/phase-03.md` | completed |
| 4 | `outputs/phase-04.md` | completed |
| 5 | `outputs/phase-05.md` | completed |
| 6 | `outputs/phase-06.md` | completed |
| 7 | `outputs/phase-07.md` | completed |
| 8 | `outputs/phase-08.md` | completed |
| 9 | `outputs/phase-09.md` | completed |
| 10 | `outputs/phase-10.md` | completed |
| 11 | `outputs/phase-11.md` | completed |
| 12 | `outputs/phase-12/main.md` | completed |
| 13 | `outputs/phase-13.md` | not_started |

## DoD

- [x] `useAdminMutation.ts` から `AdminMutationHttpError` class 定義が削除されている
- [x] 401 の throw が `AuthRequiredError`、非 2xx の throw が `FetchAuthedError(status, text)` に切替済
- [x] hook 内 instanceof 判定が `AuthRequiredError` / `FetchAuthedError` に切替済
- [x] 401 で `toLoginRedirect(currentPath)` 経由の `/login?redirect=...` が `redirector` に渡る
- [x] `useAdminMutation.spec.ts` の assertion が新 class で PASS
- [x] `hooks/index.ts` から旧 `AdminMutationHttpError` export が削除（または `@deprecated` alias のみ）
- [x] `mise exec -- pnpm typecheck` PASS
- [x] `mise exec -- pnpm lint` PASS
- [x] `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation` PASS
- [x] `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run authed` PASS（regression none）
- [x] commit / push / PR はユーザー承認まで未実行

## Same-wave 改善反映

2026-05-17 の elegant review で、実コードを `AuthRequiredError` / `FetchAuthedError`
へ同期し、401 redirect DI / `reset` 返却、Phase 12 strict 7、aiworkflow-requirements inventory/changelog/index
同期、source unassigned consumed trace を同一 wave で反映した。Phase 11 の正本
コマンドログは `outputs/phase-11/evidence/` に保存する。
