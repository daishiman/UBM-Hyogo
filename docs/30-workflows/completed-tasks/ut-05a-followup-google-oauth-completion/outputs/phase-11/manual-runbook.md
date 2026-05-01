# Phase 11 手動実行 Runbook（ステップバイステップ最詳細版）

> ⚠️ このドキュメントは **「上から順に 1 ステップずつコピペ・操作するだけで Phase 11 が完了する」** 粒度で書いています。各ステップは **必ず期待結果を確認してから次に進む** こと。失敗時は `phase-06.md` の対応 case # を参照。
>
> 判定ルール: `PASS` は期待結果と証跡が揃った項目にだけ記録する。未実行は `TBD`、前提未達は `BLOCKED`、前段失敗により実施しない項目は `SKIPPED`、一部だけ確認できた項目は `PARTIAL` と記録する。後続項目を「予定」「見込み」だけで `PASS` にしない。

---

## 前提準備（10 分）

### 0-0. 作業ディレクトリと出力パス

本ランブック中の `outputs/phase-11/...` というパスは **タスクの workflow ディレクトリ起点**。シェルでは worktree ルートから実行するため、以下のどちらかで対応:

**方式 A（推奨）**: シェル変数で絶対化

```bash
# worktree ルートで実行
export TASK_DIR="docs/30-workflows/ut-05a-followup-google-oauth-completion"
export STG="$TASK_DIR/outputs/phase-11/staging"
export PRD="$TASK_DIR/outputs/phase-11/production"
mkdir -p "$STG" "$PRD"

# 以降、ランブック中の `outputs/phase-11/staging/foo` は `"$STG/foo"` に置き換える
```

**方式 B**: workflow ディレクトリに cd して実行（apps/ への相対参照が壊れるため非推奨）

以降の各 step で `outputs/phase-11/staging/<file>` と書かれている箇所は `"$STG/<file>"` と読み替える。

### 0-1. 環境確認

```bash
# 必ず worktree ルートで実行
pwd
# 期待: /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-181640-wt-5

# Node 24 / pnpm 10 が使えるか
mise install
mise exec -- node -v   # v24.x
mise exec -- pnpm -v   # 10.x

# 依存インストール
mise exec -- pnpm install
```

### 0-2. 1Password サインイン

```bash
op signin
# 期待: アカウント選択 → 認証完了
op vault list  # vault が表示される
```

### 0-3. 1Password に必要 4 項目があるか確認

```bash
# 値は表示せず、存在のみ確認（item title のみ）
op item list --vault "UBM-Auth" 2>/dev/null | grep -E "auth-secret-staging|auth-secret-prod|google-client-id|google-client-secret"
```

**期待**: 4 行すべて表示される。
**不在の場合**: Console から OAuth client secret を控え、`op item create` で 1Password に登録してから次に進む。

### 0-4. Cloudflare API token 動作確認

```bash
bash scripts/cf.sh whoami
```

**期待**: `You are logged in with the API Token, ...` のような出力。
**失敗の場合**: 1Password の `op://Vault/Cloudflare/api-token` を確認 → `op signin` を再実行。

### 0-5. Console / 外部 Gmail 用意

- ブラウザ A（普段用）: Google Cloud Console で OAuth client の owner 権限がある Google アカウントでログイン済
- ブラウザ B（シークレット）: 後で外部 Gmail での Stage C-3 に使用
- 用意する外部 Gmail: testing user に登録**していない** Gmail を 1 つ（個人用 Gmail で OK）

### 0-6. 実 host 名の取得（仕様書には書かない）

本リポジトリの `apps/web/wrangler.toml` / `apps/api/wrangler.toml` は **`routes` / `pattern` を直書きしていない**ため、host は worker `name` × `*.workers.dev` で決まる。

```bash
# worker name 一覧を確認
grep -nE '^\s*name\s*=' apps/web/wrangler.toml apps/api/wrangler.toml
```

**期待される name**:

| env | apps/web | apps/api |
| --- | --- | --- |
| default (production fallback) | `ubm-hyogo-web` | `ubm-hyogo-api` |
| staging | `ubm-hyogo-web-staging` | `ubm-hyogo-api-staging` |
| production | `ubm-hyogo-web-production` | `ubm-hyogo-api`（default 使用）|

**Cloudflare account の workers.dev サブドメイン取得**（以下のいずれか）:

- **推奨**: <https://dash.cloudflare.com/> → Workers & Pages → 任意の Worker をクリック → 上部 URL の `<subdomain>` を控える
- API 経由:
  ```bash
  bash scripts/cf.sh whoami   # Account ID を控える
  op run --env-file=.env -- bash -c '
    curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      "https://api.cloudflare.com/client/4/accounts/<ACCOUNT_ID>/workers/subdomain"
  ' | jq .
  ```
  期待: `{"result":{"subdomain":"..."},"success":true,...}`

**host 確定式**: `<worker-name>.<account-subdomain>.workers.dev`

例（`<account-subdomain>` を `acme` と仮定）:

- `<staging-domain>` = `ubm-hyogo-web-staging.acme.workers.dev`
- `<production-domain>` = `ubm-hyogo-web-production.acme.workers.dev`
- `<staging-api-domain>` = `ubm-hyogo-api-staging.acme.workers.dev`
- `<production-api-domain>` = `ubm-hyogo-api.acme.workers.dev`

→ 確定した値を **手元のメモ**（コミットしないファイル、例えば `/tmp/hosts.txt`）に控える。
このランブック中の `<staging-domain>` / `<production-domain>` 等は手元メモの値で置換すること。

> 注: Stage A の最初の deploy 後に `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` 実行ログ末尾に実際の `https://...workers.dev` URL が出力される。それが正本。

---

## Stage A: staging smoke（推定 60〜90 分）

### A-1. Console redirect URI 登録（5 分）

1. ブラウザ A で <https://console.cloud.google.com/apis/credentials> を開く
2. プロジェクトが UBM のものか確認（左上のプロジェクトピッカー）
3. **OAuth 2.0 Client IDs** 一覧から該当 client（Web application タイプ）をクリック
4. **Authorized redirect URIs** セクションで以下 3 件すべてが登録されているか確認:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<staging-domain>/api/auth/callback/google`
   - `https://<production-domain>/api/auth/callback/google`
5. 不足分があれば **+ ADD URI** で追加し、末尾スラッシュなしで貼る
6. 右上の **SAVE** をクリック → "Saved" バナー表示確認

7. 結果を Markdown に保存:

```bash
cat > outputs/phase-11/staging/redirect-uri-actual.md <<'EOF'
# Redirect URI 実登録一覧（staging 視点）

| 環境 | URI | 登録状況 |
| --- | --- | --- |
| local dev | http://localhost:3000/api/auth/callback/google | 登録済 |
| staging | https://<staging-domain>/api/auth/callback/google | 登録済 |
| production | https://<production-domain>/api/auth/callback/google | 登録済 |

確認日時: $(date '+%Y-%m-%d %H:%M %Z')
Console URL: https://console.cloud.google.com/apis/credentials
EOF
```

→ 上記の `<staging-domain>` / `<production-domain>` は手元メモの実値に置換して保存。

### A-2. Cloudflare Secrets staging 投入（10 分）

```bash
# === apps/api 側 ===
op read "op://UBM-Auth/auth-secret-staging/credential" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging
# 期待: "Success! Uploaded secret AUTH_SECRET"

op read "op://UBM-Auth/google-client-id/credential" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_ID --config apps/api/wrangler.toml --env staging

op read "op://UBM-Auth/google-client-secret/credential" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.toml --env staging

# === apps/web 側 ===
op read "op://UBM-Auth/auth-secret-staging/credential" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env staging
op read "op://UBM-Auth/google-client-id/credential" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_ID --config apps/web/wrangler.toml --env staging
op read "op://UBM-Auth/google-client-secret/credential" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/web/wrangler.toml --env staging
```

> 1Password の項目名 (`auth-secret-staging` 等) と field 名 (`credential`) は実際の vault に合わせて調整。`op item get "auth-secret-staging" --vault UBM-Auth` で構造を確認できる。

```bash
# 配置確認（値は出ない）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \
  > outputs/phase-11/staging/secrets-list-api.txt
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging \
  > outputs/phase-11/staging/secrets-list-web.txt

cat outputs/phase-11/staging/secrets-list-api.txt
# 期待: AUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET の 3 行が含まれる
```

**注意**: ターミナルや screenshot に `op read` の出力行が残っていないか必ず確認（pipe で渡しているので通常は出ないが、ターミナル history に念のため）。

### A-3. staging deploy（5 分）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
# 期待: Worker URL 表示 + "Total Upload" + "Deployed"

bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

### A-4. smoke 9 ケース実行（45 分）

ブラウザ A の **新しいシークレットウィンドウ** で実行（cookie が混ざらないように）。

DevTools を開く（F12）→ Network タブ + Application タブを表示しておく。

#### A-4-1. M-01: `/login` 表示

1. シークレットウィンドウで `https://<staging-domain>/login` にアクセス
2. ログインボタン（Google sign-in）が表示されることを確認
3. **screenshot を `outputs/phase-11/staging/01-login-page.png` に保存**（macOS: Cmd+Shift+4 → 範囲選択 → スペース → ウィンドウクリック）

→ 期待結果と screenshot が揃った場合のみ `manual-smoke-log.md` に `M-01: PASS` と記録。不足があれば `BLOCKED` / `PARTIAL` にする。

#### A-4-2. M-02: Google consent 表示

1. 「Sign in with Google」ボタンをクリック
2. Google アカウント選択画面 → アカウント選択
3. **OAuth consent screen** が表示される（"UBM 兵庫支部会 wants to access your Google Account"）
4. **screenshot を `outputs/phase-11/staging/02-google-consent.png`**

→ 期待結果と screenshot が揃った場合のみ `M-02: PASS`

#### A-4-3. M-03: callback 302

1. consent 画面で **Continue / 許可** をクリック
2. URL バーが一瞬 `<staging-domain>/api/auth/callback/google?code=...&state=...` を経由して `/` に着地
3. DevTools Network タブで `/api/auth/callback/google` リクエストを確認 → Status 302 / Location: `/`
4. **`/` 着地後（URL に code/state が残っていないことを確認してから）screenshot を `outputs/phase-11/staging/03-callback-redirect.png`**

→ callback が期待 URL に着地し、URL に `code` / `state` が残っておらず、Network の 302 / Location が確認できた場合のみ `M-03: PASS`。`/login?gate=...` に戻った場合は `PARTIAL` または `BLOCKED`。

#### A-4-4. M-04: cookie 属性

1. DevTools → **Application タブ → Storage → Cookies → `https://<staging-domain>`**
2. `next-auth.session-token`（または `__Secure-next-auth.session-token`）の属性を確認:
   - `Secure: ✓`
   - `SameSite: Lax`
   - `HttpOnly: ✓`
3. **値（Value 列）はスクロールで隠す or マスク** してから `outputs/phase-11/staging/04-session-json.png` に screenshot

→ session cookie が実際に発行され、属性が確認できた場合のみ `M-04: PASS`。M-03 未達で cookie が無い場合は `SKIPPED`。

#### A-4-5. M-05: session JSON

```bash
# シークレットウィンドウで開いている cookie を抽出して curl で session 取得
# (1) DevTools → Network → Cookies からコピーするか、ブラウザで /api/auth/session を直接開く
# (2) ブラウザで https://<staging-domain>/api/auth/session を開いて JSON 表示

# allowlist 不一致 email でログインした state で:
# JSON が表示されたページを保存（手動 cp or curl で取得）
```

ブラウザで `/api/auth/session` を開き、JSON が `{ "user": { "email": "...", "name": "..." }, "isAdmin": false, ... }` 等で返ってくることを確認 → screenshot 必要なら撮影。
JSON 内容を保存:

```bash
# ブラウザで「ページをソースで保存」または、cookie をエクスポートして curl
# 簡易的には DevTools の Response タブから raw JSON をコピーして:
pbpaste > outputs/phase-11/staging/session-member.json
```

→ `/api/auth/session` が authenticated session JSON を返し、証跡を保存できた場合のみ `M-05: PASS`。`{}` / `null` / 未ログイン / `/login?gate=...` の場合は `BLOCKED` または `SKIPPED`。

#### A-4-6. M-06 / M-07: admin gate

**M-07 から先に実行（不一致 email の状態を保つため）**:

1. 現在のシークレットウィンドウ（allowlist 不一致 email でログイン中）で `https://<staging-domain>/admin` にアクセス
2. URL が `/login?gate=admin` に redirect されることを確認
3. **screenshot を `outputs/phase-11/staging/06-admin-denied.png`**

→ redirect と screenshot が揃った場合のみ `M-07: PASS`

**M-06**:

1. 一旦 sign-out（次の M-08 の手順）するか、別シークレットウィンドウで `admin_users.active` に登録された email でログイン
2. `/admin` にアクセス → 200（Admin ページ表示）
3. **screenshot を `outputs/phase-11/staging/05-admin-allowed.png`**

→ admin ページ 200 と screenshot が揃った場合のみ `M-06: PASS`

#### A-4-7. M-08: sign-out

1. Admin ページ（または header）の sign-out ボタンをクリック
2. DevTools → Application タブで session-token cookie が削除されたことを確認
3. **screenshot を `outputs/phase-11/staging/07-signout.png`**

→ cookie 削除と logout 後の状態が確認できた場合のみ `M-08: PASS`

#### A-4-8. M-09: session 期限切れ

時間制約があるため staging で簡易確認のみ:

1. Auth.js の session 有効期限（既定 30 日）を待つのは現実的でないため、cookie を手動で削除（DevTools → Application → Cookies → Delete）
2. `/admin` にアクセス → `/login` redirect 確認

→ redirect が確認できた場合のみ `M-09: PASS（cookie 手動削除版）` を記録

#### A-4-9. M-10: `/admin/*` 配下任意ルート

1. ログアウト状態（or 不一致 email）で `https://<staging-domain>/admin/members` にアクセス
2. `/login?gate=admin` redirect 確認

→ redirect が確認できた場合のみ `M-10: PASS`

#### A-4-10. M-11: wrangler-dev.log（ローカル）

> local M-11 は Cloudflare Secrets を読まないため、web dev 側へ Auth.js / Google OAuth / internal API の env を明示的に渡す。`AUTH_SECRET` が無い状態で `pnpm --filter web dev` を起動すると `MissingSecret` / `GET /api/auth/providers 500` になり、M-11 は `BLOCKED`。
>
> `STG` はシェル変数なので、**新しいターミナルを開くたびに再設定が必要**。`grep: /wrangler-dev.log: No such file or directory` と出た場合は `STG` が空で、`"$STG/wrangler-dev.log"` が `/wrangler-dev.log` に展開されている。
>
> M-11 は API dev / web dev を **それぞれ 1 本だけ**起動して確認する。複数の `wrangler dev` が残ると `8788` / `8790` などポートが分かれ、web が見ている API と保存中の `wrangler-dev.log` がズレる。迷ったら先に既存 dev process を止めてからやり直す。

既存 dev process を止める（M-11 をやり直す前に実行）:

```bash
# 実行中の dev process を確認
ps -axo pid,ppid,command | grep -E "wrangler dev|next dev|pnpm --filter (api|web) dev" | grep -v grep

# 出た PID を止める。例: 12345 23456 なら:
# kill 12345 23456
```

PID を個別に選ぶのが難しい場合は、この worktree で起動した dev process だけを狙って止める:

```bash
pkill -f "task-20260430-181640-wt-5.*wrangler dev" 2>/dev/null || true
pkill -f "task-20260430-181640-wt-5.*next dev" 2>/dev/null || true
```

別ターミナルで API worker を起動し、ログを保存:

```bash
export TASK_DIR="docs/30-workflows/ut-05a-followup-google-oauth-completion"
export STG="$TASK_DIR/outputs/phase-11/staging"
mkdir -p "$STG"
echo "$STG"
# 期待: docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/staging

mise exec -- pnpm --filter api dev 2>&1 | tee "$STG/wrangler-dev.log" &
API_DEV_PID=$!
```

API port を確認:

```bash
grep -E "Ready on http://localhost:[0-9]+" "$STG/wrangler-dev.log"
```

例: `Ready on http://localhost:8788` なら、次の web 起動では `INTERNAL_API_BASE_URL="http://localhost:8788"` を使う。

`STG` の再設定を忘れやすい場合は、変数を使わず絶対的な相対パスで確認してもよい:

```bash
grep -E "Ready on http://localhost:[0-9]+" \
  "docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/staging/wrangler-dev.log"
```

別ターミナルで web を起動し、ログを保存:

```bash
export TASK_DIR="docs/30-workflows/ut-05a-followup-google-oauth-completion"
export STG="$TASK_DIR/outputs/phase-11/staging"
mkdir -p "$STG"
echo "$STG"
# 期待: docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/staging

# 1Password の実 item / field 構造に合わせてどちらかを使う。
export AUTH_SECRET="$(op item get ubm-hyogo-env --vault Employee --fields label=AUTH_SECRET --reveal)"
# export AUTH_SECRET="$(op read "op://UBM-Auth/auth-secret-staging/credential")"

export GOOGLE_CLIENT_ID="$(op item get ubm-hyogo-env --vault Employee --fields label=GOOGLE_CLIENT_ID --reveal)"
export GOOGLE_CLIENT_SECRET="$(op item get ubm-hyogo-env --vault Employee --fields label=GOOGLE_CLIENT_SECRET --reveal)"
export INTERNAL_API_BASE_URL="http://localhost:<API_PORT>"

mise exec -- pnpm --filter web dev 2>&1 | tee "$STG/web-dev.log"
```

ブラウザで `http://localhost:3000/login` を開き、OAuth flow を一通り実行:

- Google login を押す
- callback 後にアプリへ戻る
- `http://localhost:3000/api/auth/session` を開く
- `http://localhost:3000/admin` にアクセスする

`wrangler-dev.log` / `web-dev.log` を開いて `auth/callback/google` / `session-resolve` / `admin` 等の entry が出ているか grep:

```bash
grep -E "(auth/callback|session-resolve|admin)" "$STG/wrangler-dev.log" "$STG/web-dev.log"
```

→ `auth/callback`、`session-resolve`、`admin` の実 entry が確認できた場合のみ `M-11: PASS`。

`MissingSecret` / `GET /api/auth/providers 500` / `/login?error=Configuration` が出た場合は `M-11: BLOCKED` とし、`AUTH_SECRET` を web dev に渡して起動し直す。

#### A-4-11. F-09: 外部 Gmail で staging（fail 期待）

1. ブラウザ B（外部 Gmail でログイン中）の シークレットウィンドウで `https://<staging-domain>/login`
2. Google sign-in
3. **期待: B-03 制約により login しても admin 不可、または consent 画面で testing user 制限エラー**

→ `F-09 (staging): EXPECTED FAIL`（B-03 制約による期待動作）と記録

#### A-4-12. F-15: redirect URI 不一致

意図的な fault injection:

1. Console で staging redirect URI を一時的に削除（または末尾に `/` を追加）
2. `https://<staging-domain>/login` から sign-in
3. Google エラー画面 "redirect_uri_mismatch" 表示確認
4. **screenshot を `outputs/phase-11/staging/08-redirect-mismatch.png`**
5. **必ず Console に戻して redirect URI を元に戻す**

→ redirect mismatch が期待どおり拒否された場合のみ `F-15: PASS`

#### A-4-13. F-16: state mismatch

1. login 開始 → callback URL の `state` パラメータを手動で改ざん（ブラウザで URL 編集して開く）
2. エラー画面表示確認
3. **screenshot を `outputs/phase-11/staging/09-state-mismatch.png`**

→ state mismatch が期待どおり拒否された場合のみ `F-16: PASS`

#### A-4-14. B-01: cookie 改ざん

1. login 後、DevTools → Application → Cookies で `next-auth.session-token` の値を手動編集（末尾 1 文字変更）
2. `/admin` にアクセス → reject（401 or `/login` redirect）
3. **screenshot を `outputs/phase-11/staging/10-cookie-tamper.png`**

→ cookie tamper が期待どおり拒否された場合のみ `B-01: PASS`

### A-5. session JSON 取得（admin 版）

```bash
# allowlist 一致 email でログイン後:
# DevTools → Network → /api/auth/session の Response を保存
# または curl で取得（cookie をエクスポート）

# Chrome DevTools → 該当リクエスト右クリック → "Copy as cURL" でクリップボード
# pbpaste で貼り付けて実行 → 出力を保存
pbpaste > /tmp/curl-session.sh
bash /tmp/curl-session.sh > outputs/phase-11/staging/session-admin.json
rm /tmp/curl-session.sh
```

### A-6. wrangler login 不在確認（staging 視点）

```bash
ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1 \
  > outputs/phase-11/staging/wrangler-login-absence.txt
git grep -nE "(CLOUDFLARE_API_TOKEN=|wrangler login)" -- ':!docs/' ':!CLAUDE.md' ':!.claude/' \
  >> outputs/phase-11/staging/wrangler-login-absence.txt 2>&1 || echo "OK: no matches" \
  >> outputs/phase-11/staging/wrangler-login-absence.txt

cat outputs/phase-11/staging/wrangler-login-absence.txt
# 期待: "No such file or directory" + "OK: no matches"
```

### A-7. Stage A → B ゲート判定

`outputs/phase-11/manual-smoke-log.md` に M-01〜M-11 / F-15 / F-16 / B-01 の結果を集計:

```markdown
# Stage A 実行ログ

| test ID | 結果 | 備考 |
| --- | --- | --- |
| M-01 | PASS | screenshot 01 |
| M-02 | PASS | screenshot 02 |
| ... | ... | ... |
| F-09 (staging) | EXPECTED FAIL | B-03 制約による期待動作 |

合計 PASS: 14/14（F-09 を除く）
判定: A → B 進行可
```

→ すべて PASS なら **Stage B へ進む**。1 件でも fail なら `phase-06.md` の対応 case # を確認して復旧 → A-3 から再実行。

---

## Stage B: production verification 申請（推定 30〜60 分 + Google 審査待機）

### B-1. privacy / terms / home 200 確認

```bash
{
  echo "=== home ==="; curl -sI https://<production-domain>/
  echo "=== privacy ==="; curl -sI https://<production-domain>/privacy
  echo "=== terms ==="; curl -sI https://<production-domain>/terms
} > outputs/phase-11/production/url-200-check.txt

cat outputs/phase-11/production/url-200-check.txt
# 期待: 3 つともに HTTP/2 200
```

**404/5xx の場合**: production に `apps/web` が deploy されていない / routing 不備 → Stage C-1〜C-2 を先に実行 or `apps/web` の `/privacy` `/terms` ページを実装してから戻る。

### B-2. consent screen を Production publishing で submit

1. ブラウザ A で <https://console.cloud.google.com/apis/credentials/consent> を開く
2. 現在のステータスが "Testing" になっているか確認
3. 表示内容が `outputs/phase-02/consent-screen-spec.md` と一致しているか確認:
   - App name: UBM 兵庫支部会
   - User support email
   - App home page: `https://<production-domain>/`
   - Privacy policy: `https://<production-domain>/privacy`
   - Terms: `https://<production-domain>/terms`
   - Authorized domains: `<production-domain>` の root
   - Scopes: `openid` / `email` / `profile`（**追加 scope なし**）
4. 不足/差分があれば **EDIT APP** で修正 → SAVE

5. **PUBLISH APP** ボタンをクリック → 確認ダイアログで **CONFIRM**

6. ステータスが "In production / Pending verification" に遷移することを確認

7. **screenshot を `outputs/phase-11/production/consent-screen.png`**（Publishing status / scope / authorized domain が見える状態で）

### B-3. verification 申請フォーム入力

Pending verification になると Console 上に "PREPARE FOR VERIFICATION" ボタンが表示される場合がある。クリックして以下を入力:

- **App description**: 「UBM 兵庫支部会の会員管理サイト。Google sign-in で会員認証のみに使用」
- **Scope justification**:
  - `openid`: 「OpenID Connect 認証フローに必要」
  - `email`: 「会員識別子として使用。第三者提供なし」
  - `profile`: 「会員ダッシュボードでの表示名のみ。第三者提供なし」
- **App demo video**: 任意（最小権限のため不要なはず。要求されたら録画）
- **Authorized domain ownership**: Google Search Console で domain 認証済みであることを示す（未認証なら別途実施）

**SUBMIT** をクリック。

### B-4. 申請ステータス記録

```bash
cat > outputs/phase-11/production/verification-submission.md <<'EOF'
# OAuth Verification 申請記録

- 申請日時: $(date '+%Y-%m-%d %H:%M %Z')
- Publishing status: In production / Pending verification
- 申請 scope: openid, email, profile（最小権限）
- 想定審査期間: 数日〜数週間（Google 都合）
- 採用 B-03 解除条件:
  - a (verified) を理想
  - b (submitted 暫定運用) を待機中状態として許容
- 確認 URL: https://console.cloud.google.com/apis/credentials/consent
EOF
```

### B-5. Stage B → C ゲート判定

| 条件 | 判定 |
| --- | --- |
| consent screen "In production" | 必須 |
| privacy/terms/home 200 | 必須 |
| 申請却下 / 修正要求 | `phase-06.md` Case #8 経路で修正再 submit |

→ "In production"（submitted or verified）であれば **Stage C へ進む**。verified を待つ場合は審査完了後に Stage C-3 を再実行する運用も可。

---

## Stage C: production smoke（推定 30 分）

### C-1. Cloudflare Secrets production 投入

```bash
# === apps/api 側 ===
op read "op://UBM-Auth/auth-secret-prod/credential" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env production
op read "op://UBM-Auth/google-client-id/credential" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_ID --config apps/api/wrangler.toml --env production
op read "op://UBM-Auth/google-client-secret/credential" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.toml --env production

# === apps/web 側 ===
op read "op://UBM-Auth/auth-secret-prod/credential" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env production
op read "op://UBM-Auth/google-client-id/credential" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_ID --config apps/web/wrangler.toml --env production
op read "op://UBM-Auth/google-client-secret/credential" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/web/wrangler.toml --env production

# 配置確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production \
  > outputs/phase-11/production/secrets-list-api.txt
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production \
  > outputs/phase-11/production/secrets-list-web.txt
cat outputs/phase-11/production/secrets-list-api.txt
# 期待: 3 key
```

### C-2. production deploy

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

### C-3. F-09 外部 Gmail で login smoke（最重要）

1. ブラウザ B の **新しいシークレットウィンドウ**（testing user 未登録の Gmail でログイン中、または Gmail 未ログイン状態）
2. `https://<production-domain>/login` にアクセス
3. **Sign in with Google** をクリック
4. アカウント選択 → 外部 Gmail を選択
5. **重要な分岐**:
   - verification **verified** なら通常の consent 表示 → Continue で進む
   - verification **submitted（pending）** の場合: testing user に追加していないと "App is being verified by Google" 警告が出る場合あり → 警告を無視して Continue できるか確認（できない場合は B-03 解除条件 b の暫定運用を採用し、testing user に追加してから smoke）
6. callback → `/` 着地
7. その email が `admin_users.active` に含まれるかで分岐:
   - 含まれる: `/admin` 200 → admin ページ表示
   - 含まれない: `/login?gate=admin` redirect 表示
8. **`/` 着地後（URL に code/state なし）の screenshot を `outputs/phase-11/production/login-smoke.png`**

### C-4. login smoke ログ記録

```bash
cat > outputs/phase-11/production/login-smoke-log.md <<'EOF'
# Production F-09 実行ログ

- 実行日時: $(date '+%Y-%m-%d %H:%M %Z')
- 使用 email: <外部 Gmail / マスク表示>（実値非掲載）
- testing user 登録: なし
- consent 表示: 通常 / "App is being verified" 警告表示（該当を残す）
- callback 結果: 302 → /
- /admin 結果: <200 admin 表示 / 302 /login?gate=admin redirect>
- 結果: PASS / FAIL
- B-03 解除状態: a (verified) / b (submitted 暫定) / c (testing user 拡大)
EOF
```

### C-5. wrangler login 不在確認（production 視点）

```bash
ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1 \
  > outputs/phase-11/production/wrangler-login-absence.txt
git grep -nE "(CLOUDFLARE_API_TOKEN=|wrangler login)" -- ':!docs/' ':!CLAUDE.md' ':!.claude/' \
  >> outputs/phase-11/production/wrangler-login-absence.txt 2>&1 \
  || echo "OK: no matches" >> outputs/phase-11/production/wrangler-login-absence.txt
```

### C-6. URL 200 再確認（記録用）

```bash
{
  curl -sI https://<production-domain>/
  curl -sI https://<production-domain>/privacy
  curl -sI https://<production-domain>/terms
} > outputs/phase-11/production/url-200-check.txt
```

---

## 完了確認 (チェックリスト)

### 必須 evidence ファイル

```bash
ls -la outputs/phase-11/staging/
# 期待ファイル:
# 01-login-page.png 〜 07-signout.png（7 枚）
# 08-redirect-mismatch.png / 09-state-mismatch.png / 10-cookie-tamper.png（3 枚 / 任意 + B-01）
# session-member.json / session-admin.json
# wrangler-dev.log
# secrets-list-api.txt / secrets-list-web.txt
# wrangler-login-absence.txt
# redirect-uri-actual.md

ls -la outputs/phase-11/production/
# 期待ファイル:
# consent-screen.png
# login-smoke.png
# secrets-list-api.txt / secrets-list-web.txt
# wrangler-login-absence.txt
# url-200-check.txt
# verification-submission.md
# login-smoke-log.md
# redirect-uri-actual.md
```

### Phase 11 main.md の集計

```bash
cat > outputs/phase-11/main.md <<'EOF'
# Phase 11 完了ログ

- 実行日時: $(date '+%Y-%m-%d')
- Stage A: PASS（M-01〜M-11 / F-15 / F-16 / B-01 すべて PASS）
- Stage B: submitted（または verified）
- Stage C: F-09 PASS / FAIL（実値で記録）
- B-03 解除状態: a / b / c のいずれか

evidence:
- staging/ → 9 枚 + curl + session JSON + wrangler-dev.log + secrets list
- production/ → consent-screen.png + login-smoke.png + url-200-check + verification-submission + login-smoke-log

次 Phase: 12 (ドキュメント更新)
EOF
```

### サニティチェック（必須）

```bash
# screenshot に secret/token が映っていないか目視確認
open outputs/phase-11/staging/*.png
open outputs/phase-11/production/*.png

# 漏洩疑いがあれば即座に削除 + rotation（phase-06.md Case #6）
```

---

## トラブルシューティング早見表

| 症状 | 関連 case | 対応 |
| --- | --- | --- |
| `redirect_uri_mismatch` エラー | #1, #2, #3 | A-1 に戻り Console URI を末尾`/`なし `https://` で再登録 |
| `cf.sh secret put` が exit != 0 | #4 | `op signin` 再実行 → `cf.sh whoami` で token 確認 |
| login 後 `Configuration error: invalid client secret` | #5 | A-2 を `op read` 経由で再投入 |
| screenshot/log に secret が映った | #6 | rotation 手順（`phase-06.md` §rotation）即実行 |
| `~/Library/.../wrangler/config/default.toml` 検出 | #7 | 当該ファイル削除 |
| 申請却下メール | #8, #11, #13 | 指摘項目を修正 → B-2 で再 submit |
| 審査長期化 | #9 | B-03 解除条件 b 採用、testing user 拡大で暫定運用 |
| privacy/terms 404 | #12 | `apps/web` で routing 修正 → deploy → B-1 再実行 |
| F-09 production fail | #17 | (a) verified 待機 / (b) `admin_users.active` 確認 / (c) Case #1 |

---

## 次 Phase へ

すべての evidence が `outputs/phase-11/staging/` / `production/` に揃ったら **Phase 12 へ進む**:

```bash
# Phase 12 への入力は以下:
# - outputs/phase-11/staging/* （staging evidence）
# - outputs/phase-11/production/* （production evidence）
# - outputs/phase-11/main.md     （集計）
# - outputs/phase-11/manual-smoke-log.md（test ID 別 PASS/FAIL）
```
