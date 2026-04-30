# audit_log 外部 SIEM 連携運用設計 - タスク指示書

```yaml
issue_number: 315
```

## メタ情報

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | 07c-followup-004-audit-log-external-siem                   |
| タスク名     | audit_log 外部 SIEM 連携運用設計                           |
| 分類         | 運用設計                                                   |
| 対象機能     | audit_log の長期保管・改ざん検知・外部監査                 |
| 優先度       | 低                                                         |
| 見積もり規模 | 中規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | 07c Phase 12 unassigned-task-detection                     |
| 発見日       | 2026-04-30                                                 |

---

## 概要

07c で D1 に append-only 実装した `audit_log` を、外部 SIEM / 長期ストレージ基盤に連携する運用設計を行う。Cloudflare R2 export + Workers Cron + 外部 SIEM（Datadog / Splunk 等）の組合せ選定、retention policy、PII masking、failure retry、コスト見積を一気通貫で確定し、長期保管・改ざん検知・外部監査提出に耐える運用基盤を整える。

## 背景

07c は attendance add/remove の監査ログを D1 に append-only で記録するところまでをスコープとし、長期保管・改ざん検知・外部監査提出は MVP 外の運用課題として分離した。

- D1 は容量・保持期間の観点で長期保管に最適化されておらず、無料枠運用では古いレコードのアーカイブ運用が前提となる
- 改ざん検知（hash chain / WORM ストレージ）は D1 単体では完結せず、外部の immutable storage が必要
- 外部監査提出時に `before_json` / `after_json` の PII を masking する仕組みが未整備
- 失敗時の retry / alert の運用責任範囲が未定義

## 完了条件

- 連携先 SIEM / 長期ストレージの候補が比較表で整理され、第一候補が決定している
- export interval / retention policy / PII masking ルールが運用 runbook に明文化されている
- failure retry / alert の責任分担と発火条件が決定している
- Cloudflare Workers / Cron / R2 を含む月次コスト見積が提示され、無料枠との差分が把握されている
- 改ざん検知方式（hash chain / R2 Object Lock 等）が決定している

## 詳細仕様

### 想定スコープ

#### 連携先選定

- 候補: Datadog Logs / Splunk Cloud / Elastic Cloud / Grafana Loki / Cloudflare Logpush + R2
- 比較軸: 月額コスト・保持期間・検索性能・PII masking 機能・SOC2 等のコンプライアンス対応・運用負荷
- MVP では Cloudflare Logpush + R2 (Object Lock) を第一候補として評価する

#### export interval

- 候補: リアルタイム push / 5min / 1h / daily batch
- D1 → R2 export は Workers Cron + `wrangler d1 export` 相当の API でバッチ前提
- SIEM への push はバッチ output を `R2 → Logpush` または `Workers fetch` で送信

#### retention

- D1 内: 直近 90 日（運用 UI 検索用）
- R2 / SIEM: 7 年（会計・労務監査要件を上限想定、要法務確認）
- Object Lock / WORM 設定で改ざん不可とする

#### PII masking

- `before_json` / `after_json` から email / 電話番号 / 住所等を masking
- masking ルールは `apps/api` 共通モジュールで一元管理し、export pipeline で適用
- raw データは D1 にのみ残し、export 先には masked のみ出す方針

#### failure retry

- export job の失敗は Cloudflare Queues または D1 上の `audit_export_state` テーブルで status 管理
- 最大 retry 回数・backoff・dead-letter 通知（Slack / mail）を定義
- 24h 連続失敗時は P2 alert を発火

#### コスト見積

- D1 read（export 用 SELECT）/ R2 storage / R2 PUT / Logpush / SIEM 月額
- 想定ボリューム: audit_log 1 万行/月、`before_json`+`after_json` 平均 2KB

### 依存

- `task-07c-audit-log-browsing-ui`（D1 内 audit_log の参照 UI）
- 09b cron / monitoring / release runbook（cron 登録・alert 経路）
- `UT-08-monitoring-alert-design`（alert ルーティング基盤）
- `UT-12-cloudflare-r2-storage`（R2 bucket セットアップ）

## 参照

- `docs/30-workflows/unassigned-task/task-07c-audit-log-browsing-ui.md`
- `docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md`
- `docs/30-workflows/unassigned-task/UT-12-cloudflare-r2-storage.md`
- 07c Phase 12 unassigned-task-detection ログ
- Cloudflare Logpush / R2 Object Lock 公式ドキュメント

---

## 学び / 苦戦箇所

| 項目     | 内容                                                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | MVP では `audit_log` を D1 に append-only で記録するところまでで scope を切ったが、長期保管 / 改ざん検知 / PII masking は D1 単体では完結しないことが Phase 12 で確認された |
| 原因     | D1 は OLTP 用途の SQLite ベースであり、長期 immutable 保管・WORM・SIEM 連携を前提にした機能（Object Lock / hash chain / 構造化 export）を持たない                  |
| 対応     | Cloudflare R2 export + Workers Cron + 外部 SIEM（Datadog / Splunk / Logpush）の組合せ選定、retention policy、PII masking、コスト見積を本タスクで運用要件として確定する |
| 再発防止 | 監査ログを扱うタスクは MVP スコープを切る段階で「長期保管・改ざん検知・外部監査提出」の有無を必ず明示し、必要なら別タスクとして同時に立てる運用にする             |
| 学び     | 監査ログは「記録する」より「証跡として後から提出できる状態に保つ」のほうが運用コストが大きく、MVP 設計時点で連携先 SIEM・retention・コスト見積を確定しておくべき   |
