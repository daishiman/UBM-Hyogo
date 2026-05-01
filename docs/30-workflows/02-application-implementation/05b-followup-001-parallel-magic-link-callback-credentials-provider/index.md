# 05b-followup-001-parallel-magic-link-callback-credentials-provider

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 05b-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | NON_VISUAL |

## purpose

Magic Link メール内 URL と Auth.js session 確立の接続漏れを実装する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、現状コード・正本仕様・未割当タスクを照合して残った未実装または未運用 gate だけを扱う。

05b 本体は Magic Link 発行・検証 API と proxy を実装済みだが、API が発行する `/api/auth/callback/email?token=&email=` に対応する Web route と Auth.js Credentials Provider 本体が未実装である。これは証跡不足ではなく、ログイン導線が 404 または session 未確立になる実装漏れである。

## scope in / out

### Scope In
- Auth.js Credentials Provider の本実装
- `/api/auth/callback/email` GET route 実装
- Magic Link verify 結果から JWT session 確立
- 失敗時 redirect/error handling
- unit/route contract test

### Scope Out
- Google OAuth 実装の置換
- メール送信 provider 変更
- production secret 値の記録
- 未承認 commit/push/PR

## dependencies

### Depends On
- 05b Magic Link 発行・検証 API
- 06b member login UI
- AUTH_SECRET / NEXTAUTH_URL 相当の環境変数

### Blocks
- 06b logged-in profile visual evidence
- 08b auth E2E full execution
- 09a staging auth smoke

## refs

- docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md
- apps/api/src/routes/auth/index.ts
- apps/web/app/lib/auth/config.ts
- apps/web/src/lib/auth.ts

## AC

- `/api/auth/callback/email?token=&email=` が 404 にならない
- 正しい token/email で session cookie が確立される
- 不正 token/email は login error に戻される
- apps/web から D1 直参照せず API/proxy 境界を守る
- 関連 route/auth tests が追加される

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

- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- #15 Auth session boundary

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
