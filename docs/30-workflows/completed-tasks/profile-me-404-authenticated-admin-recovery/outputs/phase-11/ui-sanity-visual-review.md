# Phase 11 UI Sanity Visual Review

## NON_VISUAL 宣言（WEEKGRD-03 準拠）

| 項目 | 値 |
| --- | --- |
| タスク種別 | **NON_VISUAL** |
| 非視覚的理由 | 本 WF のコード変更 T01〜T04 は **API ログ / CI/CD / 診断 script / web transport ログ層のみ**を変更し、UI 描画を一切変えない。T01=`apps/api` notFoundHandler 構造化ログ追加（応答 body/status 不変）／ T02=`.github/workflows/api-cd.yml` 新規（CI/CD・YAML）／ T03=`apps/web` `safe-fetch`/`fetchAuthed` の route-404 ログ強化（UI 文言・分岐・path・shape 不変・AC-6）／ T04=`scripts/diagnose-profile-session.sh` 拡張（read-only stdout）。`session-error-display.ts` / `SectionError` / `/profile` page.tsx・トークン・色・レイアウト surface は非接触。 |
| 代替証跡 | `manual-test-result.md`（証跡メタ・自動テスト名/件数）+ 復旧後 staging screenshot（`profile-me-404-recovery-staging.png`・user-gated） |

## Scope

本 WF のコード変更は API/CI/CD/script/web-transport ログ層に閉じ、UI コンポーネント・トークン・色・レイアウト surface は一切変更しない（SSOT §0・§4 状態所有権表: web 表示分岐 = 文言・分岐・path・shape 不変、T03 は診断ログのみ追加）。新規 primitive・新規 endpoint も追加しない。

## Local Review（実装着手時に focused evidence で固定）

- jsdom / node focused tests で `/profile` の既存分岐・文言が**無変更**であることを回帰固定する（T01=`error-handler.spec.ts`、T03=`safe-fetch.spec.ts`）。本 wave で API focused Vitest 1 PASS、web focused Vitest 12 PASS を取得済み。
- UI 外観に差分が出ないことが期待値のため、static UI contract screenshot の新規取得は計画しない（差分ゼロ確認は spec の文言アサーション = `session-error-display` 分岐不変 / `MEMBER_SESSION_404` 文言不変で担保）。

## Pending Runtime Review（VISUAL_ON_EXECUTION・user-gated）

- 復旧後 staging `/profile` の正常描画確認（RT-D）と runtime screenshot（`outputs/phase-11/screenshots/profile-me-404-recovery-staging.png`）は認証必須のため user-gated・pending。
- 復旧確認の視覚レビュー観点: `MEMBER_SESSION_404` エラーバナー非表示・マイページ本体（会員情報セクション）描画・サイドバー会員表示の整合。
- この visual 証跡は「コード変更による UI 改修」ではなく「障害復旧の確認」であり、NON_VISUAL 宣言と矛盾しない（代替証跡として位置づける）。
