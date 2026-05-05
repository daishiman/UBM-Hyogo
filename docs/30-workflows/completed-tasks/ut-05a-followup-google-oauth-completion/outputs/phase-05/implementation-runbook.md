# Phase 5 主成果物 — 実装ランブック（設計版・コマンドベース）

> 仕様: `phase-05.md`
> 実機実行は `outputs/phase-11/manual-runbook.md` を参照（Phase 11 で詳細手順を展開）。
> 本ファイルは段階別コマンドの正本。Phase 11 はこれを実機適用。

## 新規作成 / 修正ファイル

| パス | 役割 |
| --- | --- |
| `outputs/phase-05/implementation-runbook.md` | **本ファイル** |
| `outputs/phase-11/staging/redirect-uri-actual.md` | staging 実 host を埋めた表（Phase 11 実行時生成） |
| `outputs/phase-11/production/redirect-uri-actual.md` | 同 production |
| `apps/api/wrangler.toml` / `apps/web/wrangler.toml` | 確認のみ（変更不要が期待値） |
| `.env`（ローカル） | `op://` 参照のみ追加 |

> コード（TypeScript / SQL）は **一切変更しない**。05a 実装の動作確認のみ。

## Stage A: staging smoke

### Step A-0: 事前準備

```bash
mise install
mise exec -- pnpm install
bash scripts/cf.sh whoami
mise exec -- pnpm typecheck
mise exec -- pnpm test
```

### Step A-1: Console redirect URI 登録

1. Google Cloud Console → APIs & Services → Credentials → 該当 OAuth 2.0 Client ID
2. "Authorized redirect URIs" に以下 3 件:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<staging-domain>/api/auth/callback/google`
   - `https://<production-domain>/api/auth/callback/google`
3. `<staging-domain>` / `<production-domain>` は `apps/web/wrangler.toml` の `[env.*].vars.AUTH_URL` から取得（仕様書転記なし）
4. 登録済 URI を `outputs/phase-11/staging/redirect-uri-actual.md` に保存

### Step A-2: Cloudflare Secrets staging 投入

```bash
op read "op://Vault/UBM-Auth/auth-secret-staging" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging
op read "op://Vault/UBM-Auth/google-client-id" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_ID --config apps/api/wrangler.toml --env staging
op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.toml --env staging

# apps/web 側にも同様（host が異なる場合）
op read "op://Vault/UBM-Auth/auth-secret-staging" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env staging
op read "op://Vault/UBM-Auth/google-client-id" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_ID --config apps/web/wrangler.toml --env staging
op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/web/wrangler.toml --env staging

# 配置確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \
  > outputs/phase-11/staging/secrets-list-api.txt
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging \
  > outputs/phase-11/staging/secrets-list-web.txt
```

### Step A-3: staging deploy

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

### Step A-4: smoke 9 ケース実行

Phase 4 のマトリクスに従い、`05a/outputs/phase-11/smoke-checklist.md` の手順を実 staging URL で実行。screenshot を `outputs/phase-11/staging/0X-<name>.png` に保存。

```bash
# session JSON 取得
curl -s -b cookies-member.txt https://<staging-domain>/api/auth/session > outputs/phase-11/staging/session-member.json
curl -s -b cookies-admin.txt https://<staging-domain>/api/auth/session > outputs/phase-11/staging/session-admin.json

# wrangler-dev.log（M-11）
mise exec -- pnpm --filter api dev 2>&1 | tee outputs/phase-11/staging/wrangler-dev.log
```

### Step A-5: A→B ゲート

| 条件 | 判定 |
| --- | --- |
| M-01〜M-11 / F-15 / F-16 / B-01 すべて PASS | A→B 進行可 |
| F-09 が staging で fail（B-03 制約による期待） | OK |
| 上記 PASS 群に 1 件でも fail | Phase 6 failure case で原因切り分け |

## Stage B: production verification 申請

### Step B-1: privacy / terms / home 200 確認

```bash
curl -I https://<production-domain>/      # 期待: HTTP/2 200
curl -I https://<production-domain>/privacy
curl -I https://<production-domain>/terms
```

404/5xx の場合は production deploy 状態を確認してから再実行。

### Step B-2: consent screen Production submit

1. Console → APIs & Services → OAuth consent screen
2. `consent-screen-spec.md` の値が反映されているか確認
3. **PUBLISH APP** ボタン → "Pushing to production" 確認画面で確定
4. verification 申請フォーム入力（scope justification / privacy 説明）
5. submission 後の確認画面 / Publishing status を `outputs/phase-11/production/consent-screen.png` に保存

### Step B-3: 申請ステータス記録

`outputs/phase-11/production/verification-submission.md` に:

```markdown
- 申請日時: YYYY-MM-DD HH:MM JST
- Publishing status: In production / Pending verification
- 申請 scope: openid, email, profile
- 想定審査期間: 数日〜数週間
- 採用 B-03 解除条件: a (verified) 理想 / b (submitted 暫定) 待機中状態として許容
```

### Step B-4: B→C ゲート

| 条件 | 判定 |
| --- | --- |
| consent screen "In production"（submitted or verified） | B→C 進行可 |
| privacy/terms/home 200 | 必須前提 |
| 申請却下 / 修正要求 | Phase 6 Case #8 経路で修正再 submit |

## Stage C: production smoke

### Step C-1: Cloudflare Secrets production 投入

```bash
op read "op://Vault/UBM-Auth/auth-secret-prod" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env production
op read "op://Vault/UBM-Auth/google-client-id" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_ID --config apps/api/wrangler.toml --env production
op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.toml --env production

# apps/web 側も同様
op read "op://Vault/UBM-Auth/auth-secret-prod" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env production
# ... GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET も同様

bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production \
  > outputs/phase-11/production/secrets-list-api.txt
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production \
  > outputs/phase-11/production/secrets-list-web.txt
```

### Step C-2: production deploy

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

### Step C-3: F-09 外部 Gmail smoke

1. testing user 未登録の外部 Gmail を 1 つ用意
2. シークレットウィンドウで `https://<production-domain>/login`
3. Google sign-in → consent → callback → `/` 着地
4. 当該 email が `admin_users.active` に含まれていれば `/admin` 200、含まれていなければ `/login?gate=admin`
5. screenshot を `outputs/phase-11/production/login-smoke.png` に保存（URL に `code=` / `state=` 残らないタイミング）

### Step C-4: B-03 状態反映（Phase 12 で実施）

`docs/00-getting-started-manual/specs/13-mvp-auth.md` の B-03 セクションを更新:

- verified: 「制約解除済み」
- submitted: 「verification 審査中・暫定運用」

## sanity check（各 Stage 共通）

```bash
ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1 \
  | grep -q "No such file" && echo "OK: no wrangler login state" \
  || (echo "FAIL: wrangler login token detected" && exit 1)

git grep -n "wrangler login" -- ':!docs/' ':!CLAUDE.md' ':!.claude/' \
  && (echo "FAIL: wrangler login invocation" && exit 1) \
  || echo "OK"

grep -E "^(AUTH_SECRET|GOOGLE_CLIENT_(ID|SECRET))=" .env 2>/dev/null \
  | grep -v "op://" \
  && (echo "FAIL: plaintext secret in .env" && exit 1) \
  || echo "OK: .env is op:// only"
```

## screenshot 撮影注意（再掲）

- DevTools Network/Application タブの session-token 値・Authorization 値はマスクまたは画面外
- callback 直後（URL に `code=` / `state=`）は撮らず `/` 着地後
- Console / Cloudflare dashboard の Client ID / Client secret は "Hide" 後
- `op read` 出力 / `secret put` の stdin は **絶対に撮らない**

## canUseTool 適用範囲

- 自動編集: `outputs/phase-11/**` 配下 Markdown 作成
- **人手必須**:
  - Step A-2 / C-1 の `secret put`
  - Step B-2 の Console "PUBLISH APP"
  - Step A-3 / C-2 の `deploy`
  - Step C-3 の外部 Gmail でのブラウザ操作
