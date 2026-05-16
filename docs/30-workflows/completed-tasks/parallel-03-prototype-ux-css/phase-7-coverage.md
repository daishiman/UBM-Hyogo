# Phase 7: カバレッジ確認

> Phase: 7 / 13

---

## 目的

G3-1 / G3-2 / G3-3 の 3 系統が Vitest + Playwright + axe でカバーされていることを可視化する。

---

## カバレッジ matrix

| 系統 | Vitest | Playwright | axe |
|------|--------|------------|-----|
| G3-1 tag pill pressed state | ✅ `MemberFilters.client.spec.tsx` | ✅ `visual-feedback.spec.ts` | ✅ critical 0 |
| G3-2 member card hover transition | （CSS のため Vitest 対象外） | ✅ `visual-feedback.spec.ts` | — |
| G3-3 visibility marker | ✅ `MemberDetailSections.component.spec.tsx` | ✅ `visual-feedback.spec.ts` | ✅ critical 0 |

---

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

`apps/web/src/components/public/MemberFilters.client.tsx`・`MemberDetailSections.tsx`・`FormPreviewSections.tsx` の関連 branch coverage が既存閾値以上であることを確認。Playwright / axe は Phase 11 runtime execution で tracked evidence に昇格済み。

---

## DoD

- [ ] 3 系統すべてに最低 1 テストが対応
- [ ] coverage 既存基準を下回らない
