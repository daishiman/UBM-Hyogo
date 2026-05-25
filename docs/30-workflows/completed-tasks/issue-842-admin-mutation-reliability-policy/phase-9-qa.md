# Phase 9: 品質保証

> 実装完了後の最終品質ゲート。AC-13 / AC-14 / AC-15 と legacy 物理削除（AC-7）の検証を行う。
> 本タスクは NON_VISUAL（admin hooks 内部の信頼性 policy。UI 視覚変更なし）。

## 1. 型・lint・build QA

| # | コマンド | PASS 基準 | 対応 AC |
|---|---|---|---|
| 1 | `mise exec -- pnpm typecheck` | 0 error。特に overload（Phase 2 §3）導入後に全 admin caller が型回帰しない | AC-13 |
| 2 | `mise exec -- pnpm lint` | 0 error / 0 warning（baseline 維持）。`pnpm lint --fix` で自動修正後も残違反 0 | AC-14 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web build` | PASS（OpenNext Workers 互換、`next build --webpack` が正本。Turbopack を deploy bundle に混入させない）| — |

## 2. legacy 物理削除確認（AC-7）

Phase 5 で削除した legacy（index.md「変更対象ファイル」§削除）の参照ゼロを証跡化する。

| # | コマンド / 確認 | PASS 基準 |
|---|---|---|
| 4 | `grep -rn "lib/useAdminMutation" apps/web` | **0 件**（テスト import を含め全削除済。stub / re-export / deprecate ではなく物理削除のため、参照が 1 件でも残れば FAIL）|
| 5 | `apps/web/src/lib/useAdminMutation.ts` の不在確認 | ファイルが存在しない（`git status` に delete として現れる。物理削除なので git delete を PASS 基準とする）|
| 6 | `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` の不在確認 | ファイルが存在しない（git delete）|

> 削除根拠（Phase 2 §6 / Phase 1 AC-7）: production caller 0 件・新旧シグネチャ非互換（legacy=`useAdminMutation({mutationFn})` / 新=`useAdminMutation(endpoint, method, options)`）で re-export 不能。deprecate は dead code 温存に過ぎないため物理削除を採用。

## 3. テスト QA

| # | 確認 | PASS 基準 | 対応 AC |
|---|---|---|---|
| 7 | 該当 vitest 完走 | `useAdminMutation.spec.ts` / `useConfirmDialog.spec.ts` が **0 fail**（timeout / retry / idempotency / 404 三値 / abort / `onCancelMutation` 連携の Phase 6 追加分含む）| AC-12 / AC-15 |
| 8 | 全 admin caller の型回帰確認 | Phase 1 §2 inventory の全 caller（`MemberDrawer` / `MeetingPanel` / `IdentityConflictRow` / `TagsQueueResolveDrawer` / `SchemaDiffPanel` / `RequestQueuePanel`）が typecheck PASS。POST/PATCH caller に retry overload の型エラーが波及しない（Phase 2 §7・Phase 3 §4 リスク対処）| AC-8 / AC-13 |

該当テスト実行コマンド例:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/features/admin/hooks/
```

## 4. スコープ非破壊確認（index.md スコープ外）

| # | 確認 | PASS 基準 |
|---|---|---|
| 9 | `apps/api` endpoint surface 追加なし | API route 差分なし（AC-9）|
| 10 | D1 schema 変更なし / `apps/web` から D1 直接アクセス追加なし | migration 差分なし・binding 直参照なし（AC-10 / AC-11、不変条件 5）|
| 11 | `MeetingAttendancePanel.tsx` 不変 | 本サイクルで変更しない（POST 404 は既定 `false` で現挙動維持。index.md / AC-6 最適化）|
| 12 | `ConfirmDialog.tsx` 不変 | focus trap / restore に回帰なし（Phase 2 §1 / 不変条件・step-06 完了済）|

## 5. DoD（Phase 9 完了条件）

- [ ] `mise exec -- pnpm typecheck` 0 error（AC-13）
- [ ] `mise exec -- pnpm lint` 0 error / 0 warning（baseline 維持・AC-14）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` PASS（`next build --webpack`）
- [ ] `grep -rn "lib/useAdminMutation" apps/web` が 0 件（テスト含め全削除・物理削除を git delete で確認・AC-7）
- [ ] 該当 vitest 0 fail（AC-12 / AC-15）
- [ ] 全 admin caller の型回帰なし（AC-8 / AC-13）
- [ ] スコープ外（API / D1 / MeetingAttendancePanel / ConfirmDialog）に非破壊（AC-9〜AC-11 / AC-6）
