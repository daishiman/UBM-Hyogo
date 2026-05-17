# Phase 2: 設計（policy 構造・閾値・schema 拡張要否）

[実装区分: 実装仕様書]

## 1. 目的

Phase 1 の結果に基づき、追加する policy JSON ファイル群の構造・閾値計算式・schema 拡張範囲・テスト fixture を確定する。

## 2. 入力

- `outputs/phase-01/kv-metric-availability.md`
- `outputs/phase-01/requirements.md`
- `infra/cloudflare-alerts/policies/*.json`（既存テンプレート）
- `infra/cloudflare-alerts/schema/policy.schema.json`
- `infra/cloudflare-alerts/lib/canonicalize.ts` / `diff.ts` / `resolve.ts`

## 3. 成果物

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-02/policy-design.md` | 新規 | 追加 policy 1-2 件の name / alert_type / conditions / mechanisms 設計 |
| `outputs/phase-02/quota-base-diff.md` | 新規 | `quota-base.json` 差分（追加キーと公式値出典） |
| `outputs/phase-02/schema-extension.md` | 新規 | `policy.schema.json` の差分（必要な場合のみ）と既存 policy への後方互換性確認 |
| `outputs/phase-02/canonicalize-impact.md` | 新規 | lib 側影響評価。canonicalize / diff / api-client 変更要否判定 |
| `outputs/phase-02/staging-rollout-plan.md` | 新規 | `enabled: false` 初期適用 → baseline 取得 → `enabled: true` 再適用の 2 段階計画 |
| `outputs/phase-02/pivot-matrix.md` | 新規 | native alert / namespace filter / latency support の GO / CONDITIONAL GO / NO-GO 分岐 |

## 4. 設計方針

### 4.1 policy 命名

- `workers-kv-writes-per-day`（writes/day usage に対応）
- `workers-kv-stored-bytes`（stored data bytes が available-alerts に存在する場合のみ）
- `workers-kv-error-rate`（KV error rate が native alert として存在する場合のみ。followup-005 の構造化ログとは別責務）
- latency/duration は native alert が確認できた場合のみ policy 化する。native alert が無い場合は policy JSON を作らず、runbook の Workers Analytics / GraphQL review 項目に固定する
- 既存命名規約に準拠: `^[a-z0-9-]+$`

### 4.2 conditions 構造

Phase 1 で確定した alert_type が `billing_usage_alert` の場合（最有力）:

```json
{
    "metric": "workers_kv_writes_per_day",
  "percentage": 0.8
}
```

namespace filter を `mechanisms.filter` で渡せる場合は、policy JSON に `filters` キーを追加するため schema 拡張が発生する。Phase 3 で GO/NO-GO 判定。

### 4.2.1 GO / NO-GO 分岐

| native alert | namespace filter | latency native alert | 判定 | 実装方針 |
| --- | --- | --- | --- | --- |
| あり | あり | あり/なし | GO | usage/error/storage を policy 化。latency は native support がある場合のみ policy 化、無い場合は runbook review 項目 |
| あり | なし | 任意 | CONDITIONAL GO | Account 集計で誤通知しない明確な理由がある場合だけ `enabled:false` policy まで実装。Slack 発火 PASS は一時検証 policy 限定 |
| なし | 任意 | 任意 | NO-GO | `infra/cloudflare-alerts/` への KV policy 追加は行わず、GraphQL / Workers Analytics pull 監視仕様へ pivot |

### 4.3 quota-base.json 追加候補

| key | 値（Phase 1 で確定） | 出典 |
| --- | --- | --- |
| `workers_kv_writes_per_day` | TBD | https://developers.cloudflare.com/kv/platform/limits/ |
| `workers_kv_reads_per_day` | TBD（本 wave では policy 化しない） | 同上 |
| `workers_kv_stored_data_bytes` | TBD（無料枠 1GB） | 同上 |

`snapshotAt` は Phase 2 着手日に更新。

### 4.4 mechanisms.webhooks

既存 `ut-17-relay` webhook（`infra/cloudflare-alerts/webhooks/ut-17-relay.json`）を再利用。本タスクで webhook destination を増やさない。

### 4.5 schema 拡張判定

- alert_type が `billing_usage_alert` のみで完結する場合 → schema 変更なし
- alert_type に新値（例: `workers_kv_*_anomaly`）が必要な場合 → enum に追加し、対応する `conditions` 構造を `oneOf` に追加
- `additionalProperties:false` を保持し、既存 policy が壊れないことを Phase 9 テストで担保

### 4.6 staging rollout（2 段階）

1. **Wave A**: `enabled: false` で repo にコミット + user 承認後に `apply --yes`。Cloudflare 上は policy 作成のみ、発火しない
2. **同一 PR 内の runtime smoke**: 5 営業日 baseline を待たず、検証用一時 policy または短時間負荷を使って Slack 経路だけを Phase 11 で証明する
3. **Wave B**: baseline 取得期間中（最低 5 営業日、目標 1 週間）に staging で writes/day・storage・error/latency review 値を Workers Analytics で観測。閾値 `percentage` を `max × 3 / quotaBase` で算出（保守的）。`enabled: true` + 確定値での再 apply は Phase 13 の user-gated operation として扱う

## 5. 関連変更ファイル

- `infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json`（新規）
- `infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json`（新規 / Phase 1 結果次第）
- `infra/cloudflare-alerts/quota-base.json`（編集）
- `infra/cloudflare-alerts/schema/policy.schema.json`（条件付き編集）
- `infra/cloudflare-alerts/lib/__tests__/*.spec.ts`（編集 / 新規 fixture）

## 6. 完了条件 (DoD)

- [ ] 追加 policy の JSON が `outputs/phase-02/policy-design.md` に full body で提示されている（Phase 5 でそのままコピペできる形）
- [ ] `quota-base.json` 差分が公式 URL + snapshot 値とともに記録されている
- [ ] schema 拡張要否が確定し、必要な場合は patch diff が提示されている
- [ ] 2 段階 rollout の `enabled` 切替タイミングが明文化されている
- [ ] baseline 取得待ちと同一 PR の runtime smoke が分離され、5 営業日待ちを Phase 1-12 完了条件にしていない
- [ ] Phase 3 設計レビュー観点が `outputs/phase-02/review-checklist.md` に列挙されている

## 7. 検証コマンド（Phase 2 中の draft レビュー）

```bash
# JSON schema 整合性チェック（既存 policy が壊れていないか）
mise exec -- pnpm test:alerts

# 設計案 JSON を fixture へ仮配置して canonicalize を試走
node infra/cloudflare-alerts/lib/canonicalize.ts < outputs/phase-02/policy-design.json
```
