# 09b-followup-001-parallel-observability-sentry-slack-runtime-smoke

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 09b-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | NON_VISUAL |

## purpose

Sentry DSN 登録と Slack alert 疎通を実運用証跡として確定する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、現状コード・正本仕様・未割当タスクを照合して残った未実装または未運用 gate だけを扱う。

09b の incident response / observability 設計は存在するが、Sentry project 受信確認と Slack webhook/workflow の実疎通は未実施タスクとして残っている。production release 前に障害検知が人手確認だけに依存しない状態へ進める。

## scope in / out

### Scope In
- Sentry DSN の secret 配置 runbook
- staging test event 受信 smoke
- Slack webhook/workflow secret 配置 runbook
- Slack test alert smoke
- secret 値を残さない evidence 保存

### Scope Out
- 有償 plan 契約の強制
- 汎用通知基盤 UT-07 全実装
- PagerDuty 連携
- 未承認 commit/push/PR

## dependencies

### Depends On
- 09b incident response runbook
- deployment-secrets-management
- observability-monitoring
- 1Password 正本 secret 管理

### Blocks
- 09c production deploy readiness
- incident response automation confidence

## refs

- docs/30-workflows/unassigned-task/task-obs-sentry-dsn-registration-001.md
- docs/30-workflows/unassigned-task/task-obs-slack-notify-001.md
- .claude/skills/aiworkflow-requirements/references/observability-monitoring.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md

## AC

- Sentry staging test event の受信証跡が保存される
- Slack test alert の送信証跡が保存される
- secret 実値が repo/evidence に残らない
- 失敗時 fallback/保留判断が runbook 化される
- 09c の observability blocker が更新される

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

- #14 Cloudflare free-tier
- #16 secret values never documented
- #17 incident response readiness

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
