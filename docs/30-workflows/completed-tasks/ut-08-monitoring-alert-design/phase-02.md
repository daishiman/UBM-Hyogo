# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | モニタリング/アラート設計 (UT-08) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 で確定した要件・論点をもとに、index.md の AC-1〜AC-8・AC-11 に対応する 9 種類の設計ドキュメントを作成する。
本 Phase は設計成果物のみを出力し、実装コードは含めない。Wave 2 実装タスクへの引き渡しを意識し、メトリクス名・閾値・通知先・Secret 名・サンプリング率まで具体的に確定させる。

## 真の論点（Phase 1 から継承）

1. 05a 責務境界（自動化に昇格する観測点 / 手動据え置き観測点）の確定
2. Cloudflare Analytics / WAE 無料プラン制約下での計装計画
3. WARNING 中心初期運用 + CRITICAL 段階導入によるアラート疲れ抑止

## 依存境界

| 種別 | 対象 | 本 Phase での扱い |
| --- | --- | --- |
| 上流 | 05a observability-matrix.md | 監視対象メトリクスの一次ソース。差分追記計画として参照 |
| 上流 | 05a cost-guardrail-runbook.md | 無料枠ガードレール手動 runbook。差分追記計画として参照 |
| 上流 | UT-09 同期ジョブ仕様 | 失敗検知ルールの主要対象 |
| 下流 | Wave 2 実装タスク | 計装コード・外形監視設定・通知設定の実装入力 |
| 下流 | UT-07 通知基盤 | 通知チャネル（Slack Webhook / メール）の連携先 |

## 価値とコスト

- **価値**: AC-1〜AC-8・AC-11 に対応する 9 ドキュメントを揃え、Wave 2 実装タスクが迷いなく着手できる状態を作る。
- **コスト**: ドキュメント作成量が大きいが、各成果物は短文テーブル中心で重複を排除する。05a 成果物との重複を避けるため差分追記計画に集約する。

## 4 条件評価

| 条件 | 問い | 判定基準 |
| --- | --- | --- |
| 価値性 | 9 ドキュメントが Wave 2 実装の不確実性を実質的に下げるか | 各成果物に Wave 2 で参照する具体項目（メトリクス名・閾値・Secret 名）が含まれていること |
| 実現性 | 無料プランの範囲で WAE 計装・外部監視・通知が成立するか | WAE サンプリング率・UptimeRobot 5 分間隔・Slack Webhook 単一の組合せが成立すること |
| 整合性 | 05a 成果物との二重管理を避ける構造になっているか | runbook-diff-plan.md が 05a を上書きせず差分追記方針として記述されること |
| 運用性 | アラート閾値が初期 WARNING 中心、CRITICAL 段階導入で運用可能か | alert-threshold-matrix.md に運用フェーズ別の閾値（初期/安定運用後）が併記されること |

## 設計成果物一覧（AC との対応）

| 成果物 | AC | 概要 |
| --- | --- | --- |
| outputs/phase-02/metric-catalog.md | AC-1 | Workers / Pages / D1 / Cron の自動化対象メトリクス一覧 |
| outputs/phase-02/alert-threshold-matrix.md | AC-2 | WARNING / CRITICAL 閾値マトリクス（根拠付き） |
| outputs/phase-02/notification-design.md | AC-3 | メール vs Slack Webhook 通知設計と Secret 取り扱い |
| outputs/phase-02/external-monitor-evaluation.md | AC-4 | 外部監視ツール（UptimeRobot 等）評価 |
| outputs/phase-02/wae-instrumentation-plan.md | AC-5 | WAE 計装計画（イベント名 / フィールド / sampling） |
| outputs/phase-02/runbook-diff-plan.md | AC-6 | 05a runbook 差分追記計画 |
| outputs/phase-02/failure-detection-rules.md | AC-7 | D1 クエリ失敗・Sheets→D1 同期失敗の検知ルール |
| outputs/phase-02/monitoring-design.md | AC-8 | 監視設計の総合まとめ（上記 7 つを束ねる） |
| outputs/phase-02/secret-additions.md | AC-11 | 1Password Environments で管理する追加 Secret 一覧 |

## metric-catalog.md 設計（AC-1）

### Workers メトリクス（候補）

| メトリクス名 | 取得元 | 単位 | 用途 |
| --- | --- | --- | --- |
| `workers.requests` | Cloudflare Analytics | req/min | リクエスト数監視 |
| `workers.errors_5xx` | Cloudflare Analytics | count | エラー率算出 |
| `workers.cpu_time_p99` | Cloudflare Analytics | ms | CPU 上限超過検知 |
| `workers.duration_p95` | Cloudflare Analytics | ms | レスポンスタイム監視 |
| `workers.subrequests` | Cloudflare Analytics | count | 無料枠消費率 |

### Pages メトリクス

| メトリクス名 | 取得元 | 単位 | 用途 |
| --- | --- | --- | --- |
| `pages.builds_failed` | Cloudflare Pages | count | デプロイ失敗検知 |
| `pages.requests` | Cloudflare Analytics | req/min | アクセス数把握 |

### D1 メトリクス

| メトリクス名 | 取得元 | 単位 | 用途 |
| --- | --- | --- | --- |
| `d1.queries` | Cloudflare D1 | count/day | 無料枠（500 万 row reads/day）消費率 |
| `d1.row_reads` | Cloudflare D1 | count/day | 主要無料枠 |
| `d1.row_writes` | Cloudflare D1 | count/day | 書込み無料枠（10 万/day） |
| `d1.query_failures` | WAE 計装 | count | 失敗検知 |

### Cron メトリクス

| メトリクス名 | 取得元 | 単位 | 用途 |
| --- | --- | --- | --- |
| `cron.invocations` | WAE 計装 | count | 起動確認 |
| `cron.failures` | WAE 計装 | count | 同期失敗検知（UT-09 連携） |
| `cron.duration_ms` | WAE 計装 | ms | 実行時間監視 |

## alert-threshold-matrix.md 設計（AC-2）

| メトリクス | WARNING（初期運用） | CRITICAL（段階導入） | 根拠 |
| --- | --- | --- | --- |
| `workers.errors_5xx 率` | 1% / 5min | 5% / 5min | アラート疲れ抑止のため初期は WARNING のみ |
| `workers.subrequests 月次累計` | 無料枠 70% | 無料枠 90% | 無料枠超過予防 |
| `d1.row_reads 日次累計` | 70% | 90% | 無料枠 500 万/day 基準 |
| `d1.row_writes 日次累計` | 70% | 90% | 無料枠 10 万/day 基準 |
| `cron.failures` | 1 回 / 24h | 連続 2 回 | 同期ジョブ失敗の早期検知 |
| 外形監視 ダウン | 連続 2 回 (10 分) | 連続 4 回 (20 分) | UptimeRobot 5 分間隔 |

## notification-design.md 設計（AC-3）

| 観点 | メール | Slack Incoming Webhook |
| --- | --- | --- |
| 即時性 | 中 | 高 |
| 履歴可視性 | 低 | 高（チャネル履歴） |
| Secret 数 | SMTP 認証情報 | Webhook URL 1 件 |
| 推奨用途 | バックアップ通知先 | 一次通知先 |

**Secret 取り扱い**: Slack Webhook URL は 1Password Environments に保存し、`wrangler secret put MONITORING_SLACK_WEBHOOK_URL --env <env>` で各環境に注入。コードへハードコード禁止。

## external-monitor-evaluation.md 設計（AC-4）

| ツール | 無料プラン上限 | 監視間隔 | HTTPS | 通知 | 採否 |
| --- | --- | --- | --- | --- | --- |
| UptimeRobot | 50 monitors | 5 min | 可 | メール / Webhook | 採用候補 |
| BetterStack (Better Uptime) | 10 monitors | 3 min | 可 | メール / Slack | 候補 |
| Cronitor | 5 monitors | 1 min | 可 | メール / Slack | サブ候補 |
| Cloudflare Health Checks | Pro 以上 | - | - | - | 不採用（無料外） |

## wae-instrumentation-plan.md 設計（AC-5）

| イベント名 | 発生箇所 | フィールド (blob/double/index) | sampling |
| --- | --- | --- | --- |
| `api.request` | apps/api Hono middleware | path / status / latency_ms / colo | 100% |
| `api.error` | apps/api error handler | path / error_class / message_redacted | 100% |
| `cron.sync.start` | Sheets→D1 同期 cron | job_id / started_at | 100% |
| `cron.sync.end` | 同上 | job_id / status / duration_ms / rows | 100% |
| `d1.query.fail` | D1 wrapper | query_kind / error_class | 100% |

無料枠考慮: 100% sampling でも UBM 兵庫支部会の想定 RPS では WAE 無料枠（25 億 data points/月相当）に十分収まる前提。Phase 1 で再確認した制約に従い、超過リスクが見えた段階で `api.request` を 10% sampling へ切替。

## runbook-diff-plan.md 設計（AC-6）

| 05a 成果物 | UT-08 追記範囲 | 上書き禁止項目 |
| --- | --- | --- |
| observability-matrix.md | 自動化に昇格したメトリクスへ「自動監視あり」マーカ追加、UT-08 metric-catalog.md へのリンク | 既存の手動観測手順 |
| cost-guardrail-runbook.md | アラート受信時の対応手順（Slack 通知 → 確認 → 一次対応）を追記 | 既存の月次手動チェック手順 |

差分は別ファイルとして UT-08 outputs に保持し、05a 成果物は変更しない。Phase 12 で 05a index に「UT-08 で追記された差分計画あり」と注記する。

## failure-detection-rules.md 設計（AC-7）

| 失敗対象 | 検知ロジック | 通知 |
| --- | --- | --- |
| D1 クエリ失敗 | WAE `d1.query.fail` イベントが 5 分間に 3 件以上 | WARNING |
| Sheets→D1 同期失敗 | `cron.sync.end` の status=failed が 24h で 1 件 | WARNING、連続 2 回で CRITICAL |
| Sheets API 認証失敗 | `api.error` の error_class=`SheetsAuthError` が 1 件 | WARNING |
| 外形監視ダウン | UptimeRobot HTTP 非 2xx 連続 2 回 | WARNING |

## secret-additions.md 設計（AC-11）

| Secret 名 | 用途 | 配置先 |
| --- | --- | --- |
| `MONITORING_SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL | 1Password Environments → Cloudflare Secrets (staging/production) |
| `UPTIMEROBOT_API_KEY` (任意) | UptimeRobot API 経由のモニター管理 | 1Password Environments のみ（CI でのみ参照） |
| `ALERT_EMAIL_TO` (非機密) | バックアップ通知先メール | GitHub Variables または wrangler.toml の `[vars]` |

## monitoring-design.md 設計（AC-8）

総合まとめとして以下を含む。

- システム俯瞰図（Cloudflare Workers / Pages / D1 / Cron / 外部監視 / 通知の関係）
- AC-1〜AC-7・AC-11 各成果物へのリンク
- 運用フェーズ（初期 / 安定運用後）別のアラート方針
- 05a との責務境界の最終結論

## 実行タスク

- [ ] Phase 1 成果物を読み、論点と CONDITIONAL の解消条件を確認する
- [ ] 9 ドキュメント（metric-catalog / alert-threshold-matrix / notification-design / external-monitor-evaluation / wae-instrumentation-plan / runbook-diff-plan / failure-detection-rules / secret-additions / monitoring-design）を順に作成する
- [ ] 各ドキュメントが対応する AC（AC-1〜AC-8・AC-11）を成果物冒頭に明記する
- [ ] 05a 成果物のパスへの相対リンクが正しいことを確認する
- [ ] monitoring-design.md が他 8 ドキュメントを束ねていることを確認する
- [ ] artifacts.json の phase-2 と成果物パスが完全一致していることを確認する
- [ ] Phase 3 レビューへの引き継ぎ事項（未決事項・代替案棄却理由）を明記する

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
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/phase-01.md | Phase 1 成果物（要件・AC・既存資産インベントリ） |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | AC・スコープの正本 |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/artifacts.json | 成果物パスの正本 |
| 必須 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md | observability-matrix の差分追記元 |
| 参考 | https://developers.cloudflare.com/analytics/analytics-engine/ | WAE 計装仕様 |
| 参考 | https://uptimerobot.com/pricing/ | UptimeRobot 無料プラン仕様 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Secret 配置手順 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/monitoring-design.md | 監視設計書（総合まとめ、AC-8） |
| ドキュメント | outputs/phase-02/metric-catalog.md | メトリクスカタログ（AC-1） |
| ドキュメント | outputs/phase-02/alert-threshold-matrix.md | アラート閾値マトリクス（AC-2） |
| ドキュメント | outputs/phase-02/notification-design.md | 通知設計（AC-3） |
| ドキュメント | outputs/phase-02/external-monitor-evaluation.md | 外部監視ツール評価（AC-4） |
| ドキュメント | outputs/phase-02/wae-instrumentation-plan.md | WAE 計装計画（AC-5） |
| ドキュメント | outputs/phase-02/runbook-diff-plan.md | 05a runbook 差分計画（AC-6） |
| ドキュメント | outputs/phase-02/failure-detection-rules.md | 失敗検知ルール（AC-7） |
| ドキュメント | outputs/phase-02/secret-additions.md | 追加 Secret 一覧（AC-11） |
| メタ | artifacts.json | phase-02 を completed に更新 |

## 完了条件

- [ ] 9 ドキュメント全てが artifacts.json と一致するパスに配置されている
- [ ] 各ドキュメントが対応する AC を冒頭に明示している
- [ ] monitoring-design.md が他 8 ドキュメントへのリンクを持つ
- [ ] runbook-diff-plan.md が 05a 成果物を上書きしない方針として記述されている
- [ ] alert-threshold-matrix.md に「初期 WARNING 中心 / CRITICAL 段階導入」の運用方針が反映されている
- [ ] secret-additions.md の全 Secret が 1Password Environments で管理可能な形で記述されている
- [ ] Phase 3 レビューへの引き継ぎ事項が明記されている

## タスク 100% 実行確認【必須】

- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（WAE 仕様変更 / UptimeRobot 無料プラン縮小 / 05a 成果物変更）の影響範囲を記録済み
- artifacts.json の phase-02 を completed に更新

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: 9 ドキュメント全て、未決事項一覧、代替案棄却理由をレビュー入力として渡す
- ブロック条件: 9 ドキュメントのいずれかが未作成、または artifacts.json と齟齬がある場合は Phase 3 に進まない
