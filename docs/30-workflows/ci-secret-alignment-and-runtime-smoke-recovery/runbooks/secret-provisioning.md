# `staging-runtime-smoke` Environment Secret Provisioning

## 目的

GitHub Environment `staging-runtime-smoke` に runtime smoke を実行するために必要な 5 つの secret を投入する。**実値はこのドキュメントに書かない**。各 secret の取得経路のみを示す。

## 必要 secret 一覧

| secret 名 | 取得元 | 例形式（**実値ではない**） |
|---|---|---|
| `STAGING_API_BASE` | `apps/api/wrangler.toml` の staging worker URL（例 `ubm-hyogo-api-staging.<account>.workers.dev`） | `https://...workers.dev` |
| `STAGING_ADMIN_BEARER` | staging 環境で admin アカウント (`manjumoto.daishi@senpai-lab.com`) でログイン → DevTools Network → `/api/...` リクエストの `Authorization: Bearer <jwt>` ヘッダ値 | `eyJ...` (JWT) |
| `STAGING_MEMBER_ID` | staging D1 (`ubm-hyogo-db-staging`) で一般会員レコードの `id` を `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT id FROM members WHERE email = 'manju.manju.03.28@gmail.com';"` で取得 | UUID |
| `STAGING_ME_BEARER` | staging 環境で一般会員アカウント (`manju.manju.03.28@gmail.com`) でログイン → DevTools 同様に bearer 取得 | `eyJ...` |
| `SLACK_WEBHOOK_INCIDENT` | 1Password Vault `UBM-Hyogo / Slack incident webhook` フィールド | `https://hooks.slack.com/services/...` |

## 投入手順（ユーザー操作）

```bash
# 必要な権限: repo admin
# 値はその場で貼る。ファイルやコマンド履歴には残さない (HISTCONTROL=ignorespace を有効にして先頭スペース付きで実行する)
 gh secret set STAGING_API_BASE       --env staging-runtime-smoke
 gh secret set STAGING_ADMIN_BEARER   --env staging-runtime-smoke
 gh secret set STAGING_MEMBER_ID      --env staging-runtime-smoke
 gh secret set STAGING_ME_BEARER      --env staging-runtime-smoke
 gh secret set SLACK_WEBHOOK_INCIDENT --env staging-runtime-smoke
```

各コマンドはプロンプトで値の入力を求める。値は標準入力にペーストして Enter → Ctrl+D。

## 投入確認

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort
# 期待出力 (5 行):
# SLACK_WEBHOOK_INCIDENT
# STAGING_ADMIN_BEARER
# STAGING_API_BASE
# STAGING_ME_BEARER
# STAGING_MEMBER_ID
```

## 動作確認（再実行）

```bash
gh workflow run runtime-smoke-staging.yml --ref dev
gh run watch
```

`verify required staging secrets` step が PASS し、`run runtime smoke` step が exit 0 で完了することを確認する。

## ローテーション運用

bearer は短命。失効時は同じ手順で `gh secret set` で上書きする。`STAGING_API_BASE` / `STAGING_MEMBER_ID` は変更頻度が低いので worker 名変更や seed 入れ直しのタイミングのみ更新する。

## 禁止事項

- このドキュメント・他ドキュメント・commit message・PR description に**実値を書かない**
- bearer / webhook URL を Slack や Issue にそのまま貼らない
- AI エージェントに `gh secret set <NAME> --env ... <<< '<value>'` の実値投入を依頼しない
