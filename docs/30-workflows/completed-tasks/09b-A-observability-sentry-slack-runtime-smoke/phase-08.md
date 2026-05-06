# Phase 8: DRY 化 — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ] / CONST_004 例外根拠: 本タスクは runbook formalization の docs-only タスクであり、コード変更・実 deploy・実 secret 投入を伴わない。CONST_004（実装伴奏）の対象外として、Phase 5 / Phase 11 への引き渡し情報の整備に閉じる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 8 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only / NON_VISUAL / spec_created / remaining-only |
| visualEvidence | NON_VISUAL |

## 目的

docs-only タスクの DRY 化として、以下 4 系統の重複を検出・解消する:

1. 重複 runbook（同じ手順が 09b 系 / aiworkflow-requirements 双方に重複していないか）
2. 重複 secret 命名（`SLACK_WEBHOOK_*` 等の正本が 1 箇所に集約されているか）
3. 重複 evidence path（Phase 11 evidence path が他 task 仕様と衝突していないか）
4. 重複用語（Sentry test event / dedupe window / severity gate 等の正本訳）

正本（SSOT, Single Source of Truth）構造を維持し、本仕様書は **正本への pointer** または **本タスク固有の追補** に閉じることを完了条件とする。

## 入力

- `outputs/phase-01/main.md`（AC / evidence path / 用語集）
- `outputs/phase-02/main.md`（1Password item / Cloudflare secret 命名 / 通知 matrix / fallback tree）
- `outputs/phase-03/main.md`（R-04 forward 課題: `SLACK_ALERT_WEBHOOK_URL` ⇆ `SLACK_WEBHOOK_INCIDENT` 整合）
- Phase 5 runbook（並列作成中・Phase 8 では参照のみ。secret 命名と evidence path は Phase 2 で確定済みのため検査可能）
- `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/`（既存 09b 親タスク runbook 群）
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`（observability 正本）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（secret 命名正本）

## 検査観点

- **D-01 secret 命名整合**: 本仕様書で導入する `SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` / `SLACK_WORKFLOW_URL` が `deployment-secrets-management.md` の命名規約（大文字 SNAKE_CASE / `*_URL` suffix の取扱い）と整合しているか確認。整合していなければ正本側を更新するか、本タスク固有として例外明記する。
- **D-02 Sentry test event 手順重複**: Sentry test event 送信手順が他 workflow（既存 09b / 09c / aiworkflow-requirements）に既存していないか検査。既存があれば本仕様書は pointer 化、なければ本仕様書を正本として明記。
- **D-03 Slack 通知 matrix 整合**: Phase 2 通知 matrix（5 trigger）が `observability-monitoring.md` の matrix と項目一致しているか確認。重複の場合は本仕様書から正本へ pointer 化し、本仕様書は staging smoke 範囲（最小 1 trigger）の発火詳細のみ残す。
- **D-04 redaction grep regex 重複**: AC-03 で使う `rg -n 'SENTRY_DSN assignment containing an https DSN|hooks\.slack\.com/services|sentry\.io/[0-9]+'` 系 regex が aiworkflow-requirements / 他 task spec で既に shared util として定義されていないか確認。重複していれば shared util への移動を勧告。
- **D-05 rollback 手順整合**: Phase 2「6.1 secret rollback」が `deployment-cloudflare-*` references の rollback 手順と整合しているか確認。
- **D-06 incident-response runbook 境界**: 本タスク仕様書の owner / escalation matrix が `incident-response-runbook.md` と境界明確か確認。本タスクは「secret 登録 + smoke 1 件」までで、incident 発生時の escalation は incident-response-runbook が責任を持つ境界を保つ。

## 重複検出時の集約方針

| 状況 | 方針 |
| --- | --- |
| 正本が aiworkflow-requirements 側に存在 | 本仕様書は **pointer 化**（参照リンクのみ）し、本タスク固有差分（5 trigger 抽出 / staging smoke 範囲）だけ追補 |
| 正本が他 task spec / 09b 親 runbook 側に存在 | 同上。pointer + 差分追補 |
| 正本が本タスクのみ | 本仕様書を正本として明示し、aiworkflow-requirements 側に補足 reference を Phase 12 で追加 |
| 命名・regex の不整合 | aiworkflow-requirements 正本を Phase 12 で更新する（本タスクの scope 内）。実装 code 修正は scope 外（forward task） |

## サブタスク管理

- [ ] D-01〜D-06 の検査を実施（grep / find / 目視）
- [ ] 重複検出表（D-ID / 既存正本 / 集約後参照先）を `outputs/phase-08/main.md` に記録
- [ ] 用語統一表（正本訳 / 別名 deprecation）を記録
- [ ] SSOT 構造図（secret 命名 / 通知 matrix）を記録
- [ ] R-04 forward 課題の最終取扱いを記録（Phase 5 冒頭で確定する条件を明示）

## 成果物

- `outputs/phase-08/main.md`（DRY 化結果 / 重複検出表 / 用語統一表 / SSOT 構造図）


## 実行タスク

1. この Phase の入力、出力、approval gate、redaction 境界を確認する。
2. 実 secret 値、DSN URL、Slack webhook URL、token 値が仕様書に含まれていないことを確認する。
3. 後続 Phase または runtime wave へ引き渡す evidence path を明示する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件

- 本タスクで導入する secret / runbook / evidence path / 用語が、既存正本との重複・不整合を起こさない
- 重複が検出された場合、集約方針（pointer 化 / 正本昇格 / 例外明記）が記録されている
- D-01〜D-06 すべてに判定が記録されている
- 用語統一表に Sentry / Slack / dedupe / severity 関連用語の正本訳が網羅されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、DRY 化結果（重複検出表 / SSOT 構造図 / 用語統一表）と R-04 forward 課題の最終取扱いを引き渡す。
