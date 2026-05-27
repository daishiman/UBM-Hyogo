# Phase 6 — テスト拡充

## 1. 追加・更新したテスト

| path | 追加確認 |
| --- | --- |
| `apps/web/src/components/public/__tests__/MemberCard.spec.tsx` | list density の詳細リンク、occupation 表示、chip-row |
| `apps/web/src/components/public/__tests__/MemberCard.component.spec.tsx` | list density で occupation を隠さない regression |
| `apps/web/src/components/public/__tests__/MemberGrid.spec.tsx` | list header と `MemberCard density="list"` |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | TagPicker heading「タグで絞り込み」 |
| `apps/web/src/components/feedback/__tests__/EmptyState.component.spec.tsx` | compact variant marker |
| `apps/web/playwright/tests/members-prototype-alignment.spec.ts` | current workflow root と `MemberGrid[data-density="list"]` selector |

## 2. Regression Gates

```bash
rg -n "from .*MemberTable|import .*MemberTable" apps/web/app apps/web/src
rg -n "#[0-9a-fA-F]{3,8}" apps/web/src/components/public apps/web/src/components/feedback apps/web/src/styles/legacy-public.css
```

期待値はいずれも 0 件。Playwright HTML report 内の埋め込み asset は grep 対象外。

## 3. DoD

- [x] 新規・更新 spec は `*.spec.{ts,tsx}` 命名
- [x] current contract にない tags / business overview をテスト要求にしない
- [x] list density で table 要素へ戻らないことを component / Playwright selector で確認する
