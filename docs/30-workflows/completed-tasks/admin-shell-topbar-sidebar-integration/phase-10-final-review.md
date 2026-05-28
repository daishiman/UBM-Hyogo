# Phase 10: 最終レビュー

## セルフレビューチェック項目

- [ ] 不変条件 #1 (schema 固定しすぎない): 影響なし
- [ ] 不変条件 #5 (D1 直接アクセス禁止): 守られている
- [ ] 不変条件 #8 (spec 拡張子 `.spec`): 新規 spec は `.spec.tsx` / `.spec.ts`
- [ ] 不変条件 #9 (admin form input は FormField 経由): 本 task で input 追加なし・影響外
- [ ] 不変条件 #10 (admin mutation hook): 本 task で mutation 追加なし
- [ ] 不変条件 #11 (fail-closed auth): layout の二段 redirect 維持
- [ ] CONST_005: Phase 5.1 に変更ファイル一覧あり
- [ ] OKLch token 正本: HEX 直書き 0
- [ ] Phase 11 evidence 計画あり (phase-11-manual-test.md)
- [ ] 既存 PR #894/#895 との関係を Phase 3 と Phase 12 で明記

## レビュー観点別 sanity check

- topbar 撤去で auth gate に副作用がないこと (server boundary は維持)
- `usePathname` の SSR / CSR mismatch が発生しないこと (client component 化済)
- schema diff fetch の SSR 性能影響が無視できる範囲 (1 fetch / layout)
- nav テーブルと実 route の整合 (`/admin/dashboard/attendance` 等)
