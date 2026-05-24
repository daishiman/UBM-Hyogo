# Phase 4 — テスト作成

## 目的

実装着手時に、既存 public component tests を先に確認し、CTA の data-role contract を focused test で固定する。

## テスト対象

- `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`
- `apps/web/src/components/public/__tests__/*.spec.tsx`
- `apps/web/src/__tests__/tokens.runtime.spec.ts`

## 完了条件

- ✅ CTA の `data-role` / `data-variant` assertion を `CallToActionCTA.component.spec.tsx` に追加済み
- ✅ CSS-only task-01 は unit test 追加なし、token grep / visual evidence で検証済み
