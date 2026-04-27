# UT-08 Phase 2: 監視設計総合まとめ (AC-8)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-8（AC-1〜AC-7・AC-11 を束ねる） |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 不変条件 | 1〜5（[Phase 1 §8](../phase-01/requirements.md)） |

UT-08 の Phase 2 設計成果物を 1 か所に集約する総合まとめ。Wave 2 実装タスク・Phase 3 レビュー・運用引き継ぎの起点として本書を使用する。

---

## 1. システム俯瞰

```
+----------------------+        +-----------------------------+
|  Cloudflare Pages    |        | Cloudflare Workers (apps/web)|
|  (静的 / Next.js SSR) |        |                              |
+----------+-----------+        +--------------+---------------+
           |                                   |
           |  request                          |  request
           v                                   v
+----------+-----------------------------------+---------------+
|              Cloudflare Workers (apps/api / Hono)            |
|  + WAE 計装 (api.request / api.error / d1.query.fail / cron) |
+----------+-----------------------------------+---------------+
           |                                   |
           v                                   v
+----------+-----------+        +--------------+---------------+
|  Cloudflare D1       |        |  Cron Trigger (Sheets→D1)    |
|  (binding 経由のみ)  |        |  + WAE 計装 (cron.sync.*)    |
+----------------------+        +------------------------------+

外側:
- UptimeRobot (5min)  ----> 公開エンドポイント死活監視 ----> Slack/Email
- Cloudflare Analytics + WAE GraphQL ---> アラートワーカー (Cron 1min) ---> Slack/Email
- 通知: Slack #alerts-prod / #alerts-staging + Email (CRITICAL のみ)
```

監視レイヤは 3 層で構成:

1. 内部メトリクス（Cloudflare Analytics + WAE 計装）
2. 外部死活監視（UptimeRobot）
3. 通知（Slack 一次 + Email サブ、Secret は 1Password Environments）

---

## 2. AC とドキュメントの対応

| AC | ドキュメント | 主な確定事項 |
| --- | --- | --- |
| AC-1 | [metric-catalog.md](./metric-catalog.md) | Workers / Pages / D1 / Cron / 外形の全 20 メトリクス、自動化区分 |
| AC-2 | [alert-threshold-matrix.md](./alert-threshold-matrix.md) | WARNING/CRITICAL 閾値、運用フェーズ別方針 |
| AC-3 | [notification-design.md](./notification-design.md) | Slack 一次 + Email サブ、ペイロード仕様 |
| AC-4 | [external-monitor-evaluation.md](./external-monitor-evaluation.md) | UptimeRobot 採用、Cronitor サブ候補 |
| AC-5 | [wae-instrumentation-plan.md](./wae-instrumentation-plan.md) | 6 イベント、サンプリング初期 100% |
| AC-6 | [runbook-diff-plan.md](./runbook-diff-plan.md) | 05a 上書き禁止、追記項目を本書に集約 |
| AC-7 | [failure-detection-rules.md](./failure-detection-rules.md) | D1 失敗 / 同期失敗 10 ルール |
| AC-11 | [secret-additions.md](./secret-additions.md) | 7 Secret/Variable、1Password 起点 |

---

## 3. 運用フェーズ別の運用方針

### 初期運用（本番リリース後 2〜3 ヶ月）

- 通知: WARNING のみ Slack。CRITICAL は記録のみ
- 計装: WAE 全イベント 100% sampling
- 月次レビュー: 誤報率 / data points 累計 / monitor 数を確認
- 目的: 閾値の実値学習、誤報パターンの収集

### 安定運用後

- 通知: WARNING / CRITICAL 双方有効。CRITICAL は Slack + Email
- 計装: data points 70% 到達で `api.request` を 10% sampling へ切替
- 月次レビュー: 閾値見直し（誤報率 > 5% は緩和、未検知は厳格化）

切替判断基準: WARNING 誤報率 1 件 / 月以下が 30 日連続。

---

## 4. 05a との責務境界の最終結論

| 項目 | 05a の責務 | UT-08 の責務 |
| --- | --- | --- |
| 観測点定義（手動） | 正本（observability-matrix.md） | 上書き禁止 |
| 観測点定義（自動化に昇格） | （なし） | metric-catalog.md が正本 |
| 月次手動チェック | 既存維持 | 月次自動アラート集計を追加（runbook-diff-plan に追記計画として保持） |
| 閾値定義 | （手動判断） | alert-threshold-matrix.md（自動アラート用） |
| Secret ローテーション手順 | （なし） | secret-additions.md / runbook-diff-plan §3.2 |
| アラート受信時一次対応 | （なし） | runbook-diff-plan §3.1（追記計画） |

UT-08 は 05a の本体ファイルに直接書き込まず、追記計画として `runbook-diff-plan.md` に集約する（不変条件 1）。実際の 05a runbook への追記は Phase 12 注記 + Wave 2 末尾 PR で実施する。

---

## 5. Wave 2 実装タスクへの引き渡し（中身一覧）

| 実装項目 | 入力ドキュメント |
| --- | --- |
| WAE 計装コード（apps/api） | wae-instrumentation-plan.md |
| アラートワーカー（Cron 1min） | failure-detection-rules.md, alert-threshold-matrix.md |
| Slack Webhook 配信 | notification-design.md |
| Secret 投入（1Password → Cloudflare） | secret-additions.md |
| UptimeRobot Monitor 設定 | external-monitor-evaluation.md |
| 月次レビュー手順整備 | alert-threshold-matrix.md §5, runbook-diff-plan.md §3.3 |

---

## 6. 未決事項 / Phase 3 レビューに渡す論点

| 未決事項 | 影響 | Phase 3 で決める |
| --- | --- | --- |
| WAE 無料枠の正確な保存期間 / data points 上限 | サンプリング設計の詳細 | 公式再確認結果を反映、不足なら Phase 2 へ MINOR 差し戻し |
| UptimeRobot 5 min 間隔の SLA 許容 | 監視粒度 | レビュー観点 3 で確認 |
| 05a 担当との責務境界合意 | runbook の二重管理回避 | レビュー観点 2 で確認 |
| `auth.fail` イベントの採否 | UT-13 認証実装との整合性 | UT-13 仕様確認後に決定（MINOR） |
| Cron 間隔の確定（UT-09 連携） | 連続失敗判定窓 | UT-09 完了後に Phase 4 で再確認 |

---

## 7. 代替案棄却記録（Phase 3 入力）

| 代替案 | 棄却理由 |
| --- | --- |
| 有料 APM（Datadog / NewRelic） | 不変条件 2（無料プラン限定）違反 |
| Sentry 有料 | 同上 |
| Cloudflare Health Checks (Pro) | 同上 |
| 自前監視サーバー | 運用コスト過大、Wave 2 範囲外 |
| 外部監視のみ（WAE 計装なし） | 内部失敗（D1 / Cron）検知不可 |

---

## 8. 完了条件チェック（Phase 2）

- [x] 9 ドキュメント全て artifacts.json と一致するパスに配置済み
- [x] 各ドキュメント冒頭に対応 AC を明記済み
- [x] monitoring-design.md（本書）が他 8 ドキュメントへリンク済み
- [x] runbook-diff-plan.md が 05a 上書き禁止方針として記述済み
- [x] alert-threshold-matrix.md に「初期 WARNING / CRITICAL 段階導入」反映済み
- [x] secret-additions.md の全 Secret が 1Password Environments 起点で記述済み
- [x] Phase 3 レビューへの引き継ぎ事項（§6 / §7）明記済み
