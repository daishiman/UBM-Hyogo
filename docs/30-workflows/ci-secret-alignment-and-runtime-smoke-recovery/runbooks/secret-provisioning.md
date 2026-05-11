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

### ターミナル scrollback 注意

`bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT id FROM members ..."` の実行結果（UUID を含む member id）や、`gh secret set <NAME> --env staging-runtime-smoke <<< '実値'` の標準入力に渡した値は **terminal scrollback に残る**。投入後は以下に従う:

- `clear` でスクロールバックを消去する（必要に応じて `printf '\033[3J'` も併用）
- 複数の secret 値を同時に paste しない（誤コピー混入防止）
- IDE 統合ターミナル / `script(1)` ログ / tmux capture-pane の出力先にも残らないか確認する

### 推奨: 1Password 経由パイプ（正規経路）

prompt / heredoc を使わず、1Password から直接 stdin に流し込む形を**正規経路**とする。値はファイルにも scrollback にも残らない:

```bash
op read 'op://Cloudflare/UBM-Hyogo Staging/admin-bearer' | \
  gh secret set STAGING_ADMIN_BEARER --env staging-runtime-smoke --body-file -
```

5 secret 分を一括実行する正規経路は [`scripts/smoke/provision-staging-secrets.sh`](../../../../scripts/smoke/provision-staging-secrets.sh) に集約されている。上記コマンドや本ドキュメント先頭の手動 `gh secret set` 列挙は、op 参照が未整備な場合の **fallback** として位置づける。

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

実値の漏洩経路を AI / user の責務操作別に分解する:

1. **bearer / webhook 実値の AI 入力禁止**: `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `SLACK_WEBHOOK_INCIDENT` などの実値を AI チャット・プロンプト・commit message・PR description・ドキュメントいずれにも貼り付けない（AI のコンテキスト window 経由で学習混入する可能性があるため）。
2. **DevTools Network からコピーした `Authorization` ヘッダ値の AI チャット貼付禁止**: bearer 取得作業中に DevTools からコピーした `Authorization: Bearer eyJ...` の文字列を AI に「これで合ってますか」等の確認目的でも貼らない。形式チェックは user 単独で行う。
3. **`d1 execute` 出力（UUID 含む member id）の AI チャット貼付禁止**: `STAGING_MEMBER_ID` の値となる UUID は PII リンク鍵として機能するため、`bash scripts/cf.sh d1 execute` の生出力を AI に転載しない。値の取得・投入は user 単独で行い、AI には「投入完了」のみを伝える。
4. **`op read` の AI 代行禁止**: `op read 'op://...'` の実行は **user 単独**で行う。AI エージェントに `op read` や `op run` の代行実行を依頼しない（1Password CLI の session token が AI 経由のシェルに渡る経路を作らない）。

加えて以下の従来禁止事項を継続する:

- このドキュメント・他ドキュメント・commit message・PR description に**実値を書かない**
- bearer / webhook URL を Slack や Issue にそのまま貼らない
