# 05b-A-auth-mail-env-contract-alignment

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 05b-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | NON_VISUAL |

## purpose

Magic Link/認証メールの環境変数名と正本仕様の不整合を解消する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、プロトタイプ・仕様書・現行ソースを突き合わせて確認した未反映箇所だけを扱う。

`docs/00-getting-started-manual/specs/10-notification-auth.md` と `08-free-database.md` は `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL` を要求する。一方、現行実装と aiworkflow-requirements は `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` を使う。このままだと Cloudflare Secrets 登録・runbook・実装のどれを正とするかが曖昧になり、staging/prod で Magic Link が失敗する可能性がある。

## scope in / out

### Scope In
- 正本 env 名の決定
- 実装または仕様書の片寄せ
- 後方互換 alias の必要性判断
- Cloudflare Secrets / 1Password / docs の同期
- Magic Link send smoke の AC 更新

### Scope Out
- メール provider の全面変更
- secret 実値の記録
- 通知基盤 UT-07 全実装
- 未承認 commit/push/PR

## dependencies

### Depends On
- 05b Magic Link provider
- 10-notification-auth.md
- environment-variables.md
- deployment-secrets-management.md

### Blocks
- 05b-B-magic-link-callback-credentials-provider
- 09a-A-staging-deploy-smoke-execution（staging auth smoke）
- 09c-A-production-deploy-execution（production deploy readiness）

## refs

- docs/00-getting-started-manual/specs/10-notification-auth.md
- docs/00-getting-started-manual/specs/08-free-database.md
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
- apps/api/src/index.ts
- apps/api/src/routes/auth/index.ts
- apps/api/src/services/mail/magic-link-mailer.ts

## AC

- env 名の正本が1つに統一される
- Cloudflare/1Password/runbook の配置先が一致する
- production で未設定時 fail-closed の仕様が明記される
- staging smoke で Magic Link メール送信設定を確認できる
- secret 実値が repo/evidence に残らない

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

- #16 secret values never documented
- #15 Auth session boundary
- #14 Cloudflare free-tier

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
