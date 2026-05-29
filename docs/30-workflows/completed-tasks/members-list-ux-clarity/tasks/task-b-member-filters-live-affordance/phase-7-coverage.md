<!-- workflow: members-list-ux-clarity / task: B / phase: 7 -->

[実装区分: 実装仕様書]

# Phase 7 — カバレッジ確認 (Task B)

> 前提: Phase 6 まで GREEN

## 1. カバレッジ対象 (変更ファイル限定)

| ファイル | 期待 line | 期待 branch | 根拠 test |
| -------- | --------- | ----------- | --------- |
| `SelectedFiltersBar.client.tsx` | 100% | 100% | TC-B-SFB-01..07 |
| `MemberFilters.client.tsx` の差分行 (hint / output / onClearOne / resultCountText) | 100% | 100% | TC-B-MF-01..07 |
| `SelectedTagsBar.client.tsx` (wrapper) | 100% | 100% | TC-B-SFB-08 |
| `apps/web/app/(public)/members/page.tsx` の差分 2 行 | N/A (Server Component, page leveled coverage は Task C スコープ) | N/A | - |

> [Feedback 5] 対応: 本タスクは「変更行カバレッジ」を主眼にする。全体 % 指定はしない。

## 2. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm/web vitest run \
  --coverage \
  src/components/public/__tests__/MemberFilters.client.spec.tsx \
  src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  src/components/public/__tests__/SelectedTagsBar.client.spec.tsx
```

## 3. 対象外 (本 Phase ではカバレッジを取らない)

- `apps/web/app/(public)/members/page.tsx` — Server Component 全体カバレッジは Task C / 親 workflow スコープ
- `apps/web/src/lib/url/members-search.ts` — 本タスクで変更しないため対象外
- legacy css — 対象外

## 4. DoD

- [ ] `SelectedFiltersBar.client.tsx` line/branch 100%
- [ ] `MemberFilters.client.tsx` の差分行 line/branch 100%
- [ ] 未カバー branch は Phase 4/6 のテストに追加されている (新規未カバー 0 件)
