# Operator Runbook — `/health/db` 本番投入手順

> Claude では実行できない人間オペレーター（管理者）作業の詳細手順。本 PR をマージした後、以下を順序通り実施することで `/health/db` が本番で稼働する。

## 0. 前提

- mise / op CLI / wrangler が手元で動作する状態
- 1Password 認証済み（`op signin`）
- Cloudflare API Token が `.env` の `op://UBM-Hyogo/cloudflare-api/CLOUDFLARE_API_TOKEN` 経由で取得できる
- UT-22 D1 migration が production / staging で適用済み

### 0.1 UT-22 完了確認（必須ゲート）

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
```

両方とも `Already applied` のみが表示されれば OK。`Pending` がある場合は本ランブックを中止し、UT-22 ワークフローを優先する。

## 1. `HEALTH_DB_TOKEN` の生成と 1Password 登録

### 1.1 32 byte ランダム値生成

```bash
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
```

→ 43 文字程度の base64url 文字列を取得。**ターミナル履歴に残さない**ため、以下の手順で直接 1Password に書き込む:

### 1.2 1Password に保管

1Password Desktop / CLI で `op://UBM-Hyogo/cloudflare-api` アイテムを開き、**新規フィールド** `HEALTH_DB_TOKEN` を追加して 1.1 の値を貼り付ける。CLI で実施する場合:

```bash
TOK=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')
op item edit "cloudflare-api" "HEALTH_DB_TOKEN[password]=$TOK" --vault UBM-Hyogo
unset TOK
```

> **注意**: 環境変数 `TOK` は `unset` で必ず破棄する。コマンド履歴も `history -d <num>` で削除推奨。

### 1.3 取得確認

```bash
op read "op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN" | wc -c
# 期待: 44（43 文字 + 改行）
```

## 2. Cloudflare Secrets に投入

### 2.1 staging

```bash
op read "op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN" | \
  bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env staging
```

> `scripts/cf.sh` は `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` を動的注入する。`wrangler` は標準入力から secret 値を受け取る。

### 2.2 production

```bash
op read "op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN" | \
  bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env production
```

### 2.3 投入確認

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
```

両方の出力に `HEALTH_DB_TOKEN` が含まれていること（値は表示されない）。

## 3. Cloudflare WAF rule の設定

### 3.1 dashboard 経由（推奨）

1. Cloudflare dashboard → 対象 zone → **Security** → **WAF** → **Custom rules**
2. **Create rule** をクリック
3. 設定:
   - Rule name: `health-db-protect`
   - Expression（Edit expression に切り替え）:
     ```
     (http.request.uri.path eq "/health/db") and (not ip.src in {198.51.100.0/24 203.0.113.5})
     ```
     `{...}` 内は外部監視 SaaS の egress IP を埋める（StatusCake / UptimeRobot / Pingdom 等のドキュメントを参照）
   - Action: `Block`
4. **Deploy**

### 3.2 rate limit rule（追加で）

同じ画面で **Rate limiting rules** を作成:

- Rule name: `health-db-rate-limit`
- If: `http.request.uri.path eq "/health/db"`
- Rate: `60 requests per 1 minute per IP`
- Action: `Block` for `10 minutes`

### 3.3 適用確認

外部監視 SaaS の IP からは 200、それ以外の IP からは 403（WAF block）が返ることを確認。詳細は §5.3。

## 4. デプロイ

### 4.1 staging

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

deploy ログに `Deployed` が出ることを確認。

### 4.2 staging smoke（合格まで production に進まない）

```bash
TOK=$(op read "op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN")
API=https://ubm-hyogo-api-staging.<account>.workers.dev   # 実 URL に置換

# S-03: 正 token で 200
curl -sS -H "X-Health-Token: $TOK" -w "\n[HTTP %{http_code}]\n" "$API/health/db"
# expect:
#   {"ok":true,"db":"ok","check":"SELECT 1"}
#   [HTTP 200]

# T5(b): token なしで 401
curl -sS -w "\n[HTTP %{http_code}]\n" "$API/health/db"
# expect: [HTTP 401]

# T5(c): 誤 token で 401
curl -sS -H "X-Health-Token: wrong" -w "\n[HTTP %{http_code}]\n" "$API/health/db"
# expect: [HTTP 401]

unset TOK
```

3 件すべて期待通りなら合格。

### 4.3 production deploy

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

### 4.4 production smoke

§4.2 と同じ curl を `<account>` を置換して production URL に対して実行。3 件すべて期待通りなら投入完了。

## 5. 投入後の確認

### 5.1 Workers tail で異常検知

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format json
```

10 分程度観察し、`/health/db` の 503 / 401 が想定外に多発していないことを確認。

### 5.2 D1 binding sanity check

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT 1"
# expect: 1 行返る
```

`/health/db` が 200 を返しているなら binding は機能している。

### 5.3 WAF block の動作確認（任意）

allowlist 外の IP（自宅 / モバイル）から:

```bash
curl -sS -H "X-Health-Token: $TOK" -w "%{http_code}\n" -o /dev/null \
  https://ubm-hyogo-api.<account>.workers.dev/health/db
# expect: 403（WAF block）
```

403 が返れば WAF rule が機能している。

## 6. token rotation 手順（90 日ごと）

```bash
# 新値生成
NEW=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')

# 1Password 更新
op item edit "cloudflare-api" "HEALTH_DB_TOKEN[password]=$NEW" --vault UBM-Hyogo

# Cloudflare に投入（staging → production の順）
echo "$NEW" | bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env staging
echo "$NEW" | bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env production

# 外部監視 SaaS の probe header を新値に更新

# 旧値で probe してくる経路があれば 401 が増えるため、5 分程度監視
unset NEW
```

> **同時投入による短時間 mismatch のリスク**: rotation 中に外部監視が旧 token で叩くと 401 になる。許容できない場合は `HEALTH_DB_TOKEN` と `HEALTH_DB_TOKEN_NEXT` の 2 値受理に拡張する future work がある（本 PR では対象外）。

## 7. ロールバック

### 7.1 deploy ロールバック

```bash
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production
# 1 つ前の VERSION_ID を取得
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
```

### 7.2 token 漏洩時の即応

1. §6 の rotation を即時実施
2. Workers logs を `bash scripts/cf.sh tail` で 24 時間分 grep し旧 token を使った probe IP を抽出
3. 必要に応じて WAF rule で IP block 追加

### 7.3 WAF rule 解除事故時

1. dashboard → WAF → 解除されたルールを Re-enable
2. endpoint は token gate が残っているため D1 ping は通らない（defense in depth）

## 8. インシデント対応 quick ref

| 症状 | 一次対応 |
| --- | --- |
| `/health/db` が常時 503 + `error: "HEALTH_DB_TOKEN unconfigured"` | §2 の secret 投入漏れ。`secret list` で確認 → `secret put` で再投入 |
| `/health/db` が常時 503 + 別 error | D1 障害。`cf.sh d1 execute "SELECT 1"` で binding 直接確認 |
| `/health/db` が 401 を返す（外部監視からも） | token mismatch。1Password と secret list を再確認 → 必要なら rotation |
| `/health/db` が 404 | deploy 反映漏れ。`deployments list` で latest を確認 |
| 401 が外部から 50/min 以上発生 | probing 兆候。WAF rate limit 閾値を引き下げ + IP allowlist 見直し |

## 9. チェックリスト（投入時に印刷推奨）

- [ ] UT-22 D1 migration 完了確認（§0.1）
- [ ] `HEALTH_DB_TOKEN` 1Password 登録（§1）
- [ ] staging secret 投入（§2.1）
- [ ] production secret 投入（§2.2）
- [ ] WAF rule `health-db-protect` 適用（§3.1）
- [ ] WAF rate limit `health-db-rate-limit` 適用（§3.2）
- [ ] staging deploy（§4.1）
- [ ] staging smoke 3 件 PASS（§4.2）
- [ ] production deploy（§4.3）
- [ ] production smoke 3 件 PASS（§4.4）
- [ ] Workers tail 10 分観察 異常なし（§5.1）
- [ ] WAF block 動作確認（§5.3）
- [ ] token rotation 日付をカレンダーに登録（90 日後）

## 10. 不変条件チェック

- `apps/web/wrangler.toml` を編集していない（不変条件 #5）
- secret は repo にコミットしていない（CLAUDE.md §シークレット管理）
- token 値を log / Slack / PR 本文に貼っていない
