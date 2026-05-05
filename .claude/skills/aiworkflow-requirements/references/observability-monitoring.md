---
name: observability-monitoring
description: UBM-Hyogo の Cloudflare Workers / Pages / D1 を対象としたモニタリング・アラート設計の正本リファレンス。WAE 6 イベント、UptimeRobot 無料枠境界、アラート閾値、PII 除外ルール、識別子 drift 対策を集約する。
type: reference
---

# Observability / Monitoring 正本リファレンス

> 対象タスク: UT-08 monitoring/alert design（unassigned）/ 05a-parallel-observability-and-cost-guardrails（自動化前段の手動観測）
>
> 責務境界: 05a は「手動確認可能な観測点の優先」が方針。UT-08 は次段として自動化を追加し、05a の `observability-matrix.md` / `cost-guardrail-runbook.md` を上書きせず差分追記する。

---

## 1. 無料枠の境界

### 1.1 Cloudflare Workers Analytics Engine（WAE）

| 項目 | 値 / 制約 |
| --- | --- |
| 書き込み単位 | `event = { blobs[], doubles[], indexes[] }` の構造化イベント |
| 計装方法 | Workers コードから明示的に `env.WAE.writeDataPoint()` 呼び出し |
| データ保持期間 | デフォルト 31 日（無料プラン） |
| クエリ手段 | Workers Analytics Engine SQL API |
| コスト | 無料プランは公開時点で利用可だが、書き込みボリューム / クエリ頻度の上限は将来変更され得る |

> 不確実性メモ: 無料プラン上限（書き込み件数 / クエリ列数）は Cloudflare 側で値を変更する例があるため、設計時の値を `cost-guardrail-runbook.md` に取得日付付きで固定し、四半期に一度確認する。

### 1.2 UptimeRobot 外形監視

| 項目 | 無料プラン値 |
| --- | --- |
| 監視間隔 | 5 分（最短） |
| モニタ数 | 50 |
| 通知チャネル | メール / Slack / Webhook |
| ステータスページ | 1 つまで |

> SLA 影響: 5 分以内に発生した瞬断は検知できない。ユーザー要件と照合して許容範囲を先に合意する。

---

## 2. WAE 6 イベント設計（reference）

UBM-Hyogo の最小計装セット。各イベントは `index1` をテナント / 環境キー、`blob1` をイベント種別、`double1` を主要メトリクスとして固定する。

| # | event 名 | index1 | blob1 | doubles | 用途 |
| --- | --- | --- | --- | --- | --- |
| 1 | `request_lifecycle` | `<env>` | route | latency_ms, status_code | Workers レスポンスタイム / エラーレート |
| 2 | `d1_query` | `<env>` | statement_kind（SELECT/INSERT/...） | duration_ms, rows | D1 ボトルネック検知 |
| 3 | `kv_op` | `<env>` | op（get/put/delete） | duration_ms | KV 無料枠書き込み消費の実測 |
| 4 | `r2_op` | `<env>` | op（put/get/list） | bytes, duration_ms | R2 Class A/B 操作分布 |
| 5 | `sheets_sync` | `<env>` | result（ok/fail） | duration_ms, rows_synced | Sheets→D1 同期失敗検知 |
| 6 | `quota_pulse` | `<env>` | resource（d1_writes/kv_writes/r2_class_a/...） | used_count, used_ratio | 無料枠消費率の継続観測 |

> identifier drift 防止: `index1` / `blob` 名はリポジトリ内で 1 か所（`apps/api` の WAE 計装ヘルパ）に集約し、文字列リテラルの直書きを禁止する。drift が起きると WAE クエリが silently 0 件返しになり検知の正本が壊れる。

---

## 3. アラート閾値設計指針

### 3.1 二段階閾値（WARNING / CRITICAL）

| メトリクス | WARNING | CRITICAL | 根拠 |
| --- | --- | --- | --- |
| Workers エラーレート（5 分平均） | 1% | 5% | UI 側で再試行可能か否かの境界 |
| Workers p95 レスポンスタイム | 1,000 ms | 3,000 ms | 一般的な対話 UI 受容上限 |
| D1 クエリ失敗（5 分） | 1 件 | 10 件 | スキーマ drift 検知用に WARNING を低く保つ |
| KV 書き込み無料枠消費率（日次） | 60% | 85% | 1,000/日 上限への到達余裕 |
| Sheets→D1 同期失敗 | 連続 1 回 | 連続 3 回 | 単発の Google API ゆらぎとシステム障害の切り分け |

### 3.2 30 分 dedupe（重複抑止）

- 同一 `event 種別 × 環境 × 閾値レベル` の通知は 30 分間は 1 通に集約する。
- 30 分窓内の追加発火は「カウンタのみ更新（再送しない）」で、窓が閉じた時点で発火が継続していれば再通知する。
- UptimeRobot 側でも Down 通知の repeat interval を 30 分以上に揃え、二重通知を排除する。

### 3.3 Webhook fallback

- 一次通知: Slack Incoming Webhook（`SLACK_WEBHOOK_ALERT_URL`、1Password Environments 経由）。
- フォールバック: Slack 配送失敗 / 5xx の際はメール通知（運用代表アドレス）に切り替える。
- 通知本文は `event 種別 / 環境 / 閾値レベル / 直近 5 分の値 / runbook URL` を最小要素とする。

---

## 4. PII 除外ルール

WAE / ログ / アラート本文には以下を絶対に書き込まない。

| 種別 | 例 | 代替 |
| --- | --- | --- |
| メールアドレス | `responseEmail`, `email` | ハッシュ（SHA-256 + per-env salt）または会員 ID |
| 氏名 | フォーム回答の氏名項目 | 会員 ID |
| 電話番号 | フォーム回答の電話番号 | 取得しない |
| OAuth トークン / Magic Link | `Authorization` ヘッダ | 完全除去 |
| Cookie 値 | session / CSRF | 完全除去 |

> 計装ヘルパで強制: `writeWAE(event, payload)` のラッパで `payload` を allowlist フィールド（`route`, `status_code`, `duration_ms` など）にフィルタする。allowlist 外フィールドは書き込み時点で drop する。

---

## 5. 苦戦箇所（恒久対策）

### 5.1 アラート疲れ

- 症状: 閾値を緩く設定すると誤報が頻発し、担当者が通知をミュートする。CRITICAL も無視される。
- 対策:
  1. 初期は WARNING のみ運用し、対応実績ログ（`alert-response-log.md`）を 2〜4 週間蓄積する。
  2. 実績から「1 週間で対応に至った発火 / 対応不要だった発火」の比率を算出。対応不要が 70% を超えるメトリクスは閾値を緩めるか、メトリクス自体を削除する。
  3. CRITICAL 閾値はログを見て初めて設定する（最初から設定しない）。

### 5.2 identifier drift 防止

- 症状: WAE の `blob1` 名やイベント名がコード内で複数箇所に直書きされ、表記ゆれにより WAE クエリ結果が空集合になる。
- 対策:
  1. イベント名 / blob / index の名称定数は `apps/api/src/observability/wae-events.ts` に集約。
  2. 計装呼び出しはこの定数経由のみ許可（lint ルール案: 文字列リテラルでの `writeDataPoint` 禁止）。
  3. WAE クエリ側も同じ定数を参照する（クエリビルダ関数化）。

### 5.3 05a outputs 個別ファイル DEFERRED の解消

- 05a Phase 12 では `observability-matrix.md` / `cost-guardrail-runbook.md` を root canonical として確定済み。Phase 11 は UI 変更なしの NON_VISUAL evidence。
- UT-08 / UT-13 / UT-12 など下流の自動化タスクが「05a の DEFERRED 部分」を引き取る。引き取り時は 05a の成果物を上書きせず、新規 `monitoring-design.md` / `kv-runbook.md` / `r2-runbook.md` に差分追記する。

---

## 6. 関連ファイル

| 役割 | 参照先 |
| --- | --- |
| 05a 観測マトリクス | `docs/05a-parallel-observability-and-cost-guardrails/outputs/observability-matrix.md` |
| 05a コストガードレール runbook | `docs/05a-parallel-observability-and-cost-guardrails/outputs/cost-guardrail-runbook.md` |
| Cloudflare デプロイ正本 | `references/deployment-cloudflare.md` |
| シークレット管理 | `references/deployment-secrets-management.md` |
| 監視設計教訓 | `references/lessons-learned-monitoring-design-2026-04.md` |
| KV 教訓 | `references/lessons-learned-kv-session-cache-2026-04.md` |
| 未タスク仕様 | `docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md` |

## 7. 09b Cron / Incident Response Runbook Linkage（2026-05-01）

09b は runtime 設定を変更しない docs-only / `NON_VISUAL` runbook 仕様として、sync monitoring の運用境界を固定する。`sync_jobs.running` 30 分超は P1、`sync_jobs.failed` 3 連続は P2 以上の調査開始条件として扱い、詳細手順は `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/incident-response-runbook.md` を参照する。

`sheets_sync` イベント名は legacy 表記を含むため、Forms sync 正本化後の WAE event rename は別タスクで扱う。09b では Cloudflare Analytics / manual SQL / runbook evidence を正本とし、Sentry DSN 登録と Slack 自動通知は unassigned task に分離済み。

---

## 8. 変更履歴

| 日付 | 変更 |
| --- | --- |
| 2026-05-01 | 09b cron monitoring / release runbook linkage を追加。`sync_jobs.running` 30 分超 / failed 3 連続の incident response 導線を固定 |
| 2026-04-27 | UT-08 / UT-13 / UT-12 同期 wave で新規作成。WAE 6 イベント・30 分 dedupe・PII allowlist・identifier drift 対策を集約 |
