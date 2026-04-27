# UT-08 Phase 2: メトリクスカタログ (AC-1)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-1 |
| 親ドキュメント | [monitoring-design.md](./monitoring-design.md) |
| 上流参照 | `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md`（observability-matrix） |

Workers / Pages / D1 / Cron の自動化対象メトリクスをカタログ化する。各行は「メトリクス名 / 取得元 / 単位 / 用途 / 自動化区分」を最低限備える。05a で既に「手動観測」されているメトリクスについては「自動化区分」列で明示し、本タスクで自動化に昇格するものを区別する。

---

## 1. Workers メトリクス（apps/api / apps/web の Workers ランタイム）

| メトリクス名 | 取得元 | 単位 | 用途 | 自動化区分 |
| --- | --- | --- | --- | --- |
| `workers.requests` | Cloudflare Analytics | req/min | リクエスト総量・無料枠（100,000/day）消費 | 自動化に昇格 |
| `workers.errors_5xx` | Cloudflare Analytics | count/5min | エラー率算出（`workers.errors_5xx / workers.requests`） | 自動化に昇格 |
| `workers.errors_4xx` | Cloudflare Analytics | count/5min | 異常クライアント傾向の把握（参考） | 手動据え置き |
| `workers.cpu_time_p99` | Cloudflare Analytics | ms | 無料枠 CPU 上限（10ms）超過検知 | 自動化に昇格 |
| `workers.duration_p95` | Cloudflare Analytics | ms | レスポンスタイム監視（壁時計） | 自動化に昇格 |
| `workers.subrequests` | Cloudflare Analytics | count/req | 50/req 無料枠の超過予防 | 自動化に昇格 |
| `workers.script_errors` | Cloudflare Analytics | count | 例外スロー総数（throttle/exception） | 自動化に昇格 |

備考: `workers.requests` は WAE で `api.request` イベント数として補足計装する（`wae-instrumentation-plan.md` 参照）。

## 2. Pages メトリクス

| メトリクス名 | 取得元 | 単位 | 用途 | 自動化区分 |
| --- | --- | --- | --- | --- |
| `pages.builds_total` | Cloudflare Pages | count/月 | 月次 500 builds 無料枠消費 | 手動据え置き（月 1 回 Dashboard チェック） |
| `pages.builds_failed` | Cloudflare Pages | count | デプロイ失敗検知 | 自動化に昇格（GitHub Actions 連携で代替検知も可） |
| `pages.requests` | Cloudflare Analytics | req/min | アクセス数把握 | 手動据え置き（無料無制限） |

## 3. D1 メトリクス（apps/api 経由のみアクセス、不変条件 5）

| メトリクス名 | 取得元 | 単位 | 用途 | 自動化区分 |
| --- | --- | --- | --- | --- |
| `d1.row_reads` | Cloudflare D1 Dashboard | count/day | 無料枠 5,000,000/day 消費率 | 自動化に昇格（Dashboard ポーリング or WAE 補足） |
| `d1.row_writes` | Cloudflare D1 Dashboard | count/day | 無料枠 100,000/day 消費率 | 自動化に昇格 |
| `d1.storage_mb` | Cloudflare D1 Dashboard | MB | 無料枠 5GB | 手動据え置き（月 1 回チェック） |
| `d1.query_failures` | WAE 計装 (`d1.query.fail`) | count/5min | クエリ失敗の早期検知 | 自動化に昇格（UT-08 新規） |
| `d1.query_latency_p95` | WAE 計装 (`api.request` の sub-event) | ms | スロークエリ把握（任意） | 自動化に昇格（任意） |

注: D1 はクエリ単位の実行時間を Workers ログに自動出力しない。`apps/api` の D1 wrapper で `console.log` または WAE への明示的書込を行う（実装は Wave 2）。

## 4. Cron メトリクス（Sheets→D1 同期ジョブ等、UT-09 連携）

| メトリクス名 | 取得元 | 単位 | 用途 | 自動化区分 |
| --- | --- | --- | --- | --- |
| `cron.invocations` | WAE 計装 (`cron.sync.start`) | count | 起動確認（Cron が走っているか） | 自動化に昇格 |
| `cron.failures` | WAE 計装 (`cron.sync.end` status=failed) | count/24h | 同期失敗検知（UT-09 連携の主要対象） | 自動化に昇格 |
| `cron.duration_ms` | WAE 計装 (`cron.sync.end` duration_ms) | ms | 実行時間監視（タイムアウト予防） | 自動化に昇格 |
| `cron.rows_synced` | WAE 計装 (`cron.sync.end` rows) | count | 同期件数の異常変動検知（参考） | 自動化に昇格 |

## 5. 外形監視（External Monitor）

| メトリクス名 | 取得元 | 単位 | 用途 | 自動化区分 |
| --- | --- | --- | --- | --- |
| `synthetic.http_status` | UptimeRobot | HTTP コード | 公開エンドポイント死活 | 自動化に昇格（UT-08 新規） |
| `synthetic.response_ms` | UptimeRobot | ms | 外形応答時間（参考） | 自動化に昇格（任意） |

監視対象 URL（候補、Wave 1 完了後確定）:

- `https://<production-domain>/` (Pages トップ)
- `https://<production-domain>/api/health` (apps/api ヘルスチェック想定)

## 6. メトリクス取得元別サマリ

| 取得元 | メトリクス数 | 備考 |
| --- | --- | --- |
| Cloudflare Analytics（Workers / Pages） | 9 | 無料、Dashboard / GraphQL API でアクセス可 |
| Cloudflare D1 Dashboard | 3 | 集計値の定期ポーリングが基本 |
| WAE 計装（apps/api 内） | 6 | Wave 2 実装で `apps/api` に書込ロジック追加 |
| UptimeRobot | 2 | 5 分間隔の HTTP チェック |

合計 20 メトリクス（参考含む）、自動化に昇格 14、手動据え置き 6。

## 7. 05a observability-matrix との対応

- 05a で「手動観測」とされている項目のうち、自動化に昇格するものは本カタログに「自動化区分」を「自動化に昇格」と記載
- 05a が新規定義した手動 runbook のうち、自動化対象外のものは「手動据え置き」と記載
- 詳細な差分は [runbook-diff-plan.md](./runbook-diff-plan.md) を参照
