# Phase 11: 手動テスト結果（NON_VISUAL 代替証跡）

> タスク種別 **NON_VISUAL**。UI/UX 視覚変更なしのためスクリーンショット不要。
> 一次証跡 = 自動テスト（vitest）の source-level PASS。

## 実行コマンド・実行日時

- 実行日時: 2026-05-24
- コマンド:

```bash
mise exec -- pnpm exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts \
  apps/web/src/features/admin/hooks/__tests__/useConfirmDialog.spec.tsx
# （cwd: apps/web。package.json test script と同じ root/config を使用）
```

## source-level PASS（AC-12 / AC-15 証跡）

| ファイル | total | passed | failed |
|---|---|---|---|
| `useAdminMutation.spec.ts` | 33 | 33 | 0 |
| `useConfirmDialog.spec.tsx` | 13 | 13 | 0 |
| **合計** | **46** | **46** | **0** |

`Test Files 2 passed (2) / Tests 46 passed (46)`。

### 追加 5 観点（Phase 6 / AC-12）の TC 一覧と PASS 状態

| 観点 | TC | 状態 |
|---|---|---|
| timeout 発火・silent abort | TC-11（timeout silent）/ TC-23（abort() silent）/ TC-24（retry 中 timeout） | PASS |
| AbortError 判定（型差異吸収） | TC-25（DOMException）/ TC-26（plain Error）/ TC-12（誤 abort なし）/ TC-12b（timeoutMs: 0 は既定値扱い） | PASS |
| retry 上限・backoff | TC-13（retry 成功）/ TC-14（maxAttempts 失敗）/ TC-15（4xx は retry しない）/ TC-16（exponential backoff） | PASS |
| idempotency-key 注入 | TC-17 / TC-18 / TC-19 / TC-29 | PASS |
| 404 三値挙動 | TC-20（false=失敗）/ TC-21（silent）/ TC-22（{toast}） | PASS |
| mutationFn 経路の非適用 | TC-27（timeout 非適用）/ TC-28（retry 非適用・onError 発火） | PASS |
| 型レベル制約 | TC-TY-01（POST/PATCH に retry → `@ts-expect-error`） | PASS |

### useConfirmDialog abort 連携（AC-5）

| TC | 内容 | 状態 |
|---|---|---|
| U7（改訂） | submit 中 close = INITIAL（onCancelMutation 未指定でも安全） | PASS |
| U10 | submit 中 close で onCancelMutation 呼出 + INITIAL | PASS |
| U11 | 非 submit 中 close では onCancelMutation 未呼出 | PASS |
| U12 | rerender で onCancelMutation の最新が呼ばれる（ref 経由） | PASS |

## 環境ブロッカー

なし（vitest 完走。esbuild / worktree isolation / arch 不整合の発生なし）。

## 手動 smoke（任意・未実施）

NON_VISUAL かつ自動テストが主証跡のため、TC-S1〜TC-S3 のブラウザ smoke は未実施（省略可・Phase 11 §2）。
