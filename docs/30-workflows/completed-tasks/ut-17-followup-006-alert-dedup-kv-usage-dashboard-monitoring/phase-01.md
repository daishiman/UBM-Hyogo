# Phase 1: 要件定義 / Cloudflare API 仕様確認

[実装区分: 実装仕様書]

## 1. 目的

KV 監視を Cloudflare Notification Policy + 既設 IaC 経路で実現するための前提情報を確定する。具体的には:

- `ALERT_DEDUP_KV` に対する Cloudflare Notifications の `alert_type` 候補と、対応する metric 名・閾値表現を確定する
- latency が native Notification policy で扱えるかを usage/error/storage と分離して判定する
- `infra/cloudflare-alerts/quota-base.json` に追加すべき quota キー名と公式値を確定する
- 既存 IaC 経路（followup-004）の schema / canonicalize / api-client が KV 監視を素直に受けられるか、拡張が必要か判定する
- ベースライン取得すべきメトリクスと初期閾値ポリシーを確定する

## 2. 入力

- `docs/30-workflows/unassigned-task/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md`
- `infra/cloudflare-alerts/` 配下全ファイル
- Cloudflare 公式 API ドキュメント:
  - `GET /accounts/{account_id}/alerting/v3/available-alerts`
  - `POST /accounts/{account_id}/alerting/v3/policies`
- Cloudflare Dashboard → Workers & Pages → KV → `ALERT_DEDUP_KV` → Metrics タブの実画面

## 3. 成果物

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-01/requirements.md` | 新規 | 要件・スコープ・AC・4 条件評価 |
| `outputs/phase-01/kv-metric-availability.md` | 新規 | Cloudflare 公式 API での KV metric 列挙結果 + alert_type 対応表（確認日時 / 確認元 URL / 取得 JSON サンプル） |
| `outputs/phase-01/existing-asset-inventory.md` | 新規 | 既存 IaC 資産（policies / schema / lib）の再利用可能性評価 |

## 4. 手順

1. `bash scripts/cf.sh api-get /accounts/$CF_ACCOUNT_ID/alerting/v3/available-alerts` を実行（read-only token で OK）し、`workers_kv` 系 alert_type を grep する。結果 JSON を `outputs/phase-01/raw/available-alerts.json` に保存
2. 列挙された alert_type それぞれについて、以下を整理:
   - `alert_type` 値（例: `billing_usage_alert`）
   - 該当する metric 単位（writes/day, reads/day, stored bytes, error rate %, latency/duration）
   - 閾値表現が「percentage of quota」「absolute threshold」「anomaly detection」のどれか
   - filter で namespace 指定が可能か（`mechanisms.filter` または `conditions.filters` の有無）
3. KV namespace 指定が可能な alert_type を優先する。namespace 指定不可でも、現行 UBM-Hyogo account の KV namespace が `ALERT_DEDUP_KV` のみであることを確認できる場合は Account 集計の quota guard として CONDITIONAL GO を許容する。namespace が複数ある、または inventory evidence が無い場合は `ALERT_DEDUP_KV` 単独監視不可として記録し、代替案（GraphQL Analytics + workers cron）を Phase 3 へエスカレーション
4. Cloudflare 公式無料枠ドキュメント（https://developers.cloudflare.com/kv/platform/limits/）で KV 関連 quota（write/day, read/day, storage/account, key 数）を取得し、`outputs/phase-01/raw/kv-limits.md` に snapshot
5. `infra/cloudflare-alerts/schema/policy.schema.json` の `alert_type` enum を拡張する必要があるか判定（KV 系 alert_type が `billing_usage_alert` 以外なら拡張要）
6. 既存 lib (`canonicalize.ts` / `api-client.ts` / `resolve.ts`) が新 alert_type を素通しできるか確認（多くの場合 alert_type は文字列として透過するため拡張不要のはず）
7. 上記を `outputs/phase-01/requirements.md` に統合し、4 条件評価（必要性 / 効果 / 副作用 / 緩和策）を記載

## 5. 関連変更ファイル候補（Phase 5 以降確定）

- `infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json`（新規）
- `infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json`（新規・stored data quota がサポートされる場合のみ）
- `infra/cloudflare-alerts/quota-base.json`（編集 — `workers_kv_*` キー追加）
- `infra/cloudflare-alerts/schema/policy.schema.json`（条件付き編集）
- `infra/cloudflare-alerts/lib/__tests__/load.spec.ts`（編集 — KV policy fixture 追加）
- `infra/cloudflare-alerts/lib/__tests__/canonicalize.spec.ts`（編集）
- `infra/cloudflare-alerts/README.md`（編集 — policy 一覧表）

## 6. 完了条件 (DoD)

- [ ] `outputs/phase-01/kv-metric-availability.md` に Cloudflare 公式 API の KV 関連 alert_type が列挙され、namespace filter 可否が表で整理されている
- [ ] `outputs/phase-01/decision.md` に `native alert_type 有無` / `namespace filter 可否` / `latency native alert 可否` / `GraphQL fallback 要否` の decision table がある
- [ ] schema 拡張要否の判定が記録され、根拠（採用予定 alert_type の値）が明示されている
- [ ] `outputs/phase-01/requirements.md` の 4 条件評価が完了
- [ ] Phase 2 着手判定 GO/NO-GO が `outputs/phase-01/decision.md` に記録（namespace filter 不可で NO-GO の場合は Phase 3 で GraphQL 代替案へ pivot）

## 7. 検証コマンド

```bash
# Cloudflare available-alerts 取得（CLOUDFLARE_ALERTS_TOKEN_READ 経由）
op run --env-file=.env -- bash scripts/cf.sh alerts list

# schema/canonicalize の現状確認
mise exec -- pnpm test:alerts
```

## 8. 想定される苦戦ポイント

- Cloudflare Notifications が KV を Account 単位でしか alert できない場合、`ALERT_DEDUP_KV` だけ抜き出せず別 namespace（将来追加されうるもの）と通知が混ざるリスク
- `available-alerts` API は account scope に依存し、無料枠 account では `billing_usage_alert` 系のみ返ることがある。その場合は Phase 1 結果に従い pivot 判断
