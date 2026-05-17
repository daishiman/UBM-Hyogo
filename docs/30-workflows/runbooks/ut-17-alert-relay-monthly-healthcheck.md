# UT-17 Alert Relay 月次ヘルスチェック runbook

Cloudflare Notifications → 日本語化リレー Worker → Slack の通知経路が
**Webhook URL 失効 / Worker 障害 / Cloudflare 設定 drift** によってサイレント停止
していないことを月 1 回確認する手順。

> **2026-05-14 更新**: 定常監視は UT-17-followup-003 の Cloudflare Workers cron healthcheck が担当する。
> この runbook は四半期の deep-dive、cron healthcheck 連続 2 回失敗時、インシデント対応後の手動確認に使う。

## 1. 実施タイミング

- 四半期初月 1 日の業務開始前（朝イチ運用）
- UT-17 weekly healthcheck が 2 回連続で失敗したとき
- インシデント対応後（postmortem の一部として）

## 2. 確認手順（5 ステップ + KV namespace 健全性）

### Step 1: テスト payload を staging に送信

```bash
op run --env-file=.env -- bash -c 'curl -i -X POST \
  "https://ubm-hyogo-api-staging.<account>.workers.dev/internal/alert-relay" \
  -H "cf-webhook-auth: $CF_WEBHOOK_AUTH_SECRET" \
  -H "content-type: application/json" \
  -d "{\"name\":\"UT-17 monthly healthcheck\",\"data\":{\"current\":1,\"threshold\":100},\"severity\":\"warning\"}"'
```

期待: `HTTP/1.1 200` / `{"ok":true,"attempts":1}`

### Step 2: Slack staging channel に到達確認

- 通知が日本語で届いている
- 「UT-17 monthly healthcheck」の文字列を含む
- ヘッダー絵文字 ⚠️ が表示されている

### Step 3: production 経路の生死確認（読み取りのみ）

```bash
op run --env-file=.env -- bash -c 'curl -i -X POST \
  "https://ubm-hyogo-api.<account>.workers.dev/internal/alert-relay" \
  -H "cf-webhook-auth: wrong-secret" \
  -H "content-type: application/json" \
  -d "{}"'
```

期待: `HTTP/1.1 401` （production が起動していて auth が効いている証跡）

### Step 4: Cloudflare Notification Policy drift 確認 (UT-17-Followup-004 IaC 経由)

Dashboard 目視ではなく `infra/cloudflare-alerts/` 配下の IaC declaration と
Cloudflare 実状を `pnpm cf:alerts:diff` で機械比較する。UT-17-followup-006 で
追加された KV 監視 policy (`workers-kv-writes-per-day` /
`workers-kv-stored-bytes`) も同 diff 対象に含まれる。

```bash
mise exec -- pnpm cf:alerts:diff
# = bash scripts/cf.sh alerts diff
# exit 0 + "no drift detected" → OK
# exit 2 + drift 一覧                       → 差分発生。下記いずれかで対応
```

drift 一覧が出た場合の対応:

- 一時的に閾値を変えていた / Cloudflare 側で手動編集していた
  → 何が正しいかを判断:
    - **IaC が正** なら `bash scripts/cf.sh alerts apply --yes` で再収束 (要 1Password apply token)
    - **現状が正** なら `infra/cloudflare-alerts/policies/*.json` または `quota-base.json` を更新して PR (CI drift workflow が PR で再確認)
- 新規 policy がダッシュボードで足されている (`extra`)
  → IaC に取り込むなら `infra/cloudflare-alerts/policies/<name>.json` を追加して PR
  → 不要なら Cloudflare Dashboard から削除

詳細: `infra/cloudflare-alerts/README.md` / `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/`

### Step 4b: ALERT_DEDUP_KV namespace 健全性確認（ut-17-followup-002）

> **UT-17-followup-006**: KV quota guard policy は repo に宣言済
> (`workers-kv-writes-per-day` / `workers-kv-stored-bytes`) だが、初期状態は
> `enabled:false`。Step 4 の `cf:alerts:diff` で IaC drift を検知できる。
> Slack 自動発火は user 承認後の apply / smoke / `enabled:true` 判断後に成立する。
> 以下の手順は namespace binding / TTL 機能の四半期 deep-dive のために残す。

dedup state は Cloudflare KV namespace `ALERT_DEDUP_KV`（binding 名）に永続化されている。
isolate 跨ぎ dedup が機能していることを確認する。

```bash
# binding が staging / production に正しく紐付いているか確認。
# namespace title は作成時の出力に従う。運用上の推奨 title は alert-dedup-staging / alert-dedup-production。
bash scripts/cf.sh kv:namespace list

# staging の dedup key を 1 件 list（任意。entry が無いか直近 5 分以内の entry のみであれば正常）
bash scripts/cf.sh kv:key list --binding ALERT_DEDUP_KV --env staging
```

期待:
- `kv:namespace list` 結果に、staging / production 用の実 namespace id と title（推奨: `alert-dedup-staging` / `alert-dedup-production`）が表示される
- staging key list で TTL 5 分超えの古い entry が残っていない（KV `expirationTtl` が機能している）
- 異常時: `apps/api/wrangler.toml` のコメント化済み `[[env.{staging,production}.kv_namespaces]]` block が実 namespace id で有効化されているか確認する。placeholder id を active TOML に置かない。

### Step 4c: KV 操作エラーログの確認（ut-17-followup-005）

alert-relay は `ALERT_DEDUP_KV.get` / `put` が失敗した場合、Slack 配信を止めずに
1 行 JSON の構造化 warn を出力する。直近 1 時間で 10 件を超える場合は、KV 一時障害、
write rate limit、namespace binding drift を調査する。

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep alert_relay_kv_op_failed
```

直近 1 時間の件数を調べる場合は、1 時間だけ tail して件数を数える:

```bash
timeout 3600 bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep -c alert_relay_kv_op_failed
```

同じ `dedupeKeyHash` が何度も出る場合、対象 payload をローカルで再現できる範囲で同じ
dedupe key を SHA-256 first 12 hex chars にして照合する。raw key は Workers Logs に出さない。

ログ schema:

| field | 型 | 例 | 用途 |
| --- | --- | --- | --- |
| `event` | string | `alert_relay_kv_op_failed` | Workers Logs / logpush filter の固定キー |
| `op` | `"get"` / `"put"` | `get` | 失敗した KV 操作 |
| `errorClass` | string | `Error` | エラー種別の集計 |
| `dedupeKeyHash` | string | `4f2a9c01b7de` | raw dedupe key を出さずに同一 key を束ねる |
| `isolateId` | string | UUID | 同一 Workers isolate 内の発生傾向確認 |
| `ts` | string | `2026-05-16T00:00:00.000Z` | 発生時刻 |

### Step 5: 1Password の secret 鮮度確認

- `op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL` の更新日が 90 日以上前なら Slack 側で再発行を検討
- `op://Personal/cloudflare-alert-relay/CF_WEBHOOK_AUTH_SECRET` も同様

## 3. 異常検知時の対応

| 症状 | 一次対応 |
| --- | --- |
| Step 1 が 401 | `cf-webhook-auth` secret が drift。1Password と Cloudflare Secrets を再同期 |
| Step 1 が 502 | Slack Webhook URL 失効。1Password を更新後 `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL` で再投入 |
| Step 1 が 503 | `SLACK_WEBHOOK_URL` 未設定。Cloudflare Secrets に投入 |
| Step 2 で Slack 未到達 | Webhook URL の channel 紐付けを Slack 側で確認 |
| Step 4 で Policy が消失 | Dashboard で再作成 + UT-17 phase-04 task-breakdown を参照 |
| Step 4c が直近 1 時間で 10 件超 | `op` / `errorClass` / `dedupeKeyHash` 別に集計し、Cloudflare KV status、write rate limit、`ALERT_DEDUP_KV` binding drift を順に確認 |

## 4. 記録

実施結果は `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.log.md` を作成し、
実施日 / 担当 / Step 1〜5 の結果 / 異常時の対応を追記する（初回は本ファイルから派生作成）。

## 5. KV 操作エラーログ確認

UT-17-FU-005 以降、`ALERT_DEDUP_KV.get` / `ALERT_DEDUP_KV.put` が失敗した場合は
alert relay が次の 1 行 JSON を `console.warn` に出力する。

```json
{"event":"alert_relay_kv_op_failed","op":"put","errorClass":"Error","dedupeKeyHash":"a1b2c3d4e5f6","isolateId":"00000000-0000-4000-8000-000000000000","ts":"2026-05-16T00:00:00.000Z"}
```

### 5-1. Workers Logs / tail での確認

`wrangler` は直接実行せず、Cloudflare CLI wrapper を経由する。

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep 'alert_relay_kv_op_failed'
```

操作種別ごとの切り分け:

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep 'alert_relay_kv_op_failed' \
  | grep '"op":"get"'

bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep 'alert_relay_kv_op_failed' \
  | grep '"op":"put"'
```

### 5-2. Field 定義

| field | 値 | 意味 | 運用で見る観点 |
| --- | --- | --- | --- |
| `event` | `alert_relay_kv_op_failed` | KV 操作失敗ログの固定イベント名 | grep / Logpush filter の一次条件 |
| `op` | `get` / `put` | 失敗した KV 操作 | dedup 判定失敗と永続化失敗の分離 |
| `errorClass` | `Error` / `TypeError` / `string` など | `Error` 系は例外クラス名、非 Error throw は `typeof` 値 | Cloudflare 側障害 / 実装側 TypeError / 非標準 throw の分類 |
| `dedupeKeyHash` | SHA-256 先頭 12 hex / `hash_error` | dedupe key の短縮 hash。hash 生成自体が失敗した場合もログ emit を優先する | raw key を出さず同一 alert の再発を追跡 |
| `isolateId` | UUID | Worker isolate 起動単位の代理 ID | 同一 isolate 内の連続失敗かどうかを見る |
| `ts` | ISO 8601 | emit 時刻 | incident timeline との突合 |

### 5-3. 判定目安

| 状態 | 目安 | 対応 |
| --- | --- | --- |
| 平常 | 0〜2 件 / 日 | 様子見。Cloudflare KV の短時間揺らぎとして記録する |
| 調査開始 | 10 件超 / 日 | Cloudflare Status、KV namespace、API token / binding drift を確認する |
| 緊急 | `op=get` が連続し Slack 重複通知が増える | dedup が効いていないため、incident として扱い UT-17-FU-006 dashboard 化を優先する |
