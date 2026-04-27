# UT-08 実装ガイド — モニタリング/アラート設計の Wave 2 引き渡し

| 項目 | 値 |
| --- | --- |
| 対応 Phase | 12 / 13 |
| 対象読者 | Wave 2 実装担当者（apps/api 計装・アラートワーカー実装） + 運用担当 |
| 作成日 | 2026-04-27 |
| 役割 | UT-08 設計成果物（Phase 1〜10）を Wave 2 実装に渡すための要点集約ガイド |
| SSOT 引用ルール | 本書はスニペットを書かない。設計成果物（`outputs/phase-02/*.md`）を引用する |

> **PR 作成時に使用される重要文書**。本書のみで Wave 2 実装に着手できることを保証する。

---

# Part 1 — 中学生レベル概念説明

## 1.1 なぜ監視・アラートが必要か（家を留守にする間の不安）

家を 2〜3 日空けるとき、「ガスが消えてるかな」「窓は閉まってるかな」と気になる。
誰かが家にずっといれば気づくが、いないと火事や泥棒が起きても**気づくのが翌週**になる。

ウェブサービスも同じ。ユーザーが使っている裏側で、

- 突然エラーが増えていないか
- 無料で使える上限を超えそうになっていないか
- データを Google スプレッドシートから D1 へ写す自動処理が止まっていないか

を**サービスが自分で見張って、おかしくなったらすぐスマホに通知**する。これが監視・アラート。

## 1.2 システム全体の見取り図（家の例え）

UBM 兵庫支部会のシステムを「家」に例えると:

| 部屋・設備 | 実体 |
| --- | --- |
| 玄関（来客が入る場所） | Cloudflare Pages（公開サイト） |
| リビング（来客に応対する人） | Cloudflare Workers `apps/api`（API サーバ） |
| 物置（モノを保管） | Cloudflare D1（データベース） |
| 配管（水を流す） | Cron Trigger（Sheets→D1 同期、毎日決まった時間に水を流す） |
| 警備会社の巡回 | UptimeRobot（外から 5 分ごとに「ドアが開くか」確認） |
| 家中のセンサー | Workers Analytics Engine（WAE = 監視日誌） |
| アラーム電話 | Slack Webhook（家主のスマホに即電話） |
| サブのアラーム電話 | Email（CRITICAL のときだけ） |
| 鍵 | Slack Webhook URL（1Password の金庫に保管、家中に貼らない） |

## 1.3 WARNING / CRITICAL の二段階の意味

煙センサーに 2 段階あるのと同じ:

- **WARNING**（黄色） = 「ちょっと煙が出てる気がする」レベル。**様子見でいい**が早めに気づく
- **CRITICAL**（赤色） = 「これは火事だ、すぐ動け」レベル。**起き上がって対応**

最初は **WARNING だけ電話で鳴らす**。CRITICAL は記録だけ取って、電話は鳴らさない。
理由は次の 1.4。

## 1.4 アラート疲れ（最初は控えめに運用する理由）

アラームが鳴りすぎると、家族はそのうち**鳴っても無視する**ようになる（オオカミ少年）。
これが「アラート疲れ」。

UBM では:

- リリース後 2〜3 ヶ月は **WARNING のみ通知**
- 誤報率が月 1 件以下に落ち着いたら、CRITICAL も電話で鳴らすように切り替え

## 1.5 通知が来たら何をするか

スマホに「[CRITICAL] エラー率 6%」と通知が来たら:

1. Slack の通知メッセージにある「Runbook URL」を開く（= 取扱説明書を開く）
2. 説明書通りの順番で確認する（D1 の故障？Sheets API の問題？）
3. 直ったら Slack のスレッドに「直しました」と書く

取扱説明書 = 05a の `cost-guardrail-runbook.md` に追記される一次対応手順（[runbook-diff-plan.md §3.1](../phase-02/runbook-diff-plan.md)）。

## 1.6 監視ツールが「無料プラン」に限定されている理由

家計を圧迫しないため。月数千円の有料サービスを契約すると、UBM 兵庫支部会のような小規模団体では**運営費が監視代だけで消える**。

無料プラン縛りでも、

- Cloudflare Analytics + WAE（Cloudflare 標準、無料枠で十分）
- UptimeRobot 無料 50 monitors / 5 分間隔
- Slack Incoming Webhook 無料

の 3 つを組み合わせれば、家全体を見張れる。

---

# Part 2 — 技術者レベル詳細（Wave 2 実装入力）

## 2.1 メトリクス一覧（SSOT: metric-catalog.md）

正本は [`outputs/phase-02/metric-catalog.md`](../phase-02/metric-catalog.md)。本書では**引用のみ**。

| カテゴリ | 主要メトリクス（一部抜粋） | 取得元 |
| --- | --- | --- |
| Workers | `workers.errors_5xx` / `workers.cpu_time_p99` / `workers.duration_p95` / `workers.subrequests` / `workers.requests` | Cloudflare Analytics（一部 WAE 補足） |
| Pages | `pages.builds_failed` | Cloudflare Pages（GitHub Actions 連携も可） |
| D1 | `d1.row_reads` / `d1.row_writes` / `d1.query_failures` | Cloudflare D1 Dashboard + WAE 計装 |
| Cron | `cron.invocations` / `cron.failures` / `cron.duration_ms` / `cron.rows_synced` | WAE 計装 |
| 外形 | `synthetic.http_status` / `synthetic.response_ms` | UptimeRobot |

合計 20 メトリクス（自動化 14 / 手動据え置き 6）。

> 詳細・自動化区分・05a observability-matrix との対応は **必ず metric-catalog.md を参照**（identifier drift 防止、SKILL.md「Feedback W1-02b-3」）。

## 2.2 WAE 計装ポイント（SSOT: wae-instrumentation-plan.md）

正本は [`outputs/phase-02/wae-instrumentation-plan.md`](../phase-02/wae-instrumentation-plan.md)。

- **データセット名（binding）**: `MONITORING_AE`
- **データセット（実体名）**: `ubm_hyogo_monitoring`
- **イベント名**: `api.request` / `api.error` / `cron.sync.start` / `cron.sync.end` / `d1.query.fail` / `auth.fail`（auth.fail は任意）
- **サンプリング初期**: 全イベント 100%。`api.request` のみ data points が無料枠 70% 到達時に 10% へ切替
- **PII 除外**: email / userId / IP は計装しない。`error.message` は redact してから格納
- **wrangler.toml 追記イメージ**:

```toml
[[analytics_engine_datasets]]
binding = "MONITORING_AE"
dataset = "ubm_hyogo_monitoring"
```

> 各イベントの index / blobs / doubles 構造は wae-instrumentation-plan.md §3 を参照（手書き再掲しない）。

### 計装コードの配置先（候補）

- `apps/api/src/observability/wae.ts`（writeDataPoint ラッパ薄ヘルパ、Wave 2 新設）
- Hono middleware（`apps/api/src/middleware/`）から `api.request` / `api.error` を発火
- D1 wrapper（`apps/api/src/db/`）から `d1.query.fail` を発火
- Cron handler（`apps/api/src/cron/`）から `cron.sync.start` / `cron.sync.end` を発火

## 2.3 TypeScript 契約 / API シグネチャ（Wave 2 実装候補）

正本値は `outputs/phase-02/*.md` を参照し、下記は Wave 2 実装時の境界案として扱う。識別子を変更する場合は、先に `wae-instrumentation-plan.md` / `alert-threshold-matrix.md` / `notification-design.md` を更新する。

```ts
export type MonitoringSeverity = "warning" | "critical";

export type MonitoringEventName =
  | "api.request"
  | "api.error"
  | "cron.sync.start"
  | "cron.sync.end"
  | "d1.query.fail"
  | "auth.fail";

export interface MonitoringDataPoint {
  eventName: MonitoringEventName;
  indexes: string[];
  blobs: string[];
  doubles: number[];
  sampledAt: string;
}

export interface AlertRuleInput {
  metric: string;
  value: number;
  windowMinutes: number;
  environment: "production" | "staging";
}

export interface AlertDecision {
  shouldNotify: boolean;
 severity: MonitoringSeverity;
  runbookUrl: string;
  dedupeKey: string;
}

export interface MonitoringNotifier {
  notify(decision: AlertDecision, message: string): Promise<void>;
}
```

### API シグネチャ

```ts
export function buildMonitoringDataPoint(input: MonitoringDataPoint): MonitoringDataPoint;

export async function writeMonitoringDataPoint(
  analytics: AnalyticsEngineDataset,
  dataPoint: MonitoringDataPoint,
): Promise<void>;

export function evaluateAlertRule(input: AlertRuleInput): AlertDecision;

export async function sendSlackAlert(
  webhookUrl: string,
  decision: AlertDecision,
  message: string,
): Promise<Response>;
```

### 使用例

```ts
const decision = evaluateAlertRule({
  metric: "workers.errors_5xx",
  value: 5,
  windowMinutes: 5,
  environment: "production",
});

if (decision.shouldNotify) {
  await notifier.notify(decision, "[CRITICAL] workers.errors_5xx exceeded threshold");
}
```

### エラー処理 / エッジケース

| ケース | 扱い |
| --- | --- |
| `MONITORING_AE` binding 不在 | WAE 書込を skip し、API 本処理は失敗させない。起動時 validation では WARNING を出す |
| Slack Webhook 5xx / timeout | 30 秒 dedupe key を維持したまま Email フォールバックを試行 |
| `api.request` の data points が無料枠 70% 到達 | sampling rate を 10% へ落とす |
| 同一 metric + severity の連続発火 | 30 分以内 1 件に抑制し、5 件以上はサマリ通知 |
| PII 混入リスク | email / userId / IP を格納しない。error.message は redact 後に blobs へ格納 |

## 2.4 閾値マトリクス（SSOT: alert-threshold-matrix.md）

正本は [`outputs/phase-02/alert-threshold-matrix.md`](../phase-02/alert-threshold-matrix.md)。要点:

- 無料枠ベース閾値: WARNING = 70%, CRITICAL = 90%
- SLA ベース: エラー率 1% / 5%、p95 1500ms / 3000ms
- アラート疲れ抑止: 連続条件・件数閾値・評価窓を併用
- 運用フェーズ別: 初期は WARNING のみ通知、CRITICAL は記録のみ。安定運用判断後（誤報率 1 件/月以下が 30 日連続）に CRITICAL 通知有効化
- 月次レビュー: 誤報率 > 5% は緩和、未検知発生は厳格化（**毎月 1 営業日**に閾値レビュー、MINOR-02 を本書で formalize）

## 2.5 通知 API 設計（SSOT: notification-design.md / secret-additions.md）

### Slack Incoming Webhook

- 一次通知: `#alerts-prod`（本番）/ `#alerts-staging`（ステージング）/ `#alerts-deploy`（任意）
- ペイロード仕様（推奨構造）は [`notification-design.md §3.3`](../phase-02/notification-design.md) を参照
- 色分け: WARNING = `warning`（黄）/ CRITICAL = `danger`（赤）
- 抑制: 同一メトリクス + 同一 severity は 30 分以内 1 件まで（同 §2 / alert-threshold-matrix §4）

### Email サブ通知

- 送信元 MVP: Cloudflare Email Routing 経由（追加 Secret 不要）
- 配送先: `ALERT_EMAIL_TO`（GitHub Variables、非機密）
- CRITICAL のみ送信（運用フェーズ別でも初期は不発）
- 月次運用化: **毎月 1 営業日**に CRITICAL 経路テストメール送信（MINOR-03 を本書で formalize）

### Secret 名一覧（SSOT: secret-additions.md）

| 名前 | 種別 | 用途 | 環境 |
| --- | --- | --- | --- |
| `MONITORING_SLACK_WEBHOOK_URL_PROD` | Secret | 本番 Slack | production |
| `MONITORING_SLACK_WEBHOOK_URL_STAGING` | Secret | ステージング Slack | staging |
| `MONITORING_SLACK_WEBHOOK_URL_DEPLOY` | Secret（任意） | デプロイ通知 | 全環境共通（GitHub Secrets） |
| `UPTIMEROBOT_API_KEY` | Secret（任意） | IaC 管理時のみ | GitHub Secrets |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Secret | GraphQL Analytics 呼出 | 環境別 |
| `ALERT_EMAIL_TO` | 非機密 | 配送先 | GitHub Variables |
| `ALERT_EMAIL_FROM` | 非機密 | 送信元 | GitHub Variables / wrangler.toml `[vars]` |

### 1Password Environments 取り込み手順（要点）

```bash
# 例: 本番 Slack Webhook
op read "op://UBM-Hyogo/MONITORING_SLACK_WEBHOOK_URL_PROD/value" \
  | wrangler secret put MONITORING_SLACK_WEBHOOK_URL_PROD --env production
```

詳細は [`secret-additions.md §3`](../phase-02/secret-additions.md)。ローカル開発は `apps/api/.dev.vars`（`.gitignore` 済）。

### 不変条件 4 遵守

- Webhook URL を `wrangler.toml` `[vars]` 直下や `.dev.vars.example` に**実値で書かない**
- ローテーション手順は [`runbook-diff-plan.md §3.2`](../phase-02/runbook-diff-plan.md)

## 2.6 失敗検知ルール（SSOT: failure-detection-rules.md）

正本は [`outputs/phase-02/failure-detection-rules.md`](../phase-02/failure-detection-rules.md)。10 ルールを定義:

- D1 クエリ失敗（散発: 5min 3 件以上 / 多発: 5min 10 件以上 / migration 1 件で即 CRITICAL）
- Sheets→D1 同期失敗（24h 1 件 / 連続 2 回 / 同期未起動）
- Sheets API 認証失敗（`SheetsAuthError` 1 件で WARNING）
- Workers 例外スロー多発（`api.error` 5min 20 件以上）
- 外形監視ダウン（連続 2 回 / 連続 4 回）

実装方針: アラートワーカー（apps/api 内 Cron Trigger 1min）で GraphQL Analytics API + WAE クエリを実行。連続失敗判定・重複通知抑制は軽量 KV 併用（D1 直接書込はしない）。

## 2.7 外部監視（SSOT: external-monitor-evaluation.md）

- 一次採用: **UptimeRobot 無料プラン**（50 monitors / 5 min）
- Monitor 候補: `prod-pages-top` / `prod-api-health` / `staging-pages-top` / `staging-api-health`
- ダウン判定: 連続 2 回（10 min）失敗、復旧: 連続 1 回成功
- 5 min 間隔は SLA 99%（月間ダウン許容 7h12m）に対し許容範囲（[`external-monitor-evaluation.md §4`](../phase-02/external-monitor-evaluation.md)）
- サブ候補: Cronitor（dead man's switch、Wave 2 後の運用評価で導入判断）

## 2.8 05a runbook 差分追記（SSOT: runbook-diff-plan.md）

不変条件 1（05a 上書き禁止）遵守。追記内容は [`runbook-diff-plan.md`](../phase-02/runbook-diff-plan.md) に集約:

- §2: `observability-matrix.md` への追記（UT-08 自動化対応表として末尾追記、既存 table 不変更）
- §3.1: `cost-guardrail-runbook.md` 末尾追記「自動アラート受信時の一次対応」
- §3.2: 同 末尾追記「監視 Secret ローテーション手順」
- §3.3: 月次レビューチェック項目追加（誤報率・WAE data points・UptimeRobot monitor 数・Slack 疎通テスト）

実際の 05a 本体への書込は **Wave 2 実装末尾の別 PR**（または 05a 側で吸収）。UT-08 本タスクでは差分計画のみ保持。

## 2.9 Wave 2 実装着手チェックリスト

- [ ] 1Password Environments に全 Secret（§2.4 の表）を投入
- [ ] `wrangler secret put` で Cloudflare Secrets へ展開（production / staging）
- [ ] `apps/api/wrangler.toml` に `[[analytics_engine_datasets]]` 追記
- [ ] `apps/api/src/observability/wae.ts` 新設（writeDataPoint ラッパ）
- [ ] Hono middleware から `api.request` / `api.error` 発火実装
- [ ] D1 wrapper から `d1.query.fail` 発火実装
- [ ] Cron handler から `cron.sync.start` / `cron.sync.end` 発火実装（UT-09 連携）
- [ ] アラートワーカー（Cron 1min）実装、GraphQL Analytics クエリで失敗検知ルールを順次評価
- [ ] Slack Webhook 配信実装（フォールバック: Email）
- [ ] UptimeRobot で Monitor 4 件設定、Alert Contact に `MONITORING_SLACK_WEBHOOK_URL_PROD`
- [ ] `/api/health` エンドポイント実装（未実装なら一旦 `/` のみで起動）
- [ ] WAE 無料枠（保存期間・data points 上限）を実装直前に**再確認**（Phase 1 §未決事項、M-02）
- [ ] 月次運用化:「毎月 1 営業日に閾値レビュー」「毎月 1 営業日に CRITICAL 経路テストメール」を運用カレンダー化

## 2.10 引用ドキュメント一覧（実装入力）

| 入力 | パス |
| --- | --- |
| 設計総合 | `outputs/phase-02/monitoring-design.md` |
| メトリクス | `outputs/phase-02/metric-catalog.md` |
| 閾値 | `outputs/phase-02/alert-threshold-matrix.md` |
| 通知 | `outputs/phase-02/notification-design.md` |
| WAE 計装 | `outputs/phase-02/wae-instrumentation-plan.md` |
| 外形監視 | `outputs/phase-02/external-monitor-evaluation.md` |
| 失敗検知 | `outputs/phase-02/failure-detection-rules.md` |
| 05a 差分追記 | `outputs/phase-02/runbook-diff-plan.md` |
| Secret | `outputs/phase-02/secret-additions.md` |
| 実装計画 | `outputs/phase-05/implementation-plan.md` |
| 異常系 | `outputs/phase-06/failure-case-matrix.md` |
| AC トレーサ | `outputs/phase-07/ac-traceability-matrix.md` |
| 品質 | `outputs/phase-09/quality-checklist.md` |
| GO 判定 | `outputs/phase-10/go-nogo-decision.md` |

## 2.11 不変条件再掲（Wave 2 で必ず守る）

1. 05a の `observability-matrix.md` / `cost-guardrail-runbook.md` を**上書きしない**（差分追記計画として運用）
2. 監視ツールは**無料プラン範囲限定**（有料 SaaS は不採用）
3. 閾値は **WARNING 中心で初期運用**、CRITICAL は実績ベース段階導入（アラート疲れ抑止）
4. アラート用 Secret は **1Password Environments で管理**、コードへハードコード禁止
5. 本タスクは設計成果物のみ。Wave 2 で apps/ 編集を解禁

## 2.11 月次運用化項目（MINOR-02 / MINOR-03 formalize）

| 項目 | 実施日 | 内容 | 出典 |
| --- | --- | --- | --- |
| 閾値月次レビュー | 毎月 1 営業日 | 過去 30 日の誤報件数 / 未検知件数を集計、誤報率 > 5% は緩和 / 未検知発生は厳格化 | refactoring-log.md §3 #14（MINOR-02） |
| CRITICAL 経路テストメール送信 | 毎月 1 営業日 | Email 配送経路の生存確認 | refactoring-log.md §3 #15（MINOR-03） |
| WAE data points 月次累計確認 | 毎月 1 営業日 | 70% 到達時にサンプリング切替判断 | wae-instrumentation-plan.md §4 |
| UptimeRobot monitor 数 / Slack 疎通テスト | 毎月 1 営業日 | runbook-diff-plan.md §3.3 | 同左 |
