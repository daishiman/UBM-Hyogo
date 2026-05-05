# Secrets Placement Matrix

> Phase 2 設計成果物 2 / Owner: UT-05A-FOLLOWUP-OAUTH
> **実値転記禁止**。本表は `op://` 参照のみ。

## 配置表

| key | 役割 | 1Password 参照 | Cloudflare Secrets (staging) | Cloudflare Secrets (production) | GitHub Secrets | ローカル `.env` |
| --- | --- | --- | --- | --- | --- | --- |
| `AUTH_SECRET` | Auth.js JWT 署名鍵 | `op://Vault/UBM-Auth/auth-secret-staging` / `op://Vault/UBM-Auth/auth-secret-prod` | YES（staging 値） | YES（production 値） | YES（CI test 用） | `op://` 参照のみ |
| `GOOGLE_CLIENT_ID` | OAuth client ID（推奨名） | `op://Vault/UBM-Auth/google-client-id` | YES | YES | NO | `op://` 参照のみ |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret（推奨名） | `op://Vault/UBM-Auth/google-client-secret` | YES | YES | NO | `op://` 参照のみ |
| `AUTH_GOOGLE_ID` | OAuth client ID（legacy alias） | `op://Vault/UBM-Auth/google-client-id` | 任意（互換用のみ） | 任意（互換用のみ） | NO | `op://` 参照のみ |
| `AUTH_GOOGLE_SECRET` | OAuth client secret（legacy alias） | `op://Vault/UBM-Auth/google-client-secret` | 任意（互換用のみ） | 任意（互換用のみ） | NO | `op://` 参照のみ |
| `AUTH_TRUST_HOST` | Auth.js host trust | - | `true`（vars） | `true`（vars） | NO | 通常文字列 |
| `AUTH_URL` | Auth.js base URL | - | `https://<staging-domain>`（vars） | `https://<production-domain>`（vars） | NO | 通常文字列 |

## 設計判断

- `AUTH_SECRET` のみ staging / production で **異なる値**（漏洩時 blast radius 限定）
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` は同一 OAuth client なので **同値**。実装は `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` も alias として読むが、新規投入の推奨名は `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `AUTH_TRUST_HOST` / `AUTH_URL` は **平文 `vars`**（secrets ではない）として `wrangler.toml` の `[env.<env>.vars]` に書く

## 注入経路（正本）

```bash
# Cloudflare Secrets 投入（実値は stdin で 1Password から渡す。ファイルに残さない）
op read "op://Vault/UBM-Auth/auth-secret-staging" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging

# GitHub Secrets 投入（CI 用 AUTH_SECRET のみ）
gh secret set AUTH_SECRET --body "$(op read 'op://Vault/UBM-Auth/auth-secret-ci')"

# ローカル .env は op:// 参照のみ
# AUTH_SECRET=op://Vault/UBM-Auth/auth-secret-staging
# 実行は scripts/with-env.sh が op run --env-file=.env でラップ
```

## 禁止事項

- 実値を仕様書 / outputs / log / git 履歴 / Slack / DM に貼らない
- `wrangler login` を使わず、`~/Library/Preferences/.wrangler/config/default.toml` を不在固定
- `wrangler` 直接呼び出し禁止。**`bash scripts/cf.sh` 経由のみ**
- screenshot で client_secret / api_token / session_token が表示される画面を撮らない（撮ったらマスク or 削除 + rotate）

## Phase 12 で参照する仕様書

- `docs/00-getting-started-manual/specs/02-auth.md`（secrets 配置の正本リンク追加）
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`（B-03 状態反映時に再参照）
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`（既存仕様と整合確認）
