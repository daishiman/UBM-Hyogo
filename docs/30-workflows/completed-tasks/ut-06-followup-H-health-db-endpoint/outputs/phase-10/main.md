# Phase 10 成果物 — ロールアウト・ロールバック

## 1. ロールアウト手順（線形）

### 0. 前提ゲート（Gate 0）

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
# expect: Already applied のみ（UT-22 完了確認）
```

NO-GO: UT-22 未適用の場合、本ロールアウトを中止。

### 1. Secrets 投入（staging → production）

> ユーザー操作。詳細は `outputs/phase-12/operator-runbook.md` §2 参照。

```bash
TOK=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')
echo "$TOK" | op item edit "cloudflare-api" "HEALTH_DB_TOKEN=$TOK" --vault UBM-Hyogo
op read "op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN" | \
  bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env staging
op read "op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN" | \
  bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env production
```

### 2. Cloudflare WAF rule 設定

> ユーザー操作（Cloudflare dashboard）。詳細は operator-runbook §3 参照。

- Path: `/health/db`
- Action: rate limit 60 req/min/IP + IP allowlist（外部監視 SaaS の egress IP）

### 3. デプロイ（staging）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

### 4. staging smoke

```bash
TOK=$(op read "op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN")
# S-03 成功確認
curl -sS -H "X-Health-Token: $TOK" -w "\n%{http_code}\n" \
  https://ubm-hyogo-api-staging.<account>.workers.dev/health/db
# expect: {"ok":true,"db":"ok","check":"SELECT 1"}\n200

# S-07 token なし → 401
curl -sS -w "\n%{http_code}\n" \
  https://ubm-hyogo-api-staging.<account>.workers.dev/health/db
# expect: 401
```

### 5. デプロイ（production）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

### 6. production smoke

staging と同様の curl で 200 / 401 を確認。

## 2. ロールバック条件

| 条件 | 対応 |
| --- | --- |
| staging smoke S-03 が non-200 で再現 | production deploy を中止し、Workers logs から原因切り分け（`bash scripts/cf.sh tail`） |
| production deploy 後 503 が 5 分以内に 5 回以上 | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env production` |
| token 漏洩を検知 | 即 rotation: 新 token を生成 → `wrangler secret put` で上書き → 旧値で probing する request は 401 へ |

## 3. ロールバック手順

```bash
# 直近の deploy version を確認
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production
# 1 つ前の VERSION_ID を取得して rollback
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
```

> rollback 後も `HEALTH_DB_TOKEN` secret は残るため、token 関連の障害は rollback では解決しない。secret 側を rotation で対応。

## 4. blast radius

| 影響範囲 | リスク |
| --- | --- |
| `apps/api` の他 endpoint | なし（ハンドラ追加のみで既存 route を編集していない） |
| `apps/web` | なし（D1 binding 追加なし、不変条件 #5 維持） |
| 既存 cron / sync ジョブ | なし（`scheduled` ハンドラ未編集） |
| UT-08 通知基盤 | 503 閾値の合意済み前提で同期。未合意ならフリッカーで誤検知 |

## 5. 引き渡し

Phase 11 へ: smoke S-03 / S-07 の期待値テンプレを本ハンドラ実装と完全同期。
