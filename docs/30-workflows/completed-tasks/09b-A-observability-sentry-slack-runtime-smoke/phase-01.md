# Phase 1: 要件定義 — 09b-A-observability-sentry-slack-runtime-smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 1 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 実装区分 | ドキュメントのみ（runbook formalization） |
| 実装区分根拠 | 主要 deliverable は runbook 文言と evidence path 設計。コード変更は wrangler.toml binding 名追加と既存 runbook 文言更新に限定され、実値は repo に持たない（CONST_004 例外条件適用） |

## 目的

Sentry DSN の Cloudflare Secrets 配置と Slack alert webhook/workflow の secret 配置について、
runbook 整備と staging smoke の **要件・成功条件・evidence path・自走禁止操作** を確定する。
本タスクは仕様書作成タスクであり、実 secret 登録、deploy、commit、push、PR は行わない。

## 実装区分の判定根拠

CONST_004（実装タスクは必ずコードを伴う）の例外条件「純粋にドキュメント・調査・合意形成で完結する場合は docs-only として正当化される」に該当する。

理由:

1. 主要 deliverable は (a) runbook 手順書、(b) 1Password item / Cloudflare secret 命名表、(c) evidence path 設計、(d) 通知 matrix。いずれも実値を含まない。
2. コードに該当しうる範囲は `apps/api/wrangler.toml` / `apps/web/wrangler.toml` への `var`/`secret` 名追加と `release-runbook.md` / `incident-response-runbook.md` の placeholder 文言置換に限定される。これらは Phase 5（実装ランブック）で実行手順を確定し、Phase 11（実測 evidence）で実 secret 登録 + smoke を実施する経路に分離する。
3. 実 DSN / webhook URL は **op:// 参照のみで管理**し、コードに値を埋め込むこと自体が禁止（INV #16）。値をコードに置けない以上、本フェーズは docs-only として完結する。
4. ラベル「implementation」より実態（runbook + evidence 設計）優先で判断する。

## 入力情報

- `docs/30-workflows/unassigned-task/task-obs-sentry-dsn-registration-001.md` — Sentry DSN 登録未実施タスクの正本要件
- `docs/30-workflows/unassigned-task/task-obs-slack-notify-001.md` — Slack 通知未実施タスクの正本要件
- `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md` — 09c 連動 runbook
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` — 観測性正本仕様（INV #17 起点）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` — secret 管理正本仕様（INV #16 起点 / `scripts/cf.sh` 必須）
- 既存 09b runbook（incident-response-runbook / release-runbook）の placeholder 状態
- CLAUDE.md（`scripts/cf.sh` 必須 / wrangler 直接禁止 / op:// 参照のみ）

## 出力（Phase 1 確定アウトプット）

`outputs/phase-01/main.md` に以下を確定する:

1. AC（Acceptance Criteria）5 件と詳細条件
2. 不変条件マッピング（INV #14 / #16 / #17）
3. 自走禁止操作リスト
4. approval gate 一覧
5. evidence path（後続 phase で参照）
6. 用語集

## 実行タスク

1. **不変条件抽出**: INV #14（free-tier）/ #16（secret 値非公開）/ #17（incident readiness）を本タスクの判定条件に落とす。完了条件: 各 INV から最低 1 つ AC または gate が導出される。
2. **AC をユーザー観察可能事象に分解**: Sentry test event 受信、Slack notification 受信、grep gate での不在確認、runbook 完備性、09b/09c blocker 更新。完了条件: 5 AC それぞれに observable な evidence path が紐づく。
3. **approval gate / 自走禁止操作の確定**: 実 secret 登録（`scripts/cf.sh secret put`）、production deploy、commit/push/PR を gate 化する。完了条件: 自走禁止操作リストが Phase 1 output に明記される。
4. **secret 値非公開条件の formalize**: op:// 参照のみ、grep gate（`rg 'SENTRY_DSN assignment containing an https DSN|hooks.slack.com|sentry.io/[0-9]'`）、PR body / log / evidence への値転記禁止を AC に落とす。完了条件: redaction 検証手段が evidence path に紐づく。
5. **09b 既存 runbook と本タスクの境界決定**: 09b release-runbook / incident-response-runbook の placeholder 文言更新は本タスクの scope、自動通知の paging・PagerDuty 接続は scope 外。完了条件: scope in/out が index.md と整合する。

## 制約事項

- Cloudflare 無料枠（INV #14）を前提に、有償 plan 契約を必要とする AC は採用しない
- secret hygiene（INV #16）: 実 DSN / webhook URL を **repo / docs / log / PR body / evidence にいかなる形でも残さない**
- 本仕様書フェーズ（Phase 1-3）では: アプリケーションコード変更、wrangler 直接実行、deploy、`git commit` / `git push` / PR 作成 を行わない
- secret 登録の実コマンドは `scripts/cf.sh` 経由のみ（`wrangler` 直接禁止 / CLAUDE.md 必須ルール）
- 実値投入は op `op read | bash scripts/cf.sh secret put ...` の stdin 経由のみ

## 検証コマンド（要件確定の確認）

```bash
# 参照資料が存在し、本タスクが正しい正本を引いていることを確認
test -f docs/30-workflows/unassigned-task/task-obs-sentry-dsn-registration-001.md
test -f docs/30-workflows/unassigned-task/task-obs-slack-notify-001.md
test -f .claude/skills/aiworkflow-requirements/references/observability-monitoring.md
test -f .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md

# Phase 1 output が AC / gate / evidence path / 用語集を含むこと
grep -q "AC" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-01/main.md
grep -q "自走禁止操作" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-01/main.md
grep -q "evidence path" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-01/main.md

# 仕様書に実 secret 値が混入していないこと（grep gate prefigure）
! rg -n "SENTRY_DSN assignment containing an https DSN|hooks\.slack\.com/services|sentry\.io/[0-9]+" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/
```


## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件

- [ ] AC 5 件が observable な evidence path と 1:1 で対応している
- [ ] 不変条件 #14 / #16 / #17 がそれぞれ AC または gate に紐づいている
- [ ] 自走禁止操作リスト（実 secret 登録 / deploy / commit / push / PR）が明記されている
- [ ] approval gate（user approval を要する節目）が一覧化されている
- [ ] evidence path が後続 Phase（特に Phase 11）から参照可能な形で命名されている
- [ ] 用語集に Sentry DSN / Slack webhook / Slack workflow / dedupe window / severity gate が定義されている
- [ ] 仕様書に実 secret 値が含まれていない（grep gate PASS）

## タスク 100% 実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] 実 DSN / webhook URL を本ファイルおよび outputs/phase-01/main.md に書いていない

## 次 Phase への引き渡し

Phase 2 へ以下を渡す:

- 確定 AC 5 件と evidence path
- 不変条件マッピング
- approval gate 一覧
- 自走禁止操作リスト
- 用語集（Sentry / Slack / dedupe window / severity gate）
