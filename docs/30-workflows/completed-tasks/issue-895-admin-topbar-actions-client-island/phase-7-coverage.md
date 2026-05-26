# Phase 7 — カバレッジ

## 7.1 対象範囲

新規追加分は `AdminTopbarActions.tsx`（~10 lines、props なし純粋関数 component）。`SignOutButton` は既存 spec カバー済みのためここでは触らない。

## 7.2 カバレッジ目標

| ファイル | line | branch | 備考 |
|----------|------|--------|------|
| `AdminTopbarActions.tsx` | 100% | 100% | 単一 render path のみ |
| `(admin)/layout.tsx` | 既存と同等以上 | 既存と同等以上 | 差分は `actions` props 注入のみで分岐追加なし |

## 7.3 確認コマンド

```bash
mise exec -- pnpm --dir apps/web exec vitest run --coverage \
  apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx
```

## 7.4 グローバル coverage gate への影響

差分は新規 1 file + 既存 1 line 編集のみ。`scripts/coverage-guard.sh` の `--changed` モードで実行し、既存 baseline を下回らないことを確認する。
