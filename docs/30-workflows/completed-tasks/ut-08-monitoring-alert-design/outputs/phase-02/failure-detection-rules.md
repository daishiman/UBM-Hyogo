# UT-08 Phase 2: 失敗検知ルール (AC-7)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-7 |
| 親ドキュメント | [monitoring-design.md](./monitoring-design.md) |
| 主要対象 | D1 クエリ失敗、Sheets→D1 同期失敗（UT-09 連携） |

D1 クエリ失敗・Sheets→D1 同期失敗の検知ルールを定義する。WAE 計装イベント（[wae-instrumentation-plan.md](./wae-instrumentation-plan.md)）と閾値マトリクス（[alert-threshold-matrix.md](./alert-threshold-matrix.md)）と組み合わせて、検知 → 通知 → 一次対応の流れを確定する。

---

## 1. 検知ルール一覧

| 失敗対象 | 検知ロジック | 評価窓 | severity | 通知 |
| --- | --- | --- | --- | --- |
| D1 クエリ失敗（散発） | WAE `d1.query.fail` が 5min で 3 件以上 | 5 min ローリング | WARNING | Slack |
| D1 クエリ失敗（多発） | 同 5min で 10 件以上 | 5 min ローリング | CRITICAL | Slack + Email |
| D1 マイグレーション失敗 | `d1.query.fail` の `query_kind=migration` が 1 件 | 即時 | CRITICAL | Slack + Email |
| Sheets→D1 同期失敗（単発） | `cron.sync.end` の `status=failed` が 24h で 1 件 | 24 h | WARNING | Slack |
| Sheets→D1 同期失敗（連続） | `status=failed` が連続 2 回 | Cron 間隔 × 2 | CRITICAL | Slack + Email |
| Sheets→D1 同期未起動 | `cron.sync.start` が想定 Cron 間隔の 2 倍経過しても発火しない | Cron 間隔 × 2 | WARNING | Slack |
| Sheets API 認証失敗 | `api.error` の `error_class='SheetsAuthError'` が 1 件 | 即時 | WARNING | Slack |
| Workers 例外スロー多発 | `api.error` が 5min で 20 件以上 | 5 min | WARNING | Slack |
| 外形監視ダウン | UptimeRobot HTTP 非 2xx が連続 2 回（10 min） | 連続条件 | WARNING | Slack + Email |
| 外形監視長期ダウン | UptimeRobot HTTP 非 2xx が連続 4 回（20 min） | 連続条件 | CRITICAL | Slack + Email |

---

## 2. D1 クエリ失敗の検知詳細

### 2.1 検知元イベント

`d1.query.fail`（[wae-instrumentation-plan.md §3.5](./wae-instrumentation-plan.md)）

```
index1: query_kind  (select | insert | update | delete | migration)
blob1:  error_class
blob2:  db_name
double1: attempt_count
```

### 2.2 集計クエリ（GraphQL Analytics API イメージ）

```sql
SELECT count() AS fails
FROM ubm_hyogo_monitoring
WHERE blob1 IS NOT NULL  -- d1.query.fail のみ抽出
  AND timestamp > now() - INTERVAL '5 minute'
```

実装は Wave 2 のアラートワーカーで Cron 1min 起動 + 上記クエリ実行。

### 2.3 一次対応（runbook 連携）

| 状況 | 対応 |
| --- | --- |
| 単一 query_kind に集中 | スキーマ / マイグレーションの問題を疑い、最近の D1 マイグレーション履歴を確認 |
| 複数 query_kind に分散 | D1 自体の障害を疑い、Cloudflare Status を確認 |
| `migration` kind 1 件 | 即時 CRITICAL、デプロイをロールバック判断 |

---

## 3. Sheets→D1 同期失敗の検知詳細（UT-09 連携）

### 3.1 検知元イベント

`cron.sync.start` / `cron.sync.end`（[wae-instrumentation-plan.md §3.4](./wae-instrumentation-plan.md)）

`cron.sync.end` の blob1 = `status` を主キーとして判定。

| status | 意味 | 検知 |
| --- | --- | --- |
| `success` | 全件成功 | 検知対象外 |
| `partial` | 一部行で失敗 | WARNING（24h 累計 5 件以上） |
| `failed` | ジョブ全体が失敗 | WARNING（1 件）/ CRITICAL（連続 2 回） |

### 3.2 連続失敗の判定

直近 2 回の `cron.sync.end.status` を時系列で取得し、両方 `failed` なら CRITICAL。
Cron 間隔（例: 1 時間 / 30 分）は UT-09 で確定する想定。本書では「連続 2 回」を Cron 間隔非依存で表現する。

### 3.3 一次対応（runbook 連携）

| 状況 | 対応 |
| --- | --- |
| `status=failed` 1 件 | エラーログ（cf_ray）を Cloudflare ログで参照、`error_class` で分類 |
| 連続 2 回 `failed` | Sheets API 側の障害 / 認証 / ネットワークを順に確認 |
| Sheets API 認証失敗 | 1Password の Service Account Key を確認、UT-03 の手順で再発行検討 |
| `partial` 多発 | データ不整合（D1 制約違反 / 行 schema 変更）を疑い、UT-01 の同期方式を再確認 |

UT-09 完了後に本セクションのエラー分類を実情に合わせ更新する（Phase 4 以降の追加検証項目）。

### 3.4 同期未起動の検知

`cron.sync.start` イベントが想定 Cron 間隔 × 2 経過しても 1 件もない場合 WARNING。
Cron Trigger 自体の停止 / Cloudflare 側の障害を疑う検知ロジック。
代替として Cronitor の dead man's switch 採用も検討（[external-monitor-evaluation.md §2](./external-monitor-evaluation.md) サブ採用）。

---

## 4. 検知ロジック実装の方針（Wave 2 委譲）

実装は Wave 2 だが、本書で以下の方針を確定する。

| 項目 | 方針 |
| --- | --- |
| アラートワーカー | apps/api 内に Cron Trigger 1min を新設、各ルールを順次評価 |
| クエリ取得 | GraphQL Analytics API を Service Token 認証で呼び出し |
| 状態保存 | 「連続失敗」「重複通知抑制」のため軽量 KV を併用（D1 直接書込はしない） |
| アラート発火 | Slack / Email Webhook を直接 fetch、失敗時はフォールバック |
| 抑制 | 同一ルール同一 severity の通知は 30 分以内 1 件まで（[notification-design.md §2](./notification-design.md)） |

---

## 5. 偽陽性 / 偽陰性の許容方針

| 種類 | 例 | 許容方針 |
| --- | --- | --- |
| 偽陽性（誤報） | D1 一時的接続失敗で 3 件超過 | 5 min 評価窓 + 連続条件で軽減。月次レビューで件数 > 5 件なら閾値緩和 |
| 偽陰性（見逃し） | 5 min 内に 2 件失敗で復旧 | 軽微影響として許容。月次手動チェック（05a 由来）で吸収 |

---

## 6. 関連 AC との接続

- AC-1（メトリクス）: [metric-catalog.md](./metric-catalog.md) の `d1.query_failures` / `cron.failures`
- AC-2（閾値）: [alert-threshold-matrix.md](./alert-threshold-matrix.md) の対応行
- AC-3（通知）: [notification-design.md](./notification-design.md) の Slack + Email
- AC-5（計装）: [wae-instrumentation-plan.md](./wae-instrumentation-plan.md) の `d1.query.fail` / `cron.sync.*`
