# Phase 5: 実装ランブック — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ]

CONST_004 例外根拠: 本タスクは docs-only / spec_created / remaining-only。本 phase は **後続実行者がそのまま実行できる runbook spec** を完成させる作業であり、本仕様書作成では実 secret 登録・deploy・commit・push・PR を実行しない。実行は Phase 11（実測）で user approval 取得後に行う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 5 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only / spec_created / remaining-only |
| visualEvidence | NON_VISUAL |

## 目的

後続実行者（または Phase 11 の実測 wave）がそのまま実行できる runbook を完成させる。Test ID（Phase 4）を Step に 1:1 展開し、secret 命名対応・before/after invariant・evidence 保存先・rollback 戻り先を 1 文書に集約する。

## 入力

- Phase 1 確定 AC・evidence path・自走禁止操作リスト・approval gate G-01〜G-05
- Phase 2 設計（1Password item / secret 命名表 / 通知 matrix / rollback 手順 / fallback tree）
- Phase 3 forward 課題（R-04: `SLACK_ALERT_WEBHOOK_URL` ⇆ `SLACK_WEBHOOK_INCIDENT` 整合）
- Phase 4 Test ID 表（T-01〜T-07）と実行順序図

## 実行タスク

| Step | 内容 | 担当 | approval gate |
| --- | --- | --- | --- |
| Step 0 | `SLACK_ALERT_WEBHOOK_URL` ⇆ `SLACK_WEBHOOK_INCIDENT` の整合を確定（alias 採用 / 一本化のいずれか）。決定なしには Step 2 に進めない | 後続実行者 | — |
| Step 1 | 1Password item 確認（既存 vault `UBM-Hyogo` に Sentry / Slack item が登録済みか / 未登録なら GUI で登録 — GUI 操作は人間 only、Claude Code は実行不可） | 人間 | G-01 後 |
| Step 2 | staging secret 登録（`SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` を `op read \| bash scripts/cf.sh secret put` で配置） | 後続実行者 | G-02 |
| Step 3 | staging Sentry test event 発火（T-02 を実行） | 後続実行者 | G-02 通過後 |
| Step 4 | staging Slack test notification 発火（T-04 を curl で実行） | 後続実行者 | G-02 通過後 |
| Step 5 | redaction grep 確認（T-05 の 3 系統） | 後続実行者 | T-02 / T-04 直後 mandatory |
| Step 6 | production secret 登録（staging PASS evidence 確認後・user approval 経由でのみ実行） | 後続実行者 + 人間 | G-03 |
| Step 7 | 09b 既存 runbook の placeholder 更新（`docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` 配下の `release-runbook.md` / `incident-response-runbook.md` の placeholder 値を「実 secret 登録済み（実値は 1Password 正本）」に更新） | 後続実行者 | G-04 |

## forward 課題（Phase 3 R-04）の確定方針

- **Step 0 冒頭で必ず実施**。決定なしに Step 2 へ進むことは禁止
- 既定方針（Phase 3 が引き渡し）: `SLACK_WEBHOOK_INCIDENT` を**正本 secret 名として新規追加**、`SLACK_ALERT_WEBHOOK_URL` は **deprecation 表記を docs に入れて段階的廃止**
- 旧名参照コードがある場合は `apps/api` 配下を `rg -n 'SLACK_ALERT_WEBHOOK_URL' apps/` で確認し、置換 PR を本タスクとは別に切る判断も可
- 決定結果は `outputs/phase-05/main.md` 「Step 0 決定ログ」節に追記する

## 検証コマンド一覧（Step ごと）

| Step | 検証コマンド |
| --- | --- |
| Step 0 | `rg -n 'SLACK_ALERT_WEBHOOK_URL' apps/ docs/` で参照箇所列挙 |
| Step 1 | `op item list --vault UBM-Hyogo` で item 存在確認（実値は表示しない） |
| Step 2 | `bash scripts/cf.sh secret list --config <wrangler.toml> --env staging` で secret 名一覧（値非表示形式）確認 |
| Step 3 | Sentry project Issues に新規 event id が現れることを dashboard で目視 + event id を redact evidence に記録 |
| Step 4 | Slack `#ubm-incident` (staging) で message delivered timestamp を確認 + permalink を redact evidence に記録 |
| Step 5 | T-05 の 3 系統 grep。すべて 0 件であることを記録 |
| Step 6 | Step 2〜5 を production 設定で再実行（G-03 通過後のみ） |
| Step 7 | `git diff docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` で placeholder 文言の更新差分を確認 |


## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 成果物

- `outputs/phase-05/main.md`

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件

- Step 0〜7 すべての手順が `outputs/phase-05/main.md` に記述され、各 Step に before/after invariant・evidence 保存先・rollback 戻り先が紐づく
- secret 命名対応表が Phase 2 から re-export されている
- Step 6 / Step 7 の前に approval gate（G-03 / G-04）が明示配置されている
- 失敗時の戻り先が Phase 6 異常系に明示リンク

## タスク100%実行確認

- [ ] Step 0〜7 すべてに検証コマンドと evidence 保存先が紐づいている
- [ ] R-04 forward 課題が Step 0 で吸収される設計になっている
- [ ] approval gate G-02 / G-03 / G-04 が runbook 上で gating している
- [ ] 実装・deploy・commit・push・PR を本タスク内で実行していない

## 次 Phase への引き渡し

Phase 6 へ、Step 別の失敗パターン（A-01〜A-06）と escalation 経路を渡す。
