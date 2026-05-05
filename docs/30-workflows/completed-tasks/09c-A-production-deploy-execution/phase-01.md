# Phase 1: 要件定義 — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

> production deploy / D1 migration / runtime smoke / 24h verification は実 mutation を伴う実装行為であり、後続実装サイクルでは `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` / `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` を実行して evidence を収集する（`apps/api` / `apps/web` ともに `package.json` に `deploy:production` script は存在せず、Phase 4 で正規経路を `bash scripts/cf.sh deploy` 直接呼び出しに確定済み）。
> 本タスクではアプリケーションコードの新規変更は不要だが、実行コマンド・evidence path・user approval gate を仕様書として固定する必要がある。完了済み 09c serial タスクは「runbook の docs-only 整備」が範囲であり、本 09c-A は「runbook を実 production に当てる execution gate のみ」を扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-A-production-deploy-execution |
| phase | 1 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 実装区分 | 実装仕様書（runbook execution + evidence collection） |
| docs_only | false（後続サイクルで実 production を mutate する） |

## 目的

本タスク（09c-A）は production deploy execution の AC・依存・evidence path を確定し、後続 Phase（4-13）が実行できる状態に持ち込む。具体的には以下を Phase 1 で固定する。

1. user approval なしには実行しない自走禁止操作の列挙
2. production deploy 実行順序（main merge → D1 backup → D1 migration list/apply → API deploy → Web deploy → release tag → smoke → 24h verification）
3. AC と evidence path の 1:1 mapping（後続 Phase 7 の AC マトリクスの起点）
4. Phase 13 user approval gate と上流依存タスク（09a-A staging smoke green / 09b-A observability / 09b-B post-deploy smoke）の satisfied 確認手段

## 実行タスク

1. unassigned-task 起票元と完了済み 09c serial の outputs/phase-01〜03/main.md を読み、09c-A のスコープ境界（execution gate のみ）を確定する。完了条件: 09c docs-only spec 部分との重複を取り除き、execution に固有の項目だけが残る。
2. 上流依存（09a-A staging smoke green / 09b-A observability / 09b-B post-deploy smoke / 09b release/incident runbook）の green 判定基準を Phase 1 で文書化する。完了条件: 各依存タスクの完了 evidence path が citable な形で記録される。
3. AC（5 項目）と evidence path を 1:1 で対応付ける。完了条件: AC ごとに `outputs/phase-11/` 配下の想定ファイル名（命名規約付き）が決まる。
4. user approval gate（Phase 10 / Phase 11 / Phase 13）と各 gate で要求される approval log の保存形式を確定する。完了条件: 自走禁止操作リストが完成する。
5. blocker（09a-A 未 green / 09b-A observability 未疎通 / 09b-B post-deploy smoke 未 green / Phase 13 user approval 未取得）を列挙し、blocker 解消手順または upstream 待ちの判断基準を明記する。
6. outputs/phase-01/main.md に上記すべてを集約する。

## 参照資料

- `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/index.md`
- `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/artifacts.json`
- `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-01/main.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-02/main.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-02/production-deploy-flow.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-03/main.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`

## 実行手順

- 対象 directory: `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/`
- Phase 1 では仕様書（phase-01.md）と outputs/phase-01/main.md のみを書く。アプリケーションコード、deploy、commit、push、PR 作成は本仕様書作成タスクの範囲外。
- 実装・実測時は Phase 5（実装ランブック）と Phase 11（手動 smoke / 実測 evidence）の runbook と evidence path に従う。
- Cloudflare CLI は `bash scripts/cf.sh` 経由のみ。`wrangler` 直実行は禁止。
- D1 database name は infrastructure-runbook の正本に従い、production は `ubm-hyogo-db-prod`、staging は `ubm-hyogo-db-staging`。

## 統合テスト連携

| 区分 | 対象 | 期待状態 |
| --- | --- | --- |
| 上流 | 09a-A staging smoke green | staging public/member/admin smoke が green、`outputs/phase-11/` に runtime evidence 揃い |
| 上流 | 09b-A observability sentry/slack/runtime smoke | observability runtime が疎通済み、Sentry/Slack 通知が production 用 binding で疎通 |
| 上流 | 09b-B cd post-deploy smoke healthcheck | post-deploy smoke の silent failure 検知機構が green |
| 上流 | 09b release/incident runbook | release runbook と incident response runbook が docs-only として確定 |
| Gate | Phase 10 user approval | 設計レビュー通過後の最終 GO/NO-GO 判断 |
| Gate | Phase 11 user approval | production mutation を伴う実行操作（D1 migration apply / deploy / release tag）の都度承認 |
| Gate | Phase 13 user approval | PR 作成と main 昇格の最終承認 |
| 下流 | post-release observation follow-ups | 24h 経過後の observability follow-up |

## 多角的チェック観点

- 不変条件 #5（public/member/admin boundary）が production smoke で検証される
- 不変条件 #6（apps/web から D1 直接アクセス禁止）が web bundle inspection で検証される
- 不変条件 #14（Cloudflare free-tier）が 24h verification の metrics threshold で検証される
- 未実装 / 未実測を PASS と扱わない（placeholder と実測 evidence の分離）
- secret 値は evidence に転記しない（参照のみ）
- 09c docs-only 仕様書の再設計と本タスクの execution gate を混在させない
- main merge commit と deploy target の commit hash を evidence で照合する

## サブタスク管理

- [ ] 必読資料（unassigned-task, completed-tasks/09c-serial, infrastructure-runbook, deployment reference）を確認する
- [ ] 上流依存タスクの完了 evidence path を citable な形で記録する
- [ ] AC（5 項目）と `outputs/phase-11/` evidence path を 1:1 で対応付ける
- [ ] user approval gate（Phase 10 / 11 / 13）と各 gate の approval log 保存形式を確定する
- [ ] 自走禁止操作リスト（user approval なしに実行しないコマンド）を列挙する
- [ ] blocker 一覧と解消手段を確定する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- `outputs/phase-01/main.md`（要件定義の確定結果・AC mapping・user approval gate・blocker 一覧・evidence path 命名規約）

## 完了条件

- 5 つの AC が evidence path と 1:1 で対応付いている
- 自走禁止操作リストが完成し、user approval gate と接続している
- 上流依存タスクの green 判定基準が citable な形で記録されている
- production deploy 実行順序が確定している
- evidence ファイル名規約（`outputs/phase-11/` 配下）が決まっている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 09c-A の execution gate に固有の内容のみで構成され、09c serial docs-only spec の再設計が混入していない
- [ ] 仕様書作成タスクであり、実装・deploy・commit・push・PR を実行していない

## 次 Phase への引き渡し

Phase 2（設計）へ次を引き渡す:

- AC リスト（5 項目）と evidence path mapping
- production deploy 実行順序（13 ステップ相当）
- 自走禁止操作リスト
- 上流依存タスクの green 判定基準
- user approval gate（Phase 10 / 11 / 13）
- blocker 一覧
