# Phase 7 — Coverage

## 1. Coverage Scope

Focused component tests で `MemberCard` / `MemberGrid` / `MemberFilters` / `EmptyState` の変更点を確認する。

## 2. Covered Cases

| area | covered by |
| --- | --- |
| list density card row | `MemberCard.spec.tsx`, `MemberCard.component.spec.tsx` |
| list density grid header | `MemberGrid.spec.tsx` |
| TagPicker heading | `MemberFilters.client.spec.tsx` |
| compact empty state | `EmptyState.component.spec.tsx` |

## 3. Evidence

`pnpm --filter @ubm-hyogo/web test -- MemberCard MemberGrid MemberFilters EmptyState` PASS。Full web suite evidence は Phase 11 / Phase 12 outputs に記録する。
