# 06b-B-profile-self-service-request-ui

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 06b-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

`/profile` に本人の公開停止/再公開申請と退会申請 UI を追加する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、プロトタイプ・仕様書・現行ソースを突き合わせて確認した未反映箇所だけを扱う。

仕様書 05-pages.md / 07-edit-delete.md / 09-ui-ux.md は `/profile` から公開停止と退会申請ができることを要求している。API 側は `POST /me/visibility-request` と `POST /me/delete-request` を実装済みだが、現行 UI は `StatusSummary`、Google Form 更新 CTA、回答表示、参加履歴のみで、申請 UI が存在しない。

## scope in / out

### Scope In
- 公開停止/再公開申請フォームまたは確認ダイアログ
- 退会申請フォームまたは確認ダイアログ
- `/me/visibility-request` / `/me/delete-request` の client helper
- pending/duplicate/error/success の UI 状態
- profile visual/E2E evidence への追加

### Scope Out
- プロフィール本文のアプリ内編集
- 管理者による即時削除処理
- admin request queue の大規模再設計
- 未承認 commit/push/PR

## dependencies

### Depends On
- 04b /me self-service API
- 06b profile page
- 06b-A-me-api-authjs-session-resolver（先行必須: production session が解決していない状態で申請 UI smoke は不可）

### 内部依存（同 wave 内 serial 実行を明示）
- 表記上は parallel だが、実依存は **06b-A → 06b-B → 06b-C** の serial。
- 本タスクは 06b-A 完了後に着手し、完了後に 06b-C が visual evidence を取得する。

### Blocks
- 06b-C-profile-logged-in-visual-evidence
- 08b profile E2E full execution

## refs

- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- apps/web/app/profile/page.tsx
- apps/web/app/profile/_components/EditCta.tsx
- apps/api/src/routes/me/index.ts

## AC

- マイページから公開停止/再公開申請を送れる
- マイページから退会申請を送れる
- 二重申請 409 をユーザーに分かる形で表示する
- 本文編集 UI は追加しない
- 申請 UI のスクリーンショット/E2E が保存される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- #4 profile body edit forbidden
- #5 apps/web D1 direct access forbidden
- #11 member self-service boundary

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
