# Phase 7: リファクタリング

## 目的

`IdentityConflictRow` hardening 後に、振る舞いを変えずに責務・命名・重複を整理する。

## 実行タスク

- [ ] `callJson()` / fetch 直書きが残っていないことを確認
- [ ] `useAdminMutation` import 経路を統一
- [ ] error mapping が過剰に膨らむ場合のみ小さな helper へ抽出
- [ ] `responseEmailMasked` のみ表示し raw email を追加しない
- [ ] focused unit を再実行

## 実行手順

```bash
rg -n "callJson|fetch\\(" apps/web/src/components/admin/IdentityConflictRow.tsx
rg -n "useAdminMutation|candidateTargetMemberId|responseEmailMasked" apps/web/src/components/admin/IdentityConflictRow.tsx
pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow.spec.tsx
```

## 成果物

- `outputs/phase-07/refactor-log.md`
- `outputs/phase-07/regression-test.log`

## 完了条件

- [ ] 重複 fetch helper 0 件
- [ ] request body は `{ targetMemberId, reason }` のみ
- [ ] raw email 表示 0 件
- [ ] focused unit green
- [ ] 先送り TODO 0 件

## 次 Phase

Phase 8: 統合テスト。
