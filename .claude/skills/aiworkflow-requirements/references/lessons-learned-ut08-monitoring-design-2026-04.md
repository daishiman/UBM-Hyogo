# lessons-learned: UT-08 モニタリング/アラート設計 (2026-04)

UT-08 モニタリング/アラート設計（`docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/`）の Phase 1-12 で得た知見と苦戦箇所を集約する。Wave 2 以降の実装タスク（`docs/30-workflows/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md`）の入力としても利用する。

## 概要

| 項目 | 値 |
| --- | --- |
| タスク種別 | design / non_visual / spec_created |
| 反映日 | 2026-04-27 |
| 上流タスク | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails |
| 下流タスク | UT-08-IMPL（Wave 2 実装） |
| 主要技術 | Cloudflare Workers Analytics Engine (WAE) / UptimeRobot / Slack Webhook / Email fallback / 1Password Environments |

## 苦戦箇所と対処（Wave 2 への引き継ぎ前提）

### 1. 05a runbook との責務境界の事前合意が必須

**症状**: 05a（手動観測 + cost-guardrail-runbook）と UT-08（自動監視）の責務境界が曖昧なまま設計を進めると、`observability-matrix.md` / `cost-guardrail-runbook.md` を二重定義しかねない。

**対処**:
- 05a を「手動観測の正本」、UT-08 を「自動監視の追記レイヤ」と明示する
- 05a の成果物は上書きせず、差分追記方針を `outputs/phase-02/runbook-diff-plan.md` に集約する
- Phase 3 設計レビュー前に 05a 担当との責務境界を明文化する

**Wave 2 影響**: 05a outputs が個別ファイルとして未生成の場合、AC-10 を `PASS_WITH_OPEN_DEPENDENCY` 扱いとし、UT-08-IMPL の実装前ゲートに引き継ぐ。

### 2. WAE 無料枠制約の Wave 2 着手直前再確認をゲート化

**症状**: WAE の保存期間（公称 31 日）と data points 上限は Cloudflare 側で改定される可能性がある。Phase 1 で固定した値が Wave 2 着手時点で陳腐化する。

**対処**:
- Phase 10 MINOR-02 として「Wave 2 着手直前に WAE 無料枠を公式情報で再確認」を必須化する
- UT-08-IMPL の実装前ゲートに「WAE 無料枠の最終確認」を明記する
- 不確定な値は `outputs/phase-01/requirements.md` に「Wave N 実装直前に再確認」として注記する

### 3. Slack/Email fallback の dedupe ロジック

**症状**: 同一 metric + severity が短時間に繰り返し発火すると alert fatigue を招く。Slack 失敗時の Email fallback も二重通知のリスクがある。

**対処**:
- 同一 `(metric, severity)` キーで 30 分の dedupe window を維持する
- 5 件以上の summary 通知（aggregation）と単発通知の二重フィルタを実装する
- Slack Webhook 失敗時のみ Email fallback を試行し、Slack 成功時には Email を発火しない
- dedupe key とフィルタ条件を `outputs/phase-02/notification-design.md` に SSOT 化する

### 4. CRITICAL 閾値の段階導入（WARNING-only 初期）

**症状**: 設計時点で CRITICAL 閾値を確定しようとすると、根拠データがなく恣意的な値になる。誤報率が高まり on-call 信頼性を損なう。

**対処**:
- 初期運用は WARNING-only とし、CRITICAL は段階導入する
- 30 日連続で誤報率 1 件/月以下が確認できた WARNING に対してのみ CRITICAL を有効化する
- 段階導入の運用化は別未タスク `UT-31-monitoring-monthly-operations.md` 等で月次運用に組み込む
- 閾値変更履歴は `outputs/phase-02/alert-threshold-matrix.md` に追記する

### 5. NON_VISUAL タスクの Phase 11 テンプレ判断

**症状**: 設計タスク（spec_created / NON_VISUAL）では UI 変更がないため screenshot は不要だが、Phase 11 テンプレが視覚タスク前提だと毎回判断が発生する。

**対処**:
- Phase 11 NON_VISUAL では `outputs/phase-11/{main.md, manual-smoke-log.md, link-checklist.md}` の 3 ファイルのみで足りる
- screenshot は作成しない（task-specification-creator の SKILL.md UBM-002/003 ルールに準ずる）
- automated link / structure check が PASS していれば Phase 11 完了判定できる

## 設計上の確定事項（SSOT）

| 項目 | 値 | 出典 |
| --- | --- | --- |
| WAE binding 名 | `MONITORING_AE` | outputs/phase-02/wae-instrumentation-plan.md |
| WAE dataset 名 | `ubm_hyogo_monitoring` | 同上 |
| 主要イベント名 | `api.request`, `api.error`, `d1.query.fail`, `cron.sync.start`, `cron.sync.end` | 同上 |
| 任意イベント | `auth.fail`（UT-13 認証実装で採否確定） | 同上 |
| アラート Secret | `SLACK_ALERT_WEBHOOK_URL`, `ALERT_EMAIL_FALLBACK_TO`, `UPTIMEROBOT_API_KEY` | outputs/phase-02/secret-additions.md |
| Secret 管理場所 | 1Password Environments → Cloudflare Secrets / GitHub Secrets | 同上 |
| 外部監視ツール | UptimeRobot 無料プラン（5 分間隔） | outputs/phase-02/external-monitor-evaluation.md |
| dedupe window | 30 分（同一 metric + severity） | outputs/phase-02/notification-design.md |

## Wave 2 実装時の注意点（UT-08-IMPL 着手前チェック）

1. 05a outputs 個別ファイル生成済み、または追記先合意済みであること
2. WAE 無料枠（保存期間・data points 上限）を実装直前に公式再確認すること
3. UT-09（Sheets→D1 同期）の Cron 間隔・エラー分類が確定済みであること
4. UT-07（通知基盤）経由か Slack direct MVP かを実装時点で再確認すること
5. UT-13（認証）と `auth.fail` イベント採否を確認すること
6. UT-17 / UT-18 との責務境界（native usage alerts / CPU time）を侵さないこと

## 関連ファイル

- ワークフロー: `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/`
- 派生実装タスク: `docs/30-workflows/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md`
- artifact inventory: `workflow-ut08-monitoring-alert-design-artifact-inventory.md`
- 連携: `deployment-cloudflare.md` / `deployment-secrets-management.md` / `deployment-details.md`
- 派生未タスク: `docs/30-workflows/unassigned-task/UT-30-05a-outputs-individual-files-generation.md`, `UT-31-monitoring-monthly-operations.md`
