# Phase 5: 実装ランブック — main

## 実装ステップ
1. `apps/api/src/repository/_shared/db.ts` 作成（DbCtx + 型ヘルパー）
2. `apps/api/src/repository/_shared/brand.ts`（@ubm-hyogo/shared から re-export）
3. `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`（テスト専用 in-memory）
4. 7 repository 実装
5. 7 *.test.ts 作成
6. typecheck / vitest 緑
