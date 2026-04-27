# Phase 5: 実装計画書化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | モニタリング/アラート設計 (UT-08) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画書化 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 前 Phase | 4 (テスト計画・事前検証) |
| 次 Phase | 6 (異常系検証計画) |
| 状態 | completed |
| GitHub Issue | #10（CLOSED） |

---

## 目的

UT-08 は **設計タスク** であり、本 Phase でも実コードを書かない。
代わりに、Wave 2 実装タスク（UT-08 後段の計装実装タスク）が
Phase 2 設計成果物・Phase 4 テスト計画を入力として実装するための
**実装計画書（implementation-plan.md）** を整える。

実装計画書は以下を満たすこと:

1. 計装ポイント候補（apps/api / apps/web）が識別子レベルで列挙されている
2. WAE バインディング追加箇所（wrangler.toml）が示されている
3. UptimeRobot（または同等）の外形監視設定手順が runbook 形式で記述されている
4. Slack Webhook / メール通知 Secret の注入手順が示されている
5. 05a runbook（observability-matrix.md / cost-guardrail-runbook.md）への差分追記計画が含まれている
6. 「新規作成」「修正」ファイル一覧が識別のみで列挙され、コード断片は擬似コードに留められている

---

## 実行タスク

- [ ] Phase 2 成果物（特に `wae-instrumentation-plan.md` と `metric-catalog.md`）から計装ポイントを抽出する
- [ ] apps/api / apps/web の対象ファイル候補を識別子レベルで列挙する
- [ ] wrangler.toml に追加する `analytics_engine_datasets` バインディング定義を擬似 TOML で記述する
- [ ] UptimeRobot（または評価で選定した外部監視ツール）の登録手順を runbook 化する
- [ ] Slack Incoming Webhook 取得手順 / Cloudflare Secrets 投入手順を記述する
- [ ] 05a runbook 差分追記計画を `runbook-diff-plan.md` の補強として整理する
- [ ] 新規作成 / 修正ファイル一覧を表形式で列挙する
- [ ] Wave 2 実装タスクへの引き渡し条件（DoD）を明記する
- [ ] 不変条件 5（実装コード非実施）を満たしていることを確認する

---

## 5-1. 計装ポイント候補（識別のみ・擬似コード）

### apps/api 側（Hono）

以下を `outputs/phase-05/implementation-plan.md` の「計装ポイント」章に記録する。コードは書かない。

| 計装 ID | 対象ファイル候補 | 計装内容（擬似） | 関連 Phase 2 成果物 |
| --- | --- | --- | --- |
| INST-API-01 | `apps/api/src/middleware/observability.ts`（新規） | 全リクエストの開始/終了時刻・ステータスコード・経路を WAE に書き込む共通 middleware | wae-instrumentation-plan.md |
| INST-API-02 | `apps/api/src/index.ts`（修正） | `app.use('*', observabilityMiddleware)` の登録 | wae-instrumentation-plan.md |
| INST-API-03 | `apps/api/src/routes/healthz.ts`（新規） | 外形監視向けヘルスチェックエンドポイント | external-monitor-evaluation.md |
| INST-API-04 | `apps/api/src/lib/metrics.ts`（新規） | `writeDataPoint` ラッパ関数（sampling 制御 / blob 整形） | wae-instrumentation-plan.md |
| INST-API-05 | `apps/api/src/jobs/sheets-sync.ts`（修正・UT-09 連携） | Sheets→D1 同期成功/失敗イベントの WAE 書き込み | failure-detection-rules.md |

> 上記はすべて候補識別子であり、ファイルパスは Wave 2 実装時に確定する。

### apps/web 側（Next.js on Workers）

| 計装 ID | 対象ファイル候補 | 計装内容（擬似） | 関連 Phase 2 成果物 |
| --- | --- | --- | --- |
| INST-WEB-01 | `apps/web/instrumentation.ts`（新規 / Next.js 慣習） | リクエスト計装フックの登録（Workers 互換 API のみ使用） | wae-instrumentation-plan.md |
| INST-WEB-02 | `apps/web/middleware.ts`（修正 or 新規） | エッジ middleware で経路・status を WAE に転送 | wae-instrumentation-plan.md |

### 擬似コード（実装計画書に記す例）

```ts
// 擬似コード — Wave 2 実装タスクで具体化される
export const observabilityMiddleware = async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  c.env.WAE_DATASET.writeDataPoint({
    blobs: [c.req.path, String(c.res.status)],
    doubles: [duration],
    indexes: [c.req.method],
  });
};
```

> **注記**: この擬似コードは実装計画書に「Wave 2 実装の参考」として掲載する。実コードは UT-08 の責務外。

---

## 5-2. WAE バインディング追加箇所（wrangler.toml）

`apps/api/wrangler.toml`（Web 側に計装する場合は `apps/web/wrangler.toml` も対象）に
以下のセクションを追加する計画とする。

```toml
# 擬似 TOML — Wave 2 実装で確定
[[analytics_engine_datasets]]
binding = "WAE_DATASET"
dataset = "ubm_hyogo_observability"
```

| 項目 | 値（候補） |
| --- | --- |
| binding 名 | `WAE_DATASET`（apps/api） / `WAE_WEB`（apps/web、必要時のみ） |
| dataset 名 | `ubm_hyogo_observability` |
| 環境分離 | `[env.staging]` / `[env.production]` 配下にそれぞれ複製、または共通 |

> dataset 名は無料枠の保存期間（公式確認値）を踏まえ、Phase 2 で確定済みの命名に従う。

---

## 5-3. UptimeRobot 外形監視設定手順（Runbook 化）

実装計画書に以下を Runbook として収める。

1. **アカウント作成 / ログイン**
   - https://uptimerobot.com にて無料アカウントを作成（または既存アカウントを使用）
2. **モニタ作成（HTTPS）**
   - Type: `HTTP(s)`
   - Friendly Name: `UBM-Hyogo Web Production`
   - URL: `https://<production-domain>/`
   - Monitoring Interval: `5 minutes`
3. **API ヘルスチェック追加**
   - URL: `https://<api-domain>/healthz`
   - 期待ステータス: 200
4. **Alert Contacts 設定**
   - Slack Webhook URL（後述 5-4）を Slack 連携として登録
   - メール通知先（運用担当）を登録
5. **モニタとアラートコンタクトの紐付け**
   - 各モニタに上記の Slack / メールコンタクトを紐づける
6. **テスト DOWN シミュレーション**
   - Phase 4 の MON-EXT-02 / MON-NTF-02 を Wave 2 実装タスクで実行する

---

## 5-4. Slack Webhook / メール通知の Secret 注入手順

### Slack Incoming Webhook 取得手順

1. Slack ワークスペースの「App Directory」で `Incoming Webhooks` を追加
2. 通知先チャネル（例: `#ubm-alerts`）を選択
3. 発行された Webhook URL を 1Password Environments の所定項目に格納
4. Secret 名候補: `MONITORING_SLACK_WEBHOOK_URL`

### Cloudflare Secrets 投入（Wave 2 実装タスク実行時）

```bash
# Wave 2 実装タスクで実行する想定。本 Phase では実行しない。
mise exec -- pnpm wrangler secret put MONITORING_SLACK_WEBHOOK_URL --env staging
mise exec -- pnpm wrangler secret put MONITORING_SLACK_WEBHOOK_URL --env production
```

### メール通知

- UptimeRobot 側のアラートコンタクトとして登録するため、Cloudflare Secrets には保管不要
- 配信先メールは 1Password Environments の `monitoring-mail-recipient` 項目に記録

---

## 5-5. 05a runbook への差分追記計画

`outputs/phase-02/runbook-diff-plan.md` を参照しつつ、Wave 2 実装後の最終的な差分追記内容を計画する。

| 対象ファイル（05a 側） | 追記内容（差分） | 追記タイミング |
| --- | --- | --- |
| `observability-matrix.md` | 自動収集メトリクス（WAE 経由）と手動確認項目の対応関係を追記 | Wave 2 実装完了後 |
| `cost-guardrail-runbook.md` | アラート発報時の一次対応手順（Slack 通知受領→ Cloudflare Dashboard 確認→ runbook 該当節へジャンプ）を追記 | Wave 2 実装完了後 |

> 不変条件 1: 05a 成果物は上書きしない。差分は追記方式で行う。

---

## 5-6. 新規作成 / 修正ファイル一覧（識別のみ）

| 種別 | パス候補 | 役割 | 担当 |
| --- | --- | --- | --- |
| 新規 | `apps/api/src/middleware/observability.ts` | リクエスト計装 middleware | Wave 2 実装 |
| 新規 | `apps/api/src/lib/metrics.ts` | WAE writeDataPoint ラッパ | Wave 2 実装 |
| 新規 | `apps/api/src/routes/healthz.ts` | 外形監視向けヘルスチェック | Wave 2 実装 |
| 修正 | `apps/api/src/index.ts` | middleware 登録 | Wave 2 実装 |
| 修正 | `apps/api/wrangler.toml` | `analytics_engine_datasets` 追加 | Wave 2 実装 |
| 新規 | `apps/web/instrumentation.ts` | Next.js 計装フック（必要時） | Wave 2 実装 |
| 修正 | `apps/web/middleware.ts` | エッジ計装（必要時） | Wave 2 実装 |
| 修正 | `apps/web/wrangler.toml` | WAE バインディング（必要時） | Wave 2 実装 |
| 修正 | `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | 差分追記 | Wave 2 実装 |
| 修正 | `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` | 差分追記 | Wave 2 実装 |

---

## 5-7. Wave 2 実装タスクへの引き渡し条件（DoD）

実装計画書の末尾に以下の DoD（Definition of Done）を明記する。

- [ ] Phase 4 の Test ID（MON-EXT-01〜04 / MON-WAE-01〜04 / MON-NTF-01〜04）が全て PASS
- [ ] 計装ポイント INST-API-01〜05 / INST-WEB-01〜02 のうち、Phase 2 で必須指定された項目が実装済み
- [ ] WAE バインディングが staging / production 両環境で機能している
- [ ] UptimeRobot モニタが production / staging に対し稼働している
- [ ] Slack Webhook 経由のアラート到達が確認されている
- [ ] 05a runbook 2 ファイルへの差分追記が PR 化されている

---

## 統合テスト連携

本タスクは spec_created / non_visual の設計タスクであり、この Phase では実装コード・外部監視設定・Secret 投入を実行しない。統合テスト連携は、後段 Wave 2 実装タスクが本 Phase の成果物を入力として実行する。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| 後段 Wave 2 実装タスク | WAE 計装、外形監視設定、通知疎通、D1 / Sheets 失敗検知テスト | 設計・検証観点を定義し、実行は委譲 |
| UT-09 | Sheets→D1 同期失敗検知ルール | UT-09 完了後に閾値とイベント名を再確認 |
| UT-07 | 通知基盤との接続 | 通知チャネル候補として参照し、実装は UT-07 / 後段タスクで確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | AC・不変条件 |
| 必須 | outputs/phase-02/wae-instrumentation-plan.md | 計装ポイントの根拠 |
| 必須 | outputs/phase-02/notification-design.md | 通知設計 |
| 必須 | outputs/phase-02/external-monitor-evaluation.md | 外部監視選定根拠 |
| 必須 | outputs/phase-02/secret-additions.md | 追加 Secret 一覧 |
| 必須 | outputs/phase-02/runbook-diff-plan.md | 05a runbook 差分計画 |
| 必須 | outputs/phase-04/test-plan.md | テスト計画 |
| 参考 | https://developers.cloudflare.com/analytics/analytics-engine/get-started/ | WAE Quick Start |
| 参考 | https://api.slack.com/messaging/webhooks | Slack Incoming Webhooks |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | Wave 2 実装タスク向け実装計画書（計装ポイント・wrangler.toml 差分・runbook 化された設定手順・DoD） |
| メタ | artifacts.json | phase-05 を completed に更新 |

---

## 完了条件

- [ ] `outputs/phase-05/implementation-plan.md` が作成されている
- [ ] 計装ポイント INST-API-01〜05 と INST-WEB-01〜02 が識別子レベルで列挙されている
- [ ] wrangler.toml への `analytics_engine_datasets` 追加が擬似 TOML で示されている
- [ ] UptimeRobot 設定手順が Runbook 形式で記述されている
- [ ] Slack Webhook 取得 / Cloudflare Secrets 投入手順が記述されている
- [ ] 05a runbook 2 ファイルへの差分追記計画が含まれている
- [ ] 新規作成 / 修正ファイル一覧が完備している
- [ ] DoD（Wave 2 実装の完了基準）が明記されている
- [ ] 実コードを書いていないこと（不変条件 5）が確認できる

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-05 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 6（異常系検証計画）
- 引き継ぎ事項:
  - implementation-plan.md の計装ポイント識別子（INST-*）と Test ID（MON-*）は Phase 6 の異常系マトリクスでも参照される
  - 5-5 の runbook 差分計画は Phase 6 の障害復旧シナリオと突き合わせる
  - DoD のうち Phase 6 で深掘りすべき検出ルールがあれば追記する
- ブロック条件: Phase 4 の事前確認チェックリストに未解消の失敗項目がある場合
