# Phase 5 — 実装実行記録

実装ファイル一覧と最終差分は `outputs/phase-12/implementation-guide.md` を正本とする。

実装順序:

1. T-01 adapter `apps/web/src/lib/adapters/member-detail.ts`
2. T-03 fixture `apps/web/src/fixtures/public-member-profile.ts`（STABLE_KEY 定数経由）
3. T-04 composing primitive `apps/web/src/components/public/MemberDetail.tsx`
4. T-05 page.tsx refactor
5. T-02 adapter unit spec（8 ケース全 green まで T-01 を反復補正）

各フェーズ終了時に `git status` で実コード変更が反映されていることを確認した。
