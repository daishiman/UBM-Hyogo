# Phase 4 成果物: テスト計画 (test-plan.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-08 モニタリング/アラート設計 |
| Phase | 4 / 13（テスト計画・事前検証） |
| 作成日 | 2026-04-27 |
| 状態 | completed |
| 種別 | 設計タスク（non_visual） — 本書は計画と擬似コマンドの記録に留める |

---

## 1. 本テスト計画の位置づけ

UT-08 は設計タスクであり、本タスク内で実コードを書かない。
本書は「監視設計が現実に機能するか」を検証するための **3層検証戦略** を Test ID 単位で固定する。
実コマンドの実行責務は Wave 2 実装タスクが負う。

| 検証層 | 目的 | 対応 AC | 成功基準 | 失敗時差し戻し先 |
| --- | --- | --- | --- | --- |
| 外部監視疎通 | UptimeRobot / Cronitor が公開エンドポイントを観測できる | AC-4 | MON-EXT-01〜04 全 PASS | phase-02/external-monitor-evaluation.md |
| WAE 書き込み | 計装イベントが WAE に到達し、SQL API で読み出せる | AC-1 / AC-5 / AC-7 | MON-WAE-01〜04 全 PASS | phase-02/wae-instrumentation-plan.md |
| 通知到達 | Slack / メールに WARNING / CRITICAL が届く | AC-3 / AC-11 | MON-NTF-01〜04 全 PASS | phase-02/notification-design.md / secret-additions.md |

---

## 2. 検証層 1: 外部監視疎通検証（MON-EXT）

### MON-EXT-01: UptimeRobot HTTPS 監視（公開トップ）

| 項目 | 内容 |
| --- | --- |
| 対象 | `https://<production-domain>/`（Web Production） |
| 検証内容 | UptimeRobot HTTP(s) 監視 5 分間隔で 200 を観測 |
| 擬似コマンド | UptimeRobot Dashboard → Monitor `UBM-Hyogo Web Production` の Status を 24h 観測 |
| 期待結果 | Status `Up`（連続 24h、Uptime ≥ 99%） |
| 関連 AC | AC-4 |
| 関連設計 | phase-02/external-monitor-evaluation.md |

### MON-EXT-02: UptimeRobot 障害検知（DOWN 検知）

| 項目 | 内容 |
| --- | --- |
| 対象 | 5xx を強制的に返すテストエンドポイントを staging に一時設置 |
| 検証内容 | 連続 2 回（10 分）失敗で WARNING、連続 4 回（20 分）で CRITICAL |
| 擬似コマンド | staging Worker に 500 を返すルートを deploy → UptimeRobot ダッシュボードで DOWN 検知時刻を記録 |
| 期待結果 | DOWN 検知後、Slack `#ubm-alerts-staging` に通知到達（10 分以内） |
| 関連 AC | AC-2 / AC-4 |
| 関連設計 | phase-02/alert-threshold-matrix.md（外形連続 2 回 / 4 回） |

### MON-EXT-03: UptimeRobot 復旧検知（UP 復帰）

| 項目 | 内容 |
| --- | --- |
| 対象 | MON-EXT-02 の状態から正常応答へ復旧 |
| 検証内容 | 復旧後 5〜10 分以内に UP 通知発火 |
| 擬似コマンド | テストエンドポイントを撤去 → UptimeRobot で UP 復帰確認 |
| 期待結果 | Slack へ UP（復旧）通知到達。重複通知なし |
| 関連 AC | AC-3 / AC-4 |

### MON-EXT-04: API ヘルスチェック (`/healthz`)

| 項目 | 内容 |
| --- | --- |
| 対象 | `https://<api-domain>/healthz` |
| 検証内容 | 200 と JSON `{"ok":true}` を 5 分間隔で観測 |
| 擬似コマンド | `curl -i https://<api-domain>/healthz` ／ UptimeRobot keyword monitor で `"ok":true` を期待 |
| 期待結果 | 24h 連続 PASS、Uptime ≥ 99% |
| 関連 AC | AC-4 / AC-7 |

---

## 3. 検証層 2: WAE 書き込み検証（MON-WAE）

### MON-WAE-01: バインディング解決

| 項目 | 内容 |
| --- | --- |
| 対象 | `apps/api/wrangler.toml` の `analytics_engine_datasets` |
| 検証内容 | `wrangler dev --env staging` 起動時に `env.WAE_DATASET` が解決される |
| 擬似コマンド | `mise exec -- pnpm wrangler dev --env staging`（ログにバインディング名表示） |
| 期待結果 | バインディングエラーなし、`writeDataPoint` 呼出しが TypeError を出さない |
| 関連 AC | AC-5 |
| 関連 FC | FC-01 |

### MON-WAE-02: 計装イベント書き込み (api.request / api.error)

| 項目 | 内容 |
| --- | --- |
| 対象 | 全 API リクエスト経路（observability middleware 経由） |
| 検証内容 | リクエスト 1 件ごとに `writeDataPoint` 1 行（初期 100% sampling） |
| 擬似コマンド | `curl https://<staging-api>/v1/...` を 100 回 → Cloudflare GraphQL で `SELECT count() FROM ubm_hyogo_observability WHERE blob1='api.request'` |
| 期待結果 | 100 行（誤差±5%以内）が観測される |
| 関連 AC | AC-1 / AC-5 |
| 関連 FC | FC-02 |

### MON-WAE-03: sampling 動作確認

| 項目 | 内容 |
| --- | --- |
| 対象 | 100% → 10% sampling へ切替時の収束 |
| 検証内容 | 1000 リクエストで約 100 行に収束 |
| 擬似コマンド | sampling 率変更後、負荷スクリプトで 1000 リクエスト送信 → SQL で行数集計 |
| 期待結果 | 100 ± 30 行（統計的揺らぎを許容） |
| 関連 AC | AC-5 |

### MON-WAE-04: エラーイベント分離 / 失敗集計

| 項目 | 内容 |
| --- | --- |
| 対象 | `api.error` / `d1.query.fail` / `cron.sync.end{status='fail'}` |
| 検証内容 | エラー時のみ `error=1` blob を書き、SQL で 5xx 率を集計可能 |
| 擬似コマンド | `SELECT SUM(IF(blob2='error',1,0))/COUNT(*) AS error_rate FROM ubm_hyogo_observability WHERE blob1='api.request' AND timestamp > NOW()-INTERVAL '5' MINUTE` |
| 期待結果 | エラーレートが小数で取得でき、閾値（1% / 5%）と比較可能 |
| 関連 AC | AC-1 / AC-7 |
| 関連 FC | FC-09 |

---

## 4. 検証層 3: 通知到達検証（MON-NTF）

### MON-NTF-01: Slack Webhook 疎通

| 項目 | 内容 |
| --- | --- |
| 対象 | `MONITORING_SLACK_WEBHOOK_URL_STAGING` / `_PROD` / `_DEPLOY` |
| 検証内容 | `curl -X POST -d '{"text":"test"}' "$URL"` が 200 を返す |
| 擬似コマンド | 各 Webhook URL に対し curl 実行（手動、Wave 2 実装時） |
| 期待結果 | 各 URL が 200 を返し、対応 Slack チャネルに `test` が投稿 |
| 関連 AC | AC-3 / AC-11 |
| 関連 FC | FC-03 / FC-08 |

### MON-NTF-02: UptimeRobot → Slack 連携

| 項目 | 内容 |
| --- | --- |
| 対象 | UptimeRobot Alert Contact (Slack) |
| 検証内容 | DOWN 検知時に Slack へ通知が届く |
| 擬似コマンド | MON-EXT-02 と連動して観測 |
| 期待結果 | DOWN / UP の双方が Slack 着信 |
| 関連 AC | AC-3 / AC-4 |

### MON-NTF-03: メール通知到達

| 項目 | 内容 |
| --- | --- |
| 対象 | UptimeRobot Alert Contact (Email) |
| 検証内容 | DOWN 通知が運用担当メールへ到達（迷惑メール含めて確認） |
| 擬似コマンド | MON-EXT-02 と連動 |
| 期待結果 | 受信ボックスに DOWN メール到達。SPF / DKIM 不整合がないこと |
| 関連 AC | AC-3 |
| 関連 FC | FC-04 |

### MON-NTF-04: 通知抑止（重複防止 / アラート疲れ）

| 項目 | 内容 |
| --- | --- |
| 対象 | 同一インシデントの連続発火 |
| 検証内容 | 5 分間隔の中で重複通知を抑止 |
| 擬似コマンド | UptimeRobot Notification 設定の `Send notifications every X minutes` を確認 |
| 期待結果 | 同種アラートが 5 分以内に 2 回以上発火しない |
| 関連 AC | AC-2 / AC-3（不変条件 3：アラート疲れ抑止） |
| 関連 FC | FC-06 |

---

## 5. テスト ID 横断サマリー

| 検証層 | Test ID 数 | 主担当 | 実行タイミング |
| --- | --- | --- | --- |
| 外部監視（MON-EXT） | 4 | Wave 2 実装担当（運用） | UptimeRobot / Cronitor 設定後の即日 + 7 日後 |
| WAE 書き込み（MON-WAE） | 4 | Wave 2 実装担当（apps/api） | 計装デプロイ後 24h 以内 |
| 通知到達（MON-NTF） | 4 | Wave 2 実装担当（運用） | Secret 投入後の即日 |

合計 12 Test ID。すべて Wave 2 実装タスクの DoD と紐づく（Phase 5 §5-7）。

---

## 6. 設計の自己整合性検証（本 Phase で完結）

本 Phase で実機テストはできないため、以下の **設計の自己整合性** をレビュー観点として固定する。
Phase 7 AC トレーサビリティと Phase 9 品質保証で再確認する。

| 観点 | 確認内容 | 状態 |
| --- | --- | --- |
| 整合 1 | metric-catalog.md の 6 イベントが wae-instrumentation-plan.md と一致 | [x] |
| 整合 2 | alert-threshold-matrix.md の閾値が monitoring-design.md / failure-detection-rules.md で参照可能 | [x] |
| 整合 3 | secret-additions.md の Secret 名が notification-design.md の投入手順と一致 | [x] |
| 整合 4 | external-monitor-evaluation.md の選定（UptimeRobot 一次 / Cronitor サブ）が design-review.md GO 判定の前提と一致 | [x] |
| 整合 5 | runbook-diff-plan.md が 05a 成果物（observability-matrix.md / cost-guardrail-runbook.md）の追記方式（不変条件 1）に従う | [x] |

---

## 7. Wave 2 実装時のテスト観点引き継ぎ

| 引き継ぎ項目 | 内容 |
| --- | --- |
| Test ID 実行環境 | staging で全 Test ID を実行し、PASS を確認後 production へ展開 |
| ログ保管 | 各 Test ID の擬似コマンド実行結果を Wave 2 実装タスクの phase-04 / phase-09 に記録 |
| 失敗時の差し戻し | 各層の「失敗時差し戻し先」（§1）に従い Phase 2 設計を改訂 |
| 無料枠監視 | MON-WAE-02 / 03 実行時に 05a `cost-guardrail-runbook.md` の消費量を併記 |
| 段階導入 | CRITICAL 通知は MON-NTF 系の PASS 後に解禁（不変条件 3） |

---

## 8. 参照

- docs/30-workflows/ut-08-monitoring-alert-design/index.md
- outputs/phase-02/monitoring-design.md
- outputs/phase-02/metric-catalog.md
- outputs/phase-02/alert-threshold-matrix.md
- outputs/phase-02/wae-instrumentation-plan.md
- outputs/phase-02/notification-design.md
- outputs/phase-02/external-monitor-evaluation.md
- outputs/phase-02/secret-additions.md
- outputs/phase-03/design-review.md
- outputs/phase-04/pre-verify-checklist.md
