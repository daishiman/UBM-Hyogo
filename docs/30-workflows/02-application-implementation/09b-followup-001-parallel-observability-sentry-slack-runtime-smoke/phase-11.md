# Phase 11: 手動 smoke / 実測 evidence — 09b-followup-001-parallel-observability-sentry-slack-runtime-smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-followup-001-parallel-observability-sentry-slack-runtime-smoke |
| phase | 11 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

人手または外部環境でしか確認できない証跡を定義する。

## 実行タスク

1. 参照資料と親タスクの状態を確認する。完了条件: 未実装・未実測の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/task-obs-sentry-dsn-registration-001.md
- docs/30-workflows/unassigned-task/task-obs-slack-notify-001.md
- .claude/skills/aiworkflow-requirements/references/observability-monitoring.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/09b-followup-001-parallel-observability-sentry-slack-runtime-smoke/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 09b incident response runbook, deployment-secrets-management, observability-monitoring, 1Password 正本 secret 管理
- 下流: 09c production deploy readiness, incident response automation confidence

## 多角的チェック観点

- #14 Cloudflare free-tier
- #16 secret values never documented
- #17 incident response readiness
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- outputs/phase-11/main.md

## 完了条件

- Sentry staging test event の受信証跡が保存される
- Slack test alert の送信証跡が保存される
- secret 実値が repo/evidence に残らない
- 失敗時 fallback/保留判断が runbook 化される
- 09c の observability blocker が更新される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、AC、blocker、evidence path、approval gate を渡す。
