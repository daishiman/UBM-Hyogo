# Phase 11 UI Sanity Visual Review

## Scope

本 WF のコード変更は transport / env 層（`env.ts` / `transport.ts` / `authed.ts` / 診断スクリプト）に閉じ、UI コンポーネント・トークン・色・レイアウト surface は一切変更しない（SSOT §2 設計不変点: `/profile` page.tsx・`session-error-display.ts`・`SectionError` 非接触）。新規 primitive・新規 endpoint も追加しない。

## Local Review（focused evidence captured）

- jsdom focused testsで `/profile` の既存分岐・文言が**無変更**であることを回帰固定する（env/transport/authed は local PASS、staging visual は user-gated）。
- UI 外観に差分が出ないことが期待値のため、static UI contract screenshot の新規取得は計画しない（差分ゼロ確認は spec の文言アサーションで担保）。

## Pending Runtime Review

- 復旧後 staging `/profile` の正常描画確認（RT-C）と runtime screenshot（`profile-session-recovery-staging.png`）は認証必須のため user-gated・pending。
- 復旧確認の視覚レビュー観点: エラーバナー非表示・マイページ本体（会員情報セクション）描画・サイドバー会員表示の整合。
