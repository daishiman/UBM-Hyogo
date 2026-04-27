# Phase 5 成果物: 実装計画書 (implementation-plan.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-08 モニタリング/アラート設計 |
| Phase | 5 / 13（実装計画書化） |
| 作成日 | 2026-04-27 |
| 状態 | completed（設計成果物として完了。実装は Wave 2 実装タスクへ委譲） |
| 引き渡し先 | Wave 2 実装タスク（仮称: WT-08-impl 監視計装実装） |

---

## 1. 本書の位置づけと前提

本書は UT-08 設計タスクの最終成果物の一つで、Wave 2 実装タスクが
WAE 計装・外形監視設定・通知設定・Secret 投入を行う際の **実装計画書** である。
本タスク内では実コードを書かない（不変条件 5）。

### 前提条件（Phase 4 引き継ぎ）

| ID | 内容 | Wave 2 実装着手前の確認責任 |
| --- | --- | --- |
| PRE-1 | 05a の `outputs/` 実成果物（observability-matrix.md / cost-guardrail-runbook.md）が生成済み | Wave 2 実装担当 |
| PRE-2 | WAE 無料枠の最新公式値を再確認し、sampling 率の妥当性を検証 | Wave 2 実装担当 |
| PRE-3 | UT-09（Sheets→D1 同期）の実装着手状態に応じて、INST-API-05 の実装タイミングを調整 | Wave 2 実装担当 |
| PRE-4 | 1Password Environments に Slack Webhook / UptimeRobot API / Cloudflare Analytics Token の格納完了 | 運用担当 |
| PRE-5 | `.gitignore` で `.env*` / wrangler 認証情報が除外されていることの最終確認 | Wave 2 実装担当 |

---

## 2. タスク分割（Wave 2 実装の作業単位）

| Task ID | 概要 | 主担当 | 入力 | 出力 | 所要 |
| --- | --- | --- | --- | --- | --- |
| W2-T01 | WAE バインディング追加（apps/api/wrangler.toml） | apps/api | phase-02/wae-instrumentation-plan.md | wrangler.toml 差分 | S |
| W2-T02 | observability middleware 実装（INST-API-01/02/04） | apps/api | phase-02/wae-instrumentation-plan.md / metric-catalog.md | middleware.ts / lib/metrics.ts / index.ts | M |
| W2-T03 | `/healthz` エンドポイント実装（INST-API-03） | apps/api | external-monitor-evaluation.md | routes/healthz.ts | S |
| W2-T04 | cron 計装（INST-API-05、UT-09 完了後） | apps/api | failure-detection-rules.md | jobs/sheets-sync.ts 修正 | M |
| W2-T05 | apps/web 計装（INST-WEB-01/02、必要時のみ） | apps/web | wae-instrumentation-plan.md | instrumentation.ts / middleware.ts | M |
| W2-T06 | Slack Webhook 取得 + 1Password 格納 | 運用 | notification-design.md | 1Password 項目 | S |
| W2-T07 | Cloudflare Secrets 投入（staging / production） | 運用 | secret-additions.md | wrangler secret put 実行記録 | S |
| W2-T08 | UptimeRobot モニタ作成（Web / API） | 運用 | external-monitor-evaluation.md | UptimeRobot 設定スクショ | S |
| W2-T09 | Cronitor 設定（cron.sync 二重監視） | 運用 | failure-detection-rules.md | Cronitor 設定スクショ | S |
| W2-T10 | 05a runbook への差分追記（observability-matrix / cost-guardrail-runbook） | docs | runbook-diff-plan.md | 各 .md への追記 PR | M |
| W2-T11 | Test ID 全件実行（MON-EXT/WAE/NTF × 4） | Wave 2 全体 | phase-04/test-plan.md | test 実行ログ | M |
| W2-T12 | DoD 達成確認 | Wave 2 全体 | 本書 §5-7 | 完了報告 | S |

> 規模感：S = 0.5d、M = 1〜2d。実日数は Wave 2 計画時に再見積。

---

## 3. 計装ポイント候補（識別子レベル・擬似コード）

### 3-1. apps/api 側（Hono）

| 計装 ID | ファイル候補 | 計装内容（擬似） | 出力イベント | 関連設計 |
| --- | --- | --- | --- | --- |
| INST-API-01 | `apps/api/src/middleware/observability.ts`（新規） | リクエスト start/end、status、duration、route、method を WAE へ書込 | `api.request` / `api.error` | wae-instrumentation-plan.md |
| INST-API-02 | `apps/api/src/index.ts`（修正） | `app.use('*', observabilityMiddleware)` 登録 | - | wae-instrumentation-plan.md |
| INST-API-03 | `apps/api/src/routes/healthz.ts`（新規） | 200 + JSON `{ok:true, version}` を返却 | - | external-monitor-evaluation.md |
| INST-API-04 | `apps/api/src/lib/metrics.ts`（新規） | writeDataPoint ラッパ。sampling 率定数を集約（Phase 8 DRY 化対象） | 全イベント共通 | wae-instrumentation-plan.md |
| INST-API-05 | `apps/api/src/jobs/sheets-sync.ts`（修正、UT-09 後） | cron 開始/終了時に `cron.sync.start` / `cron.sync.end{status}` を発行 | `cron.sync.*` | failure-detection-rules.md |
| INST-API-06 | `apps/api/src/db/*`（修正） | D1 クエリ失敗時に `d1.query.fail` を発行 | `d1.query.fail` | failure-detection-rules.md |
| INST-API-07 | `apps/api/src/auth/*`（修正） | 認証失敗時に `auth.fail` を発行 | `auth.fail` | metric-catalog.md |

### 3-2. apps/web 側（Next.js on Workers）

| 計装 ID | ファイル候補 | 計装内容（擬似） | 出力イベント |
| --- | --- | --- | --- |
| INST-WEB-01 | `apps/web/instrumentation.ts`（新規 / Next.js 慣習） | リクエスト計装フック登録（Workers 互換 API のみ） | `api.request`（web 経由） |
| INST-WEB-02 | `apps/web/middleware.ts`（修正 or 新規） | エッジ middleware で経路・status を WAE 転送（必要時のみ） | `api.request` / `api.error` |

### 3-3. 擬似コード（Wave 2 実装の参考）

```ts
// 擬似コード — Wave 2 実装で具体化
export const observabilityMiddleware = async (c, next) => {
  const start = Date.now();
  let status = 0;
  try {
    await next();
    status = c.res.status;
  } catch (err) {
    status = 500;
    throw err;
  } finally {
    const duration = Date.now() - start;
    const isError = status >= 500;
    c.env.WAE_DATASET.writeDataPoint({
      blobs: [
        isError ? "api.error" : "api.request",
        c.req.routePath ?? c.req.path,
        String(status),
      ],
      doubles: [duration],
      indexes: [c.req.method],
    });
  }
};
```

> 計装イベントは metric-catalog.md の 6 イベント（api.request, api.error, cron.sync.start, cron.sync.end, d1.query.fail, auth.fail）に整合させる。

---

## 4. wrangler.toml 差分（擬似 TOML）

### 4-1. apps/api/wrangler.toml への追加

```toml
# 擬似 TOML — Wave 2 実装で確定
[[analytics_engine_datasets]]
binding = "WAE_DATASET"
dataset = "ubm_hyogo_observability"

[env.staging]
[[env.staging.analytics_engine_datasets]]
binding = "WAE_DATASET"
dataset = "ubm_hyogo_observability_staging"

[env.production]
[[env.production.analytics_engine_datasets]]
binding = "WAE_DATASET"
dataset = "ubm_hyogo_observability_prod"
```

| 項目 | 値（候補） | 備考 |
| --- | --- | --- |
| binding 名 | `WAE_DATASET`（apps/api 共通） | Phase 8 DRY 化で定数化 |
| dataset 名 | staging / prod 分離 | 無料枠を共有しすぎないため分離推奨 |
| sampling 率 | 初期 100%、運用後 10〜25% へ下げる | metrics.ts に定数化 |

### 4-2. apps/web/wrangler.toml への追加（必要時のみ）

```toml
[[analytics_engine_datasets]]
binding = "WAE_WEB"
dataset = "ubm_hyogo_observability_web"
```

> apps/api でリクエストが集約できる場合 apps/web 側の計装は省略可。Wave 2 実装段階で判断する。

---

## 5. 外形監視設定 Runbook（UptimeRobot 一次 / Cronitor サブ）

### 5-1. UptimeRobot（一次・Web/API HTTP 監視）

1. **アカウント準備**: https://uptimerobot.com に運用担当アカウントでログイン（無料プラン）
2. **モニタ作成（Web Production）**
   - Type: HTTP(s)
   - Friendly Name: `UBM-Hyogo Web Production`
   - URL: `https://<production-domain>/`
   - Monitoring Interval: 5 minutes
3. **モニタ作成（API Healthcheck Production）**
   - Type: HTTP(s) / Keyword
   - URL: `https://<api-domain>/healthz`
   - Keyword to find: `"ok":true`
4. **モニタ作成（staging 同等）**
   - 上記 2 種を staging ドメインで複製
5. **Alert Contacts**
   - Slack（incoming webhook）: `MONITORING_SLACK_WEBHOOK_URL_PROD` / `_STAGING`
   - Email: 1Password `monitoring-mail-recipient`
6. **アラート挙動**
   - Send notifications every: 5 minutes（重複抑止）
   - Trigger: 連続 2 回失敗で WARNING、4 回で CRITICAL（外部監視側はインシデント単位のため、CRITICAL 連動は Slack メッセージプレフィックスで運用判別）
7. **テスト**: Phase 4 MON-EXT-02 / MON-EXT-03 / MON-NTF-02 / MON-NTF-03 を実行

### 5-2. Cronitor（サブ・cron 二重監視）

1. https://cronitor.io 無料アカウント（5 ジョブまで）にログイン
2. ジョブ追加
   - Name: `ubm-sheets-sync-prod`
   - Type: Heartbeat
   - Schedule: cron 実スケジュールに合わせる（例: `*/15 * * * *`）
   - Grace Period: 5 minutes
3. cron 側計装（INST-API-05）から `https://cronitor.link/p/<token>/<id>?state=run|complete|fail` を beacon
4. Cronitor → Slack 連携を `MONITORING_SLACK_WEBHOOK_URL_DEPLOY` に設定（cron 通知は別チャネル運用が望ましい）
5. テスト: cron 実行成功・失敗・遅延の 3 ケースを Wave 2 実装で確認

---

## 6. Slack Webhook 取得 / Cloudflare Secrets 投入手順

### 6-1. Slack Incoming Webhook 取得

1. Slack ワークスペース管理画面 → App Directory → `Incoming Webhooks` を追加
2. 通知先チャネル
   - 本番アラート: `#ubm-alerts-prod` → `MONITORING_SLACK_WEBHOOK_URL_PROD`
   - ステージング: `#ubm-alerts-staging` → `MONITORING_SLACK_WEBHOOK_URL_STAGING`
   - デプロイ通知: `#ubm-deploy` → `MONITORING_SLACK_WEBHOOK_URL_DEPLOY`
3. 発行された Webhook URL を 1Password Environments の所定項目に格納

### 6-2. Cloudflare Secrets 投入（Wave 2 実装時のみ実行）

```bash
# 本 Phase では実行しない。Wave 2 実装タスクで実行する想定。
mise exec -- pnpm wrangler secret put MONITORING_SLACK_WEBHOOK_URL_PROD     --env production
mise exec -- pnpm wrangler secret put MONITORING_SLACK_WEBHOOK_URL_STAGING  --env staging
mise exec -- pnpm wrangler secret put MONITORING_SLACK_WEBHOOK_URL_DEPLOY   --env production
mise exec -- pnpm wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN            --env production
mise exec -- pnpm wrangler secret put UPTIMEROBOT_API_KEY                   --env production
```

| Secret 名 | 環境 | 用途 |
| --- | --- | --- |
| MONITORING_SLACK_WEBHOOK_URL_PROD | production | 本番アラート |
| MONITORING_SLACK_WEBHOOK_URL_STAGING | staging | ステージングアラート |
| MONITORING_SLACK_WEBHOOK_URL_DEPLOY | production | デプロイ / cron 通知 |
| CLOUDFLARE_ANALYTICS_TOKEN | production | GraphQL/SQL 集計バッチ用 |
| UPTIMEROBOT_API_KEY | production | UptimeRobot API 操作（IaC 化時） |

> 不変条件 4: Secret は 1Password Environments を正本とし、コードに平文埋め込み禁止。`.env` をリポジトリにコミット禁止。

---

## 7. 05a runbook への差分追記計画

| 対象（05a 実成果物） | 追記内容 | 追記タイミング | 担当 |
| --- | --- | --- | --- |
| `observability-matrix.md` | 自動収集列を追加（手動 vs 自動の対応関係）。WAE 計装イベント名と sampling 率を併記 | Wave 2 実装完了後 | docs |
| `cost-guardrail-runbook.md` | アラート発報時の一次対応手順（Slack 通知受領 → Cloudflare Dashboard → runbook 該当節）を追記 | Wave 2 実装完了後 | docs |

> 不変条件 1: 05a 成果物は上書きせず、追記方式（節を追加 / 表に列追加）で行う。

---

## 8. 新規作成 / 修正ファイル一覧

| 種別 | パス候補 | 役割 | Wave 2 Task ID |
| --- | --- | --- | --- |
| 新規 | apps/api/src/middleware/observability.ts | リクエスト計装 middleware | W2-T02 |
| 新規 | apps/api/src/lib/metrics.ts | WAE writeDataPoint ラッパ・sampling 集約 | W2-T02 |
| 新規 | apps/api/src/routes/healthz.ts | 外形監視向けヘルスチェック | W2-T03 |
| 修正 | apps/api/src/index.ts | middleware 登録 | W2-T02 |
| 修正 | apps/api/src/jobs/sheets-sync.ts | cron 計装（INST-API-05、UT-09 後） | W2-T04 |
| 修正 | apps/api/src/db/* | D1 クエリ失敗計装 | W2-T02 |
| 修正 | apps/api/src/auth/* | 認証失敗計装 | W2-T02 |
| 修正 | apps/api/wrangler.toml | analytics_engine_datasets 追加 | W2-T01 |
| 新規 | apps/web/instrumentation.ts | Next.js 計装フック（必要時） | W2-T05 |
| 修正 | apps/web/middleware.ts | エッジ計装（必要時） | W2-T05 |
| 修正 | apps/web/wrangler.toml | WAE バインディング（必要時） | W2-T05 |
| 修正 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md | 差分追記 | W2-T10 |
| 修正 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md | 差分追記 | W2-T10 |

---

## 9. Wave 2 実装タスクの DoD（Definition of Done）

- [ ] Phase 4 Test ID（MON-EXT-01〜04 / MON-WAE-01〜04 / MON-NTF-01〜04）全 12 件が staging で PASS
- [ ] 計装イベント 6 種（api.request, api.error, cron.sync.start, cron.sync.end, d1.query.fail, auth.fail）が WAE で観測可能
- [ ] WAE バインディングが staging / production 両環境で機能（MON-WAE-01 PASS）
- [ ] sampling 率が 100%（初期）または運用後の調整値で metrics.ts に集約されている
- [ ] UptimeRobot モニタ（Web prod / Web staging / API prod / API staging の 4 件）が稼働
- [ ] Cronitor cron heartbeat が稼働（cron.sync 二重監視）
- [ ] 5 種の Secret が staging / production に投入済み（`wrangler secret list` で確認）
- [ ] Slack Webhook 経由の到達確認（3 チャネル：prod / staging / deploy）
- [ ] 05a runbook 2 ファイルへの差分追記が PR 化されレビュー承認済
- [ ] CRITICAL 段階導入のため、初期は WARNING のみ有効化（不変条件 3）
- [ ] 無料枠消費率の事後計測（24h / 7d）で WAE 書込量が 70% 警告閾値以下

---

## 10. リスクと緩和

| リスク | 発生確率 | 影響 | 緩和策 |
| --- | --- | --- | --- |
| WAE 無料枠超過 | 中 | 計装停止 | 初期 100% sampling から 10〜25% へ運用後切替（INST-API-04 で集約） |
| Slack Webhook 失効 | 低 | 通知欠落 | FC-03 に従い 1Password で Webhook 再発行手順固定 |
| UptimeRobot サービス障害 | 低 | 外形監視盲点 | Cronitor サブ監視で cron 系をカバー、Status feed RSS を購読 |
| UT-09 未完了 | 中 | INST-API-05 未実装 | W2-T04 を分割し、UT-09 完了後に再着手 |
| 05a outputs 未生成 | 中 | runbook 差分追記不可 | W2-T10 着手前に 05a 完了を確認 |

---

## 11. 参照

- outputs/phase-02/monitoring-design.md
- outputs/phase-02/metric-catalog.md
- outputs/phase-02/wae-instrumentation-plan.md
- outputs/phase-02/notification-design.md
- outputs/phase-02/external-monitor-evaluation.md
- outputs/phase-02/runbook-diff-plan.md
- outputs/phase-02/failure-detection-rules.md
- outputs/phase-02/secret-additions.md
- outputs/phase-04/test-plan.md
- outputs/phase-04/pre-verify-checklist.md
- https://developers.cloudflare.com/analytics/analytics-engine/get-started/
- https://api.slack.com/messaging/webhooks
- https://uptimerobot.com/api/
- https://cronitor.io/docs
