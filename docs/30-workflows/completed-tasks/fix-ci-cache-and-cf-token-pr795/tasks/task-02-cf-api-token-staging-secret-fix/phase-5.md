# Phase 5 — 実装手順

実装プロンプトはこの順序で作業する。**secret 登録 (Step 4) は必ずユーザー明示承認後に実行**。

## 全体フロー

```
[Step 1] feature ブランチ作成
   ↓
[Step 2] backend-ci.yml 編集 (B2)
   ↓
[Step 3] actionlint + 実 token 混入 grep
   ↓
[Step 4] *** ユーザー承認後 *** GitHub Secret 登録 (B1)
   ↓
[Step 5] commit & push
   ↓
[Step 6] PR 作成 (Phase 13)
   ↓
[Step 7] PR マージ後 dev での CI 観測 (Phase 11)
```

## Step 1: feature ブランチ作成

```bash
git switch -c fix/ci-cf-api-token-staging-secret
```

## Step 2: `backend-ci.yml` の編集

Phase 2 §B2 の After 断片に従い、以下 2 step に `env:` block を追加する:

### 編集箇所 A — `Apply D1 migrations` (line 37 付近)

`uses: cloudflare/wrangler-action@v3` の直後、`with:` の直前に以下 3 行を挿入:

```yaml
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_D1_STAGING }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

### 編集箇所 B — `Deploy Workers app` (line 48 付近)

同じく `uses: cloudflare/wrangler-action@v3` 直後に挿入:

```yaml
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

### 不変更箇所

- line 1-36 (job header / checkout / pnpm / setup-node / install)
- line 40-46 (`Apply D1 migrations` の `with:` 以下)
- line 51-57 (`Deploy Workers app` の `with:` 以下)
- line 59-67 (`Record post-migration deploy failure` step)
- line 69-130 (`deploy-production` job / `runtime-smoke-staging` reusable call)

### Edit tool での適用例

実装プロンプトは `Edit` ツールで以下 2 つの置換を順に行う:

1. `old_string` = `        uses: cloudflare/wrangler-action@v3\n        with:\n          apiToken: ${{ secrets.CF_TOKEN_D1_STAGING }}`
   `new_string` = 上記 + `env:` block 3 行を `uses:` と `with:` の間に挿入したもの

2. 同様に `CF_TOKEN_WORKERS_STAGING` に対しても適用

## Step 3: 静的検証

```bash
# YAML 構文
actionlint .github/workflows/backend-ci.yml

# 実 token 値が混入していないかの保険 grep (1Password reference 以外で長い hex/base64 が無いことを確認)
git diff -- .github/workflows/backend-ci.yml | grep -Ei '(eyJ[A-Za-z0-9_-]{20,}|[a-f0-9]{40,})' || echo "OK: no raw token detected"
```

両方 clean であること。

## Step 4: GitHub Secret 登録 (ユーザー承認後のみ)

> **重要**: この Step はリポジトリ設定を変更する破壊的操作。実装プロンプトは Step 3 まで完了後、ユーザーに「Secret 登録を実行してよいか」を**明示確認**してから実行する。

### 前提

- ローカルに `gh` CLI が認証済み (`gh auth status` で `daishiman` として login 済み)
- ローカルに `op` CLI が認証済み (`op vault list` で Cloudflare vault が見える)

### 登録手順

```bash
# 1) 現状確認 (値は表示されない、名前のみ)
gh secret list --env staging --repo daishiman/UBM-Hyogo

# 2) D1 staging token を登録 (op read の結果は変数に代入せず即時展開で gh に渡す)
gh secret set CF_TOKEN_D1_STAGING \
  --env staging \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://Cloudflare/UBM-Hyogo-D1-Staging/token')"

# 3) Workers staging token を登録
gh secret set CF_TOKEN_WORKERS_STAGING \
  --env staging \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://Cloudflare/UBM-Hyogo-Workers-Staging/token')"

# 4) 再確認
gh secret list --env staging --repo daishiman/UBM-Hyogo
```

### 禁止操作

- `op read` の結果を `echo` しない / 変数に代入しない
- `cat .env` / `Read .env` をしない (1Password 参照のみが書かれていても慣性で実値の存在を想起させない)
- secret 名・値を chat / PR 本文 / コメントに転記しない

### rotation 名変更検出時

Step 4-1 の `gh secret list` 結果に旧名 secret (例: `CLOUDFLARE_API_TOKEN_STAGING` 等) が残っている場合は:

```bash
gh secret delete <旧名> --env staging --repo daishiman/UBM-Hyogo
```

で削除してから 4-2 / 4-3 を実行。

## Step 5: commit & push

```bash
git add .github/workflows/backend-ci.yml
git commit -m "fix(backend-ci): add env fallback for CLOUDFLARE_API_TOKEN on deploy-staging"
git push -u origin fix/ci-cf-api-token-staging-secret
```

> Phase 13 で PR 作成 (`gh pr create --base dev`) へ進む。
