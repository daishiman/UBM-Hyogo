# Phase 4 成果物 — テスト作成

## 追加テストファイル

`apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`

3 ケース構成 (`*.spec.ts` 命名 / lefthook `block-test-suffix` 適合):

1. `expectTypeOf` で `useAdminMutation` のシグネチャ (引数 `string` + `AdminMutationOptions | undefined` / 戻り型 `AdminMutationResult`) を pin
2. `expect(() => useAdminMutation(...)).toThrow("implementation in step-01")` で sentinel を pin
3. barrel `await import("../index")` で `useAdminMutation` 同一参照を確認

## AC マッピング

| AC | テストケース |
|----|-------------|
| AC-2 | (1) シグネチャ pin |
| AC-3 | (2) skeleton throw |
| AC-4 | (3) barrel re-export |

## 状態

Phase 5 実装後、Vitest で 3 / 3 passed。
