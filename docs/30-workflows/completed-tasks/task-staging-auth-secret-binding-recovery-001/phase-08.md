# Phase 8: staging 検証（user 明示承認必須）

[実装区分: 実装仕様書]

## 1. 実行手順（user 承認後のみ）

### Step 1: staging recovery

```bash
# 1. 再投入（1Password から op run 経由で値が動的注入される）
bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging
# stdin に op://Vault/UBM-Hyogo-Staging/AUTH_SECRET の値を流す（CLI が prompt）

# 2. name 登録確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep AUTH_SECRET

# 3. auth-free endpoint で接続確認
curl -i $STAGING_API_BASE/admin/healthz   # 200 期待 [OPEN-QUESTION-05 確定後]

# 4. auth 必須 endpoint で recovery 確認
curl -i -H "Authorization: Bearer $STAGING_ADMIN_BEARER" $STAGING_API_BASE/admin/members
# 期待: 200 + body に "members" array
# 失敗時: body に "auth misconfigured" が残るなら secret 値が再度 falsy → 1Password 値を再確認
```

### Step 2: production verify

```bash
# 同一 drift が production にも発生していないか確認
curl -i -H "Authorization: Bearer $PROD_ADMIN_BEARER" $PROD_API_BASE/admin/members
# 200 を期待。500 + "auth misconfigured" の場合は production 側も同手順で再投入
```

### Step 3: backend-ci 再実行

```bash
gh workflow run backend-ci.yml --ref dev
gh run watch  # runtime smoke staging / smoke が green になることを確認
```

## 2. 証跡

| evidence | path |
|----------|------|
| user approval | `outputs/phase-08/user-approval-deploy.txt` |
| secret 再投入 log | `outputs/phase-08/secret-put.log`（実値は出力しない） |
| curl admin/members staging | `outputs/phase-08/curl-staging-admin-members.txt` |
| curl admin/members production | `outputs/phase-08/curl-production-admin-members.txt` |
| backend-ci runtime smoke green | `outputs/phase-08/backend-ci-smoke-green.txt` |

## 3. fallback

- 再投入後も 500 が継続する場合: wrangler.toml の `[env.staging]` binding 名一致を確認、`workers.dev` route ではなく custom route 経由の binding を確認
- AUTH_SECRET length が 32 未満の値が 1Password に保存されていた場合: 1Password 側を先に更新してから再投入

## 4. Phase 8 DoD

- staging `/admin/members` が 200 を返す
- production も同様に 200 を返す（必要時は recovery 実施済み）
- backend-ci runtime smoke が green
- 実値はログ・コミット・仕様書に転記されていない
