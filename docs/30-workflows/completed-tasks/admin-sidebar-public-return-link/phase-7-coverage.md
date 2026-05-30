# Phase 7: カバレッジ

**[実装区分: 実装仕様書]**

## 対象範囲

`apps/web/src/components/layout/AdminSidebar.tsx`

## 目標カバレッジ

| 指標 | 目標 | 備考 |
|------|------|------|
| Statements | ≥ 90% | 純粋 render のため到達容易 |
| Branches | ≥ 85% | `userDisplayName || userEmail || "管理者"` フォールバック・`badgeKey` 分岐をカバー |
| Functions | ≥ 90% | `resolveBadge` / `AdminSidebar` 本体 |
| Lines | ≥ 90% | — |

## 追加検証ケース（カバレッジ充足のため）

- `schemaDiffCount === 0` のとき schemaDiff badge が描画されるが count=0 表示になることを確認（既存挙動）
- `userDisplayName === ""` のとき `userEmail` がフォールバック表示されること
- `userDisplayName === ""` かつ `userEmail === ""` のとき「管理者」が表示されること

> これらは Phase 6 のメインスニペットには含めず、`describe("AdminSidebar - fallback")` ブロックで追加するのが推奨。

## 確認コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  src/components/layout/__tests__/AdminSidebar.spec.tsx
```

カバレッジレポートは `apps/web/coverage/` 配下に出力される。`AdminSidebar.tsx` 行を抽出して目標達成を確認する。

## DoD

- [ ] AdminSidebar.tsx の Statement / Branch / Function / Line カバレッジが目標値以上
- [ ] カバレッジレポートで `data-role="public-return"` を含む anchor 行が covered であること
- [ ] 既存カバレッジ目標（repo-level）を低下させない
