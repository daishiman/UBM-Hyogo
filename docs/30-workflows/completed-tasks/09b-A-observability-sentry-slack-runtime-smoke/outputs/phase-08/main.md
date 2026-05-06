# Output Phase 8: DRY 化結果（確定）

[実装区分: ドキュメントのみ] / CONST_004 例外根拠: docs-only / 実コード変更・実 deploy なし

## status

DRY_CONFIRMED / NOT_EXECUTED

## 1. 重複検出表

| D-ID | 検査対象 | 既存正本 | 本仕様書での扱い | 集約後の参照先 | 判定 |
| --- | --- | --- | --- | --- | --- |
| D-01 | `SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` / `SLACK_WORKFLOW_URL` の命名 | `deployment-secrets-management.md`（命名規約: 大文字 SNAKE_CASE / `*_URL` suffix 任意） | 本タスク固有の追補。命名規約に整合しており、`SLACK_WEBHOOK_INCIDENT` は既存 `SLACK_ALERT_WEBHOOK_URL` を補完する正本扱い | `deployment-secrets-management.md` を命名正本として参照、本タスク固有 secret 4 種は Phase 2 表を SSOT とする | PASS（軽微な追補のみ） |
| D-02 | Sentry test event 送信手順（`Sentry.captureMessage` / curl envelope POST） | 09b 系・aiworkflow-requirements ともに **既存正本なし**（本タスクが初出） | 本仕様書を正本として明示。Phase 12 で `observability-monitoring.md` に補足 reference を追加することを forward task 化 | 本仕様書 Phase 2 「4. Sentry test event 仕様」を正本 | NEW-SSOT |
| D-03 | Slack 通知 matrix（5 trigger / severity / dedupe window） | `observability-monitoring.md` に matrix の母集団が存在 | 本仕様書から正本へ pointer 化。本仕様書は staging smoke 発火対象（最小 1 trigger = 手動 test webhook）と severity gate 詳細のみ残す | `observability-monitoring.md` の matrix を正本、本タスクは抽出 5 行を Phase 2 に複製（一致確認済） | PASS（重複は許容範囲・差分なし） |
| D-04 | redaction grep regex `SENTRY_DSN assignment containing an https DSN\|hooks\.slack\.com/services\|sentry\.io/[0-9]+` | shared util に **既存定義なし**（aiworkflow-requirements 側に regex catalog 不在） | 本仕様書 Phase 1 AC-03 を初出正本として明示。Phase 12 で aiworkflow-requirements への移植を **forward task** として登録（本タスク scope 外） | 本仕様書 AC-03 を暫定正本、将来 shared util 化を勧告 | NEW-SSOT + FORWARD |
| D-05 | secret rollback 手順（`cf.sh secret delete` → 1Password 旧 revision → re-put → smoke 再実行） | `deployment-secrets-management.md` および `scripts/cf.sh` の使用例で既存 | 本仕様書は pointer + Sentry/Slack 固有 smoke 再実行手順のみ追補 | `deployment-secrets-management.md` を正本、本仕様書 Phase 2「6.1」は pointer + 固有 smoke 手順 | PASS |
| D-06 | incident-response runbook の owner / escalation matrix | `incident-response-runbook.md`（既存・親 09b 系） | 本タスクは「secret 登録 + smoke 1 件」で完結し、incident 発生時の escalation は親 runbook の責務として境界明確化 | 本仕様書は smoke 範囲のみ責任、escalation は親 runbook を参照 | PASS |

## 2. 用語統一表

| 正本訳 | 別名 / 旧称 | 取扱い |
| --- | --- | --- |
| Sentry test event | Sentry sample event / Sentry probe event | 「test event」を正本訳とし、別名は本仕様書では使用しない |
| dedupe window | suppression window / dedup interval | 「dedupe window」を正本訳。`observability-monitoring.md` 表記と一致 |
| severity gate | severity threshold / severity filter | 「severity gate」を正本訳。P1 / P2 はラベル定義として `observability-monitoring.md` に従う |
| secret 実値 | raw secret / plaintext value | 「secret 実値」を正本訳。grep gate / redact 文脈で統一 |
| op:// 参照 | 1Password reference / op reference | 「op:// 参照」を正本訳 |
| Slack webhook | Incoming Webhook / Slack incoming URL | 「Slack webhook」を正本訳。`SLACK_WEBHOOK_INCIDENT` 命名と整合 |
| Slack workflow | Slack Workflow Builder trigger | 「Slack workflow」を正本訳。`SLACK_WORKFLOW_URL` 命名と整合 |
| `SLACK_ALERT_WEBHOOK_URL` | （旧名） | **deprecation 対象**。Phase 5 冒頭で `SLACK_WEBHOOK_INCIDENT` への alias / 移行 / 旧名廃止のいずれかを確定（R-04 forward 課題） |

## 3. 単一正本（SSOT）構造図

### 3.1 secret 命名 SSOT

```
deployment-secrets-management.md（命名規約 SSOT）
  └── 本仕様書 Phase 2 表（本タスク固有 4 種を追補）
        ├── SENTRY_DSN_API（apps/api / staging|production）
        ├── SENTRY_DSN_WEB（apps/web / staging|production）
        ├── SLACK_WEBHOOK_INCIDENT（apps/api / staging|production）
        └── SLACK_WORKFLOW_URL（apps/api / staging|production / optional）
```

### 3.2 通知 matrix SSOT

```
observability-monitoring.md（通知 matrix 母集団 SSOT）
  └── 本仕様書 Phase 2 表（本タスクで staging smoke 対象の 5 trigger を抽出）
        ├── sync_jobs.failed 連続 3 回 → P2 / 30min dedupe / #ubm-incident
        ├── sync_jobs.running 30min 超 → P2 / 60min dedupe / #ubm-incident
        ├── Workers 5xx rate > 5% → P1 / 15min dedupe / #ubm-incident
        ├── Sentry P1 tag 受信 → P1 / 15min dedupe / #ubm-incident
        └── Magic Link 送信失敗 5 回連続 → P2 / 60min dedupe / #ubm-incident
```

### 3.3 evidence path SSOT

本仕様書の `outputs/phase-11/*.md` は本タスク固有 namespace で、他 task との衝突なし。

```
docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/
  ├── phase-11/sentry-test-event-id.md（AC-01）
  ├── phase-11/slack-test-notification-evidence.md（AC-02）
  ├── phase-11/redaction-grep-result.md（AC-03）
  ├── phase-11/sentry-secret-list-redacted.md（AC-03）
  ├── phase-11/slack-secret-list-redacted.md（AC-03）
  └── phase-12/runbook-diff.md（AC-05）
```

## 4. R-04 forward 課題の最終取扱い

Phase 3 で検出された `SLACK_ALERT_WEBHOOK_URL` ⇆ `SLACK_WEBHOOK_INCIDENT` 命名整合は、Phase 8 段階では下記方針で確定:

- **正本 secret 名**: `SLACK_WEBHOOK_INCIDENT`（本仕様書 Phase 2 で正式採用）
- **旧名 `SLACK_ALERT_WEBHOOK_URL`**: deprecation 表記を docs に入れて段階的廃止
- **Phase 5 冒頭の必須先頭タスク**: `apps/api` / docs を grep し、`SLACK_ALERT_WEBHOOK_URL` 参照箇所のリストアップと alias / 移行 / 廃止のいずれかを確定すること
- **本タスク内での実コード変更は行わない**（docs-only）。コード置換 PR は別 task として切る判断も可

## 5. 結論

| 項目 | 結果 |
| --- | --- |
| D-01〜D-06 の判定 | すべて PASS / NEW-SSOT / FORWARD のいずれかで blocker なし |
| 用語統一 | 8 用語の正本訳が確定し、別名 deprecation も明記 |
| SSOT 構造 | secret 命名・通知 matrix・evidence path の 3 系統で SSOT が明確 |
| 修正アクション | Phase 5 冒頭で R-04 forward 課題を確定 / Phase 12 で `observability-monitoring.md` への Sentry test event reference 追加（forward task） |

DRY 化観点で本仕様書は完了条件を満たし、Phase 9 品質保証へ進む。
