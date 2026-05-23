**[実装区分: 実装仕様書]**

# Phase 8: 統合テスト

## メタ情報

- task: `i02-admin-error-type-unify`
- source spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02-admin-error-type-unify/spec.md`
- 関連: `parallel-08` (admin mutation hook), `parallel-10` (`/login?redirect=...` redirect)
- 対象ブランチ: `feat/i02-admin-error-type-unify`

## 目的

`useAdminMutation` の 401 系 throw を `AuthRequiredError` に統一した結果、
**admin mutation 経由でも p-10 の `/login?redirect=...` redirect が自動発火する**
ことを統合テストで保証する。

具体的には、admin route の form 操作 → API 401 応答 → hook の `AuthRequiredError` throw
→ `toLoginRedirect(currentPath)` → `redirector("/login?redirect=...")` 呼び出し、
までの一連の経路を 1 つの integration spec で検証する。

## 実行タスク

| ID | タスク | 出力 |
| --- | --- | --- |
| T-8-1 | p-10 redirect logic の存在確認・接点特定（`AuthRequiredError` を catch する箇所） | grep 結果 |
| T-8-2 | unit test の配置先決定 | `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` |
| T-8-3 | shared mock 戦略の確立（`next/navigation` / `fetch`） | mock helper 1 件 |
| T-8-4 | 401 → `/login?redirect=...` redirect の spec 1 件追加 | spec ファイル |
| T-8-5 | 403 / 5xx で redirect が起きないことの negative spec 追加 | 同 spec 内 |

## 参照資料

| パス | 用途 |
| --- | --- |
| `apps/web/src/lib/fetch/errors.ts` | `AuthRequiredError` / `FetchAuthedError` 定義 |
| `apps/web/src/lib/fetch/authed.spec.ts` | mock パターン参考 |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | テスト対象 hook |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | unit test の expected error 更新箇所 |

## 実行手順

1. p-10 redirect 実装箇所を grep で特定する。
   ```bash
   grep -rn "AuthRequiredError" /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-014848-wt-1/apps/web/src/
   grep -rn "redirect=" /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-014848-wt-1/apps/web/src/app/ /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-014848-wt-1/apps/web/src/features/
   ```
   p-10 が provider/error boundary を採用している場合は、その component を test renderer で wrap する。
2. hook unit test に redirect DI case を追加（`*.spec.ts`、`*.test.ts` 禁止）。
   - 配置: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
3. shared mock 戦略
   - `next/navigation` の `useRouter` を `vi.mock` し、`replace` を `vi.fn()` で観測する
   - `fetch` を `vi.stubGlobal("fetch", ...)` で 401 / 403 / 500 を返すよう切り替え
   - `useAdminMutation` 呼び出し component は最小の test harness を inline で定義
4. テストケース
   - TC-INT-1: 401 応答 → `redirector` が `"/login?redirect="` で始まる引数で 1 回呼ばれる
   - TC-INT-2: 403 応答 → `router.replace` が呼ばれない、`error` は `FetchAuthedError` のまま
   - TC-INT-3: 500 応答 → `router.replace` が呼ばれない、`error` は `FetchAuthedError`
5. 実行:
   ```bash
   mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run admin-mutation-auth-redirect
   ```

## 統合テスト連携

- p-10 が **未実装** の場合: 本 Phase の int test を `it.todo` で骨格のみ残し、p-10 完了後に有効化する（Phase 10 regression smoke と同時に解禁）。
- p-10 が **実装済み** の場合: 本 Phase で即時 PASS させる。i02 PR の DoD に含める。
- p-10 redirect logic が hook 内に閉じている場合は、`useAdminMutation` 単体で int test 可能。global error boundary 側にある場合は test harness で boundary を wrap する。

## 多角的チェック観点（AIが判断）

- error 型統一が `useAdminMutation.spec.ts` 内の assertion と一致しているか（`AuthRequiredError` / `FetchAuthedError`）
- `AdminMutationHttpError` への参照が int test 含めて 0 件であること（grep gate）
- next.js の `useRouter` mock が `useAdminMutation` 内 import path と整合しているか
- 401 redirect 後に再度同じ form submit を試みた場合の 2 重 redirect 抑止は p-10 責務とし、本 Phase ではスコープ外
- int test は `vi.useFakeTimers` を使わない（redirect 同期発火を素直に検証）

## サブタスク管理

- T-8-1, T-8-2 を先行（read-only / 設計）
- T-8-3, T-8-4, T-8-5 を 1 コミットで作成（テスト 1 ファイル）
- p-10 未着手なら T-8-4/5 を `it.todo` 化し、別 commit で本実装に差し替え

## 成果物

- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`（401 redirect DI case 追加）
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`（assertion 更新）

## 完了条件

- [ ] 上記 int spec が `mise exec -- pnpm -F "@ubm-hyogo/web" test` で PASS
- [ ] 401 / 403 / 500 の 3 ケースを網羅
- [ ] `AdminMutationHttpError` への grep 結果が 0 件
- [ ] p-10 未実装時は `it.todo` で骨格残置の方針を spec 冒頭コメントに明記

## タスク100%実行確認【必須】

- [ ] T-8-1〜T-8-5 すべて完了
- [x] テスト命名規約 `*.spec.ts` 遵守（lefthook `block-test-suffix` 通過）
- [ ] p-10 との連携方針が spec 冒頭コメントに記載
- [ ] Phase 9 へ進む前に `git status --porcelain` で漏れがないこと

## 次Phase

Phase 9: 品質ゲート（coverage / typecheck / lint / coverage-guard）。
