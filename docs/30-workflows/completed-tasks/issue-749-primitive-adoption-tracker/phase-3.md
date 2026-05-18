# Phase 3: 環境準備・依存確認・ゲート判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 種別 | 環境確認 |
| 入力 | Phase 2 設計 |
| 出力 | PASS / MINOR / MAJOR 判定、Phase 4 開始条件 |

## 目的

- Phase 4 に進む前のブロッカー（依存 primitive の export 完備、`tokens.css` の OKLch トークン適用、`useAdminMutation` の signature 一致）を確認する
- NO-GO 条件に該当する場合は Phase 2 へ戻す

## 実行タスク

1. `apps/web/src/components/ui/FormField.tsx` の export と props を Phase 2 設計と照合
2. `apps/web/src/components/ui/EmptyState.tsx` / `Pagination.tsx` の props と一致確認
3. `apps/web/src/features/admin/hooks/useAdminMutation.ts` の signature が canonical 使用形と一致するか確認
4. `apps/web/src/components/admin/Breadcrumb.tsx` の `items` props 型確認
5. `apps/web/src/styles/tokens.css` の OKLch tokens が既存定義されているか確認（task-09 spec）
6. `verify-design-tokens` が現状 green であることを確認

## ゲート判定

| 判定 | 戻り先 | 条件 |
| --- | --- | --- |
| PASS | Phase 4 | 6 primitive + hook の signature が Phase 2 設計と完全一致 |
| MINOR | Phase 2 微修正 → Phase 4 | props 名の軽微 drift（adapter で吸収可能） |
| MAJOR | Phase 2 へ戻し | signature 不一致、primitive の export 欠落、`tokens.css` 不在 |
| NO-GO | 本タスク停止 | 新 API endpoint / D1 schema 変更が必要と判明、parallel-09 spec が削除されている |

## 完了条件

- [ ] 6 primitive + hook の signature と Phase 2 canonical 使用形が一致
- [ ] `verify-design-tokens` が green
- [ ] PASS 判定が記録されている

## 次Phase

→ Phase 4（実装）
