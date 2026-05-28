# Phase 7: カバレッジ確認

## 7.1 対象範囲（局所指定 / Feedback BEFORE-QUIT-002 準拠）

| ファイル                                          | line 目標 | branch 目標 |
| ------------------------------------------------- | --------- | ----------- |
| `apps/web/src/lib/fetch/authed.ts`                | 100%（変更行のみ）| 100%（変更行のみ）|
| `apps/web/app/(member)/profile/page.tsx`（差分箇所のみ）| 100%      | 100%        |

`fetchAuthed` 本体の全分岐（401 / !ok / success）は Phase 6 追加分でカバー。`ProfilePage` の `/me` 失敗・成功・redirect の 3 経路は Phase 6 TC-P1〜P3 でカバー。

## 7.2 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web vitest run \
  --coverage \
  apps/web/src/lib/fetch/authed.spec.ts \
  "apps/web/app/(member)/profile/page.spec.tsx"
```

## 7.3 NON_VISUAL + 単一ファイル群変更タスクの簡略化（EMB-005-FB）

本タスクは NON_VISUAL かつ実質的に 2 ファイルの局所修正であるため、Phase 6 で coverage が担保される場合 Phase 7 は実測のみで完了とする。
