# Phase 7: カバレッジ確認

## 7.1 対象範囲（局所指定 / Feedback BEFORE-QUIT-002 準拠）

| ファイル                                          | line 目標 | branch 目標 |
| ------------------------------------------------- | --------- | ----------- |
| `apps/web/src/lib/admin/server-fetch.ts`          | 100%（変更行のみ）| 100%（変更行のみ）|
| `apps/web/src/lib/env.ts`（差分箇所のみ）         | 100%      | 100%        |

`fetchAdmin` 本体の全分岐（fixture branches）は既存 unit + Phase 6 追加分でカバー。

## 7.2 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web vitest run \
  --coverage \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts
```

## 7.3 NON_VISUAL + 単一ファイル変更タスクの簡略化（EMB-005-FB）

本タスクは NON_VISUAL かつ実質的に単一 helper の修正であるため、Phase 6 で coverage が担保される場合 Phase 7 は実測のみで完了とする。
