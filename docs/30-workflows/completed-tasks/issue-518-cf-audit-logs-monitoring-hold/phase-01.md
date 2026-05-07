# Phase 1: 要件定義

`[実装区分: 実装仕様書]`

判定根拠: 既存 main マージ済みの `.github/workflows/cf-audit-log-monitor.yml`（hourly cron）と watchdog YAML が稼働中であり、HOLD 決定の実効化には YAML 編集 / 削除が必須。docs 追記単独では schedule run を停止できない。

---

## 目的

Issue #518 の HOLD 方針をコード変更を含む実装要件に分解し、taskType / visualEvidence を確定する。既存実装サーベイで影響範囲を確定し、再開条件を要件化する。

## 入力

- Issue #518 本文（背景 / 方針 / 理由 / 再開条件）
- 親 #408 spec: `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`
- 既存 workflow 2 ファイル / `scripts/cf-audit-log/*` ソースツリー

## 出力（artifacts）

- `outputs/phase-01/requirements.md`（Phase 11 evidence 用 / Phase 12 で更新）
- artifacts.json `phases[0].status = "completed"` への更新（Phase 完了時）

## 要件分解

| ID | 要件 | 出典 |
| --- | --- | --- |
| R-1 | hourly schedule で発火する自動監視 workflow を停止する | Issue #518「自動監視 workflow の稼働は一旦保留」 |
| R-2 | 検知結果を GitHub Issue 自動起票する経路を既定で無効化する | 同「GitHub Issue 自動起票による alerting は現時点では採用しない」 |
| R-3 | 必要時に手動で audit logs 確認できる経路を残す | 同「必要になった場合のみ週次または手動で Cloudflare Audit Logs を確認する」 |
| R-4 | 再開条件 4 件を runbook で明示する | 同「再開条件」節 |
| R-5 | scripts / D1 schema は破棄せず保持する | 親 #408 で local 実装済み資産を再利用可能にするため |

## 既存実装サーベイ

| パス | 行数 / 内容 | 本タスクでの扱い |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | 84 行 / `on.schedule: '0 * * * *'` + `workflow_dispatch` / fetch + analyze + Issue 起票 + heartbeat 更新 | 編集（R-1 / R-2 / R-3） |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | 41 行 / `on.schedule: '15 * * * *'` / heartbeat stale 検知で Issue 起票 | 削除（R-1 派生：監視対象が消えるため不要） |
| `scripts/cf-audit-log/{fetch,analyze,baseline,baseline-cli,issue-reporter,d1-client,cloudflare-client,severity-classifier,cli-args,types}.ts` | 集計 / 分析 / Issue 起票ロジック | 保持（R-3 / R-5） |
| `scripts/cf-audit-log/__tests__/*.test.ts` | 5 ファイル | 保持・無編集（R-5） |
| `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` | 親 spec | Canonical Status に HOLD 行追記 |
| GitHub Variables `CF_AUDIT_LAST_SUCCESS_AT` | heartbeat 用 | HOLD 中は更新停止。runbook で扱い記述 |

## taskType / visualEvidence 確定

- `taskType: implementation` — workflow YAML 編集 / 削除を伴うため
- `visualEvidence: NON_VISUAL` — UI 影響なし（CI/CD と docs のみ）

## DoD

- 上記 R-1..R-5 が要件として確定
- 既存実装サーベイ表が完成
- artifacts.json metadata 反映済（taskType / visualEvidence / workflow_state）
- Phase 2 へ進む承認（設計フェーズ直列ゲート）
