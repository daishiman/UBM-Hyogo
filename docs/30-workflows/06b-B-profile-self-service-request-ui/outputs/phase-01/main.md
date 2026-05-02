# Output Phase 1: 要件定義

## status

EXECUTED

## scope confirmed

- 公開停止/再公開・退会申請の UI を `/profile` に追加する
- API は既存の `POST /me/visibility-request` / `POST /me/delete-request` を再利用
- 本文編集 UI は追加しない（不変条件 #4）
- D1 直接アクセスはしない（不変条件 #5、proxy 経由）
- `:memberId` を path に出さない（不変条件 #11、session.memberId のみで解決）

## AC ↔ evidence

- AC1 公開停止/再公開申請を送れる → `apps/web/app/profile/_components/VisibilityRequest.client.tsx`
- AC2 退会申請を送れる → `apps/web/app/profile/_components/DeleteRequest.client.tsx`
- AC3 二重申請 409 をユーザーに分かる形で表示する → `me-requests-client.ts` の `SelfRequestError` + UI 文言
- AC4 本文編集 UI を追加しない → `static-invariants.test.ts` S-04 を合格
- AC5 申請 UI のスクリーンショット/E2E が保存される → 06b-C へ handoff（runtime 06b-A 後に実行）

## approval gate

- runtime smoke は 06b-A の Auth.js session resolver 完了後に着手
- commit / push / PR は本フェーズでは行わない
