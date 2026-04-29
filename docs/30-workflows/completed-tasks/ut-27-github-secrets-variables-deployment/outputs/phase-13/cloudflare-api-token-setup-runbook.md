# Cloudflare API Token Setup Runbook

> 目的: Cloudflare の staging / production 用 API Token を取得し、1Password と GitHub Environment Secrets に設定する。
> Discord は今回の対象外。`DISCORD_WEBHOOK_URL` は作成・設定しない。

## 完了条件

この手順の完了状態は次の通り。

```text
GitHub Environments:
- staging exists
- production exists

GitHub Environment Secrets:
- staging / CLOUDFLARE_API_TOKEN exists
- production / CLOUDFLARE_API_TOKEN exists

GitHub Repository Variables:
- CLOUDFLARE_ACCOUNT_ID exists
- CLOUDFLARE_PAGES_PROJECT exists

GitHub Repository Secrets:
- CLOUDFLARE_API_TOKEN does not exist
- DISCORD_WEBHOOK_URL does not exist
```

## 0. 前提

対象:

```text
GitHub repository: daishiman/UBM-Hyogo
1Password vault: Employee
1Password item: ubm-hyogo-env
```

必要な CLI:

```bash
gh auth status
op account list
```

`op` が未サインインの場合:

```bash
op signin --account manju.1password.com
```

2026-04-29 時点の実測結果:

```text
gh auth status: PASS
  logged in to github.com as daishiman

op account list: PASS
  manju.1password.com
  my.1password.com

op whoami: FAIL
  account is not signed in
```

判定:

```text
PARTIAL: GitHub CLI は利用可能。1Password CLI は account 一覧は見えるが、値読み取りには再サインインが必要。
```

次アクション:

```bash
op signin --account manju.1password.com
```

## 1. 現在状態を確認

GitHub Environments:

```bash
gh api repos/daishiman/UBM-Hyogo/environments --jq '.environments[] | .name'
```

Repository Secrets:

```bash
gh secret list
```

Environment Secrets:

```bash
gh secret list --env staging
gh secret list --env production
```

注意: environment 名の末尾に `:` を付けない。`staging:` / `production:` は存在しない別 environment 名として扱われ、GitHub API が 404 を返す。

```bash
# NG
gh secret list --env staging:
gh secret list --env production:

# OK
gh secret list --env staging
gh secret list --env production
```

Repository Variables:

```bash
gh api repos/daishiman/UBM-Hyogo/actions/variables --jq '.variables[] | [.name,.value] | @tsv'
```

Discord 参照が workflow に残っていないこと:

```bash
rg -n "DISCORD_WEBHOOK_URL|Notify Discord|secrets\\.DISCORD_WEBHOOK_URL" \
  .github/workflows/backend-ci.yml \
  .github/workflows/web-cd.yml \
  || echo "OK: Discord unused"
```

2026-04-29 時点の実測結果:

```text
GitHub Environments:
- dev
- main
- production
- staging

Repository Secrets:
- CLOUDFLARE_API_TOKEN
- GOOGLE_SERVICE_ACCOUNT_JSON

Environment Secrets:
- staging: no secrets found
- production: no secrets found

Mistyped command:
- `gh secret list --env staging:` -> HTTP 404 (`staging:` という environment は存在しない)
- `gh secret list --env production:` -> HTTP 404 (`production:` という environment は存在しない)

Repository Variables:
- CLOUDFLARE_ACCOUNT_ID = b3dde7be1cd856788fc47595ac455475
- CLOUDFLARE_PAGES_PROJECT = ubm-hyogo-web
- FORM_ID = existing unrelated variable
- SHEET_ID = existing unrelated variable

Discord workflow refs:
- backend-ci.yml: no DISCORD_WEBHOOK_URL refs after workflow cleanup
- web-cd.yml: no DISCORD_WEBHOOK_URL refs after workflow cleanup
```

判定:

```text
PARTIAL:
- Environments は作成済み。
- Repository Variables は今回必要な 2 件が設定済み。
- Environment Secrets は未設定。
- Repository Secret CLOUDFLARE_API_TOKEN が残っているため、Environment Secrets 設定後に削除する。
- Discord は今回不要で、workflow 参照も削除済み。
```

次アクション:

```text
Cloudflare API Token を staging / production 用に 2 つ作成し、1Password に保存してから Environment Secrets に投入する。
```

## 2. Cloudflare Pages project 名を確認

GitHub Variable の現在値:

```bash
gh api repos/daishiman/UBM-Hyogo/actions/variables \
  --jq '.variables[] | select(.name=="CLOUDFLARE_PAGES_PROJECT") | .value'
```

2026-04-29 時点の確認結果:

```text
CLOUDFLARE_PAGES_PROJECT = ubm-hyogo-web
```

この repository では `web-cd.yml` が次の project 名へ deploy する。

```text
production: CLOUDFLARE_PAGES_PROJECT
staging:    CLOUDFLARE_PAGES_PROJECT + "-staging"
```

現在値は `ubm-hyogo-web` なので、Cloudflare 側に存在すべき Pages project は次の 2 つ。

```text
ubm-hyogo-web
ubm-hyogo-web-staging
```

2026-04-29 時点の `bash scripts/cf.sh pages project list` 実測結果:

```text
ubm-hyogo-web-staging   exists
ubm-hyogo-web           exists
```

判定:

```text
PASS: GitHub Variable と Cloudflare Pages project 名は整合している。
```

### 2.1 コマンドで確認する

まず GitHub Variable の値を `CF_PAGES_PROJECT` に入れる。

```bash
export CF_PAGES_PROJECT="$(
  gh api repos/daishiman/UBM-Hyogo/actions/variables \
    --jq '.variables[] | select(.name=="CLOUDFLARE_PAGES_PROJECT") | .value'
)"

echo "$CF_PAGES_PROJECT"
```

Cloudflare Pages project 一覧を取得する。

```bash
bash scripts/cf.sh pages project list
```

`scripts/cf.sh` は 1Password 経由で Cloudflare 認証情報を注入するため、`op` が未サインインの場合は先にサインインする。

```bash
op signin --account manju.1password.com
```

一覧から production / staging の 2 project が存在するか確認する。

```bash
bash scripts/cf.sh pages project list | rg -x "$CF_PAGES_PROJECT|${CF_PAGES_PROJECT}-staging"
```

期待値:

```text
ubm-hyogo-web
ubm-hyogo-web-staging
```

より厳密に判定する場合:

```bash
bash scripts/cf.sh pages project list > /tmp/ubm-hyogo-pages-projects.txt

rg -x "$CF_PAGES_PROJECT" /tmp/ubm-hyogo-pages-projects.txt \
  && echo "OK: production Pages project exists"

rg -x "${CF_PAGES_PROJECT}-staging" /tmp/ubm-hyogo-pages-projects.txt \
  && echo "OK: staging Pages project exists"
```

どちらかが見つからない場合:

```text
production が無い: CLOUDFLARE_PAGES_PROJECT の値が違う、または production Pages project が未作成
staging が無い: staging Pages project が未作成、または naming rule が違う
```

### 2.2 Dashboard で確認する

CLI が使えない場合は Cloudflare Dashboard で実 project 名を確認する。

```text
Cloudflare Dashboard
-> Workers & Pages
-> Pages
-> project name を確認
```

値が違う場合だけ修正する。

```bash
gh api \
  --method PATCH \
  repos/daishiman/UBM-Hyogo/actions/variables/CLOUDFLARE_PAGES_PROJECT \
  -f name='CLOUDFLARE_PAGES_PROJECT' \
  -f value='<正しいbase名>'
```

## 3. Cloudflare API Token を staging 用に作成

Cloudflare Dashboard で作成する。

```text
Cloudflare Dashboard
-> 右上プロフィール
-> My Profile
-> API Tokens
-> Create Token
-> Create Custom Token
```

Token name:

```text
ubm-hyogo-cd-staging-YYYYMMDD
```

Permissions:

```text
Account / Cloudflare Pages / Edit
Account / Workers Scripts / Edit
Account / D1 / Edit
Account / Account Settings / Read
```

Account Resources:

```text
Include / Specific account / 対象 Cloudflare account
```

禁止:

```text
Global API Key を使わない
Zone.* を付けない
Account.* の全権限を付けない
```

作成後に token が一度だけ表示される。値をコピーする。

2026-04-29 時点の実測結果:

```text
NOT DONE: staging 用 Cloudflare API Token はまだ取得していない。
```

判定:

```text
BLOCKED: GitHub staging environment secret に投入する値がまだ無い。
```

次アクション:

```text
Cloudflare Dashboard で ubm-hyogo-cd-staging-YYYYMMDD を作成し、表示された token を 1Password の CLOUDFLARE_API_TOKEN_STAGING に保存する。
```

## 4. Cloudflare API Token を production 用に作成

同じ手順で production 用を作成する。

Token name:

```text
ubm-hyogo-cd-production-YYYYMMDD
```

Permissions:

```text
Account / Cloudflare Pages / Edit
Account / Workers Scripts / Edit
Account / D1 / Edit
Account / Account Settings / Read
```

Account Resources:

```text
Include / Specific account / 対象 Cloudflare account
```

作成後に token が一度だけ表示される。値をコピーする。

2026-04-29 時点の実測結果:

```text
NOT DONE: production 用 Cloudflare API Token はまだ取得していない。
```

判定:

```text
BLOCKED: GitHub production environment secret に投入する値がまだ無い。
```

次アクション:

```text
Cloudflare Dashboard で ubm-hyogo-cd-production-YYYYMMDD を作成し、表示された token を 1Password の CLOUDFLARE_API_TOKEN_PRODUCTION に保存する。
```

## 5. 1Password に保存

1Password アプリで次を開く。

```text
Vault: Employee
Item: ubm-hyogo-env
```

次の field を追加または更新する。

```text
CLOUDFLARE_API_TOKEN_STAGING
CLOUDFLARE_API_TOKEN_PRODUCTION
CLOUDFLARE_PAGES_PROJECT
```

値:

```text
CLOUDFLARE_API_TOKEN_STAGING    = staging token
CLOUDFLARE_API_TOKEN_PRODUCTION = production token
CLOUDFLARE_PAGES_PROJECT        = Cloudflare Pages project base name
```

既存の `CLOUDFLARE_API_TOKEN` field は、環境が曖昧なので今回の GitHub 設定には使わない。

CLI で読めるか確認する。値は出力しない。

```bash
for field in \
  CLOUDFLARE_API_TOKEN_STAGING \
  CLOUDFLARE_API_TOKEN_PRODUCTION \
  CLOUDFLARE_ACCOUNT_ID \
  CLOUDFLARE_PAGES_PROJECT
do
  printf "%s: " "$field"
  op read "op://Employee/ubm-hyogo-env/$field" >/dev/null && echo OK || echo NG
done
```

すべて `OK` になってから次へ進む。

2026-04-29 17:02 時点の実測結果:

```text
CLOUDFLARE_API_TOKEN_STAGING: OK
CLOUDFLARE_API_TOKEN_PRODUCTION: OK
CLOUDFLARE_ACCOUNT_ID: OK
CLOUDFLARE_PAGES_PROJECT: NG
  item 'Employee/ubm-hyogo-env' does not have a field 'CLOUDFLARE_PAGES_PROJECT'
```

2026-04-29 17:xx 時点の追加実測結果:

```text
CLOUDFLARE_PAGES_PROJECT: OK
```

判定:

```text
PASS:
- CLOUDFLARE_API_TOKEN_STAGING / CLOUDFLARE_API_TOKEN_PRODUCTION は 1Password から読める。
- CLOUDFLARE_ACCOUNT_ID は 1Password から読める。
- CLOUDFLARE_PAGES_PROJECT は 1Password から読める。
```

次アクション:

```text
Step 7 / Step 9 の GitHub 同期へ進む。
```

1Password CLI で追加する場合:

```bash
op item edit "ubm-hyogo-env" --vault Employee \
  "CLOUDFLARE_PAGES_PROJECT[text]=ubm-hyogo-web"
```

追加後の再確認:

```bash
op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_PAGES_PROJECT'
```

## 6. GitHub Environments を作成

再実行しても問題ない。

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging -X PUT --silent
gh api repos/daishiman/UBM-Hyogo/environments/production -X PUT --silent
```

確認:

```bash
gh api repos/daishiman/UBM-Hyogo/environments --jq '.environments[] | .name'
```

期待:

```text
staging
production
```

2026-04-29 17:02 時点の実測結果:

```text
dev
main
production
staging
```

判定:

```text
PASS: staging / production の GitHub Environments は作成済み。
dev / main は既存 environment として存在するが、今回の secret 投入対象ではない。
```

次アクション:

```text
Environment Secret CLOUDFLARE_API_TOKEN を staging / production へ投入する。
```

## 7. Environment Secrets を設定

1Password から一時変数に読み込む。

```bash
export TMP_CF_TOKEN_STG="$(op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING')"
export TMP_CF_TOKEN_PRD="$(op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_PRODUCTION')"
```

GitHub environment secret に設定する。

```bash
gh secret set CLOUDFLARE_API_TOKEN --env staging --body "$TMP_CF_TOKEN_STG"
gh secret set CLOUDFLARE_API_TOKEN --env production --body "$TMP_CF_TOKEN_PRD"
```

一時変数を消す。

```bash
unset TMP_CF_TOKEN_STG TMP_CF_TOKEN_PRD
```

2026-04-29 17:xx 時点の実測結果:

```text
gh secret list --env staging
  NAME                  UPDATED
  CLOUDFLARE_API_TOKEN  less than a minute ago

gh secret list --env production
  NAME                  UPDATED
  CLOUDFLARE_API_TOKEN  less than a minute ago
```

注意: `--env staging:` のように末尾 `:` を付けると 404 になる。正しくは `--env staging`。

判定:

```text
PASS: staging / production の Environment Secret CLOUDFLARE_API_TOKEN は設定済み。
```

次アクション:

```text
古い repository secret CLOUDFLARE_API_TOKEN を削除する。
```

## 8. 古い repository secret を削除

repository secret に `CLOUDFLARE_API_TOKEN` が残っていると、environment secret と責務が曖昧になる。

確認:

```bash
gh secret list | rg '^CLOUDFLARE_API_TOKEN'
```

出た場合は削除する。

```bash
gh secret delete CLOUDFLARE_API_TOKEN
```

2026-04-29 17:xx 時点の実測結果:

```text
gh secret delete CLOUDFLARE_API_TOKEN:
  HTTP 404

gh secret list:
  GOOGLE_SERVICE_ACCOUNT_JSON
```

判定:

```text
PASS:
- repository secret CLOUDFLARE_API_TOKEN は存在しない。
- gh secret delete の HTTP 404 は「削除対象が既に存在しない」ためで、今回の期待状態と一致する。
```

次アクション:

```text
Step 8 は完了。次は Step 11 の最終確認と Step 12 の 1Password Notes 更新へ進む。
```

削除してよい条件:

```text
staging secrets に CLOUDFLARE_API_TOKEN がある
production secrets に CLOUDFLARE_API_TOKEN がある
```

## 9. Repository Variables を確認・必要なら更新

確認:

```bash
gh api repos/daishiman/UBM-Hyogo/actions/variables --jq '.variables[] | [.name,.value] | @tsv'
```

`CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_PAGES_PROJECT` が存在していて、値が正しければ何もしない。

必要な場合だけ 1Password から更新する。

```bash
export TMP_CF_ACCOUNT_ID="$(op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_ACCOUNT_ID')"
export TMP_CF_PAGES_PROJECT="$(op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_PAGES_PROJECT')"

gh api \
  --method PATCH \
  repos/daishiman/UBM-Hyogo/actions/variables/CLOUDFLARE_ACCOUNT_ID \
  -f name='CLOUDFLARE_ACCOUNT_ID' \
  -f value="$TMP_CF_ACCOUNT_ID"

gh api \
  --method PATCH \
  repos/daishiman/UBM-Hyogo/actions/variables/CLOUDFLARE_PAGES_PROJECT \
  -f name='CLOUDFLARE_PAGES_PROJECT' \
  -f value="$TMP_CF_PAGES_PROJECT"

unset TMP_CF_ACCOUNT_ID TMP_CF_PAGES_PROJECT
```

2026-04-29 17:xx 時点の実測結果:

```text
CLOUDFLARE_ACCOUNT_ID = b3dde7be1cd856788fc47595ac455475
CLOUDFLARE_PAGES_PROJECT = ubm-hyogo-web
FORM_ID = 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg
SHEET_ID = 10XQqUko2A5jFXT-J0ibvPt3KUX56divqEk6kDccH5vw
```

2026-04-29 17:xx 時点で、1Password から読み出した `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_PAGES_PROJECT` を使って `PATCH` を再実行済み。再確認後も上記の値で維持されている。

判定:

```text
PASS:
- CLOUDFLARE_ACCOUNT_ID は設定済み。
- CLOUDFLARE_PAGES_PROJECT は設定済み。
- 1Password を source にした再同期も完了。
- FORM_ID / SHEET_ID は別用途の既存 variable なので変更しない。
```

次アクション:

```text
Repository Variables の追加作業は不要。
```

変数が存在しない場合は `POST` で作成する。

```bash
export TMP_CF_ACCOUNT_ID="$(op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_ACCOUNT_ID')"
export TMP_CF_PAGES_PROJECT="$(op read 'op://Employee/ubm-hyogo-env/CLOUDFLARE_PAGES_PROJECT')"

gh api \
  --method POST \
  repos/daishiman/UBM-Hyogo/actions/variables \
  -f name='CLOUDFLARE_ACCOUNT_ID' \
  -f value="$TMP_CF_ACCOUNT_ID"

gh api \
  --method POST \
  repos/daishiman/UBM-Hyogo/actions/variables \
  -f name='CLOUDFLARE_PAGES_PROJECT' \
  -f value="$TMP_CF_PAGES_PROJECT"

unset TMP_CF_ACCOUNT_ID TMP_CF_PAGES_PROJECT
```

## 10. Discord を設定しない

今回 Discord は使わない。

実行しない:

```bash
gh secret set DISCORD_WEBHOOK_URL ...
```

既存 secret がある場合だけ削除する。

```bash
gh secret list | rg '^DISCORD_WEBHOOK_URL' && gh secret delete DISCORD_WEBHOOK_URL
```

workflow 参照が残っていないことを確認する。

```bash
rg -n "DISCORD_WEBHOOK_URL|Notify Discord|secrets\\.DISCORD_WEBHOOK_URL" \
  .github/workflows/backend-ci.yml \
  .github/workflows/web-cd.yml \
  || echo "OK: Discord unused"
```

2026-04-29 時点の実測結果:

```text
.github/workflows/backend-ci.yml: Discord refs removed
.github/workflows/web-cd.yml: Discord refs removed
GitHub Secret DISCORD_WEBHOOK_URL: not required
```

判定:

```text
PASS: 今回 Discord は不要。workflow からも参照を削除済み。
```

次アクション:

```text
DISCORD_WEBHOOK_URL は作成しない。既に GitHub Secret に存在する場合のみ削除する。
```

## 11. 最終確認

一括確認:

```bash
echo "--- repo secrets ---"
gh secret list

echo "--- staging secrets ---"
gh secret list --env staging

echo "--- production secrets ---"
gh secret list --env production

echo "--- repo variables ---"
gh api repos/daishiman/UBM-Hyogo/actions/variables --jq '.variables[] | [.name,.value] | @tsv'

echo "--- discord refs ---"
rg -n "DISCORD_WEBHOOK_URL|Notify Discord|secrets\\.DISCORD_WEBHOOK_URL" \
  .github/workflows/backend-ci.yml \
  .github/workflows/web-cd.yml \
  || echo "OK: Discord unused"
```

期待:

```text
repo secrets:
- GOOGLE_SERVICE_ACCOUNT_JSON
- CLOUDFLARE_API_TOKEN is absent
- DISCORD_WEBHOOK_URL is absent

staging secrets:
- CLOUDFLARE_API_TOKEN

production secrets:
- CLOUDFLARE_API_TOKEN

repo variables:
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_PAGES_PROJECT

discord refs:
- OK: Discord unused
```

2026-04-29 17:xx 時点の最終実測結果:

```text
repo secrets:
- GOOGLE_SERVICE_ACCOUNT_JSON exists
- CLOUDFLARE_API_TOKEN absent

staging secrets:
- CLOUDFLARE_API_TOKEN exists (about 5 minutes ago)

production secrets:
- CLOUDFLARE_API_TOKEN exists (about 5 minutes ago)

repo variables:
- CLOUDFLARE_ACCOUNT_ID = b3dde7be1cd856788fc47595ac455475
- CLOUDFLARE_PAGES_PROJECT = ubm-hyogo-web
- FORM_ID = 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg
- SHEET_ID = 10XQqUko2A5jFXT-J0ibvPt3KUX56divqEk6kDccH5vw

discord refs:
- OK: Discord unused
```

判定:

```text
PASS:
- Variables と Discord 不使用は完了。
- Environments は作成済み。
- Environment Secrets は設定済み。
- repository secret CLOUDFLARE_API_TOKEN は存在しない。
```

次アクション:

```text
Step 12 を実行して 1Password Notes に Last-Updated と GitHub sync 内容を記録する。
```

## 12. 1Password Notes を更新

`Employee / ubm-hyogo-env` の Notes に日時だけを記録する。token 値や token の一部、ハッシュは書かない。

```text
Last-Updated: YYYY-MM-DD HH:mm JST
GitHub sync:
- CLOUDFLARE_API_TOKEN_STAGING -> GitHub environment secret staging/CLOUDFLARE_API_TOKEN
- CLOUDFLARE_API_TOKEN_PRODUCTION -> GitHub environment secret production/CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID -> GitHub repository variable CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_PAGES_PROJECT -> GitHub repository variable CLOUDFLARE_PAGES_PROJECT
Discord: unused / not configured
```

2026-04-29 17:xx 時点の実測結果:

```text
PENDING MANUAL NOTE UPDATE:
- GitHub 側同期は完了。
- 1Password Notes の Last-Updated 追記のみ手動で実施する。
```

判定:

```text
WAIT: 1Password Notes へ同期日時を記録すれば完了。
```

次アクション:

```text
1Password Notes に Last-Updated と GitHub sync 内容を追記する。
```

## 13. 次タスクへ進む判定

次のチェックがすべて満たされたら、次タスクへ進める。

```text
[x] Cloudflare API Token staging 作成済み
[x] Cloudflare API Token production 作成済み
[x] 1Password に CLOUDFLARE_API_TOKEN_STAGING 保存済み
[x] 1Password に CLOUDFLARE_API_TOKEN_PRODUCTION 保存済み
[x] 1Password に CLOUDFLARE_PAGES_PROJECT 保存済み
[x] GitHub Environment staging 作成済み
[x] GitHub Environment production 作成済み
[x] staging environment secret CLOUDFLARE_API_TOKEN 設定済み
[x] production environment secret CLOUDFLARE_API_TOKEN 設定済み
[x] repository secret CLOUDFLARE_API_TOKEN 削除済み
[x] repository variable CLOUDFLARE_ACCOUNT_ID 設定済み
[x] repository variable CLOUDFLARE_PAGES_PROJECT 設定済み
[x] Discord secret 未設定
[x] Discord workflow 参照なし
```
