# 09a-followup-001-parallel-staging-deploy-smoke-execution

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 9a-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

09a の NOT_EXECUTED placeholder を実 staging evidence に置換する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、正本上で未実装・未実測として残った follow-up gate だけを扱う。

09a は staging deploy smoke / Forms sync validation の実行仕様を完了しているが、実 staging 環境の deploy smoke、UI visual smoke、Forms sync validation は未実行である。09c production deploy の前提にできない。

## scope in / out

### Scope In
- staging web/api deploy smoke
- 公開/ログイン/profile/admin の visual smoke
- Forms schema/responses sync validation
- sync_jobs/audit evidence
- wrangler tail redacted log
- 09c blocker 更新

### Scope Out
- production deploy
- 新規 UI/API 機能追加
- secret 値の文書化
- 未承認 commit/push/PR

## dependencies

### Depends On
- 08a coverage gate
- 08b E2E evidence
- Cloudflare staging secrets
- staging Pages/Workers target

### Blocks
- 09c production deploy execution

## refs

- docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md
- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/
- docs/00-getting-started-manual/specs/15-infrastructure-runbook.md

## AC

- 09a Phase 11 の NOT_EXECUTED が実 evidence に置換される
- UI/authz/admin route smoke evidence が保存される
- Forms schema/responses sync evidence が保存される
- wrangler tail または取得不能理由が保存される
- 09c blocker が実測結果で更新される

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
- #14 Cloudflare free-tier

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
