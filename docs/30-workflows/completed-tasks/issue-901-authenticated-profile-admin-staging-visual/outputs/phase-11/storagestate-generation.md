---
workflow_id: issue-901-authenticated-profile-admin-staging-visual
phase: 11
task: storagestate-generation
status: present
---

# storageState 生成手順と cookie マスキング方針

## 1. 生成元

| 役割 | env | claim |
|---|---|---|
| member | `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL` | `sub` / `email` / `isAdmin=false` |
| admin | `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` | `sub` / `email` / `isAdmin=true` |
| 共通 | `STAGING_AUTH_SECRET` / `STAGING_WORKER_HOST` | HS256 sign / cookie domain |

TTL = 600s（10 分）。`mint-staging-bearers.mts` 既存規約と統一。

## 2. CLI 実行

```bash
# member
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec tsx \
  playwright/scripts/mint-staging-storage-state.ts \
  --role=member \
  --out=playwright/.auth/member.storageState.json

# admin
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec tsx \
  playwright/scripts/mint-staging-storage-state.ts \
  --role=admin \
  --out=playwright/.auth/admin.storageState.json
```

出力 summary 例（cookie 値 / token 値は含まない）:

```
[mint] role=admin sub=<masked> exp=1716620800 isAdmin=true file=apps/web/playwright/.auth/admin.storageState.json (mode 0600)
```

## 3. cookie 構造（schema）

```json
{
  "cookies": [
    {
      "name": "authjs.session-token",
      "value": "<JWT signed by STAGING_AUTH_SECRET>",
      "domain": "<STAGING_WORKER_HOST>",
      "path": "/",
      "expires": 1716620800,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ]
}
```

> 実際の cookie name が `__Secure-authjs.session-token` の場合は Phase 9 R-06 に従い CLI option で prefix を切替。

## 4. マスキング方針

| 観点 | 方針 |
|---|---|
| storageState JSON | git 非コミット（`apps/web/.gitignore` 強制） / CI artifact 非 upload / 取得後即 `rm -rf` |
| ログ出力 | env 名のみ（値非表示）。CLI summary は `{ role, sub(masked), exp, isAdmin }` |
| screenshot | devtools 非表示で撮影。cookie は描画されない |
| spec / docs | cookie 値 / JWT prefix `eyJ` / `AUTH_SECRET=` value を grep gate で 0 hit 強制 |

## 5. 漏洩時の対応

1. `git filter-repo` で履歴から該当 commit を削除
2. `bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env staging` で rotation
3. 同 secret を `apps/api` 側にも同値で rotation（`getAuthEnv()` / `verifySessionJwt` で同一参照必須）
4. GitHub Secrets `STAGING_AUTH_SECRET` を 1Password から再投入
5. KV ベース session revocation は MVP 不採用のため、`AUTH_SECRET` rotation が唯一の手段

## 6. AUTH_SECRET drift 検知

```bash
# 値そのものは表示できないため、両 Worker に SECRET が登録されている事実のみ確認
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging | grep AUTH_SECRET
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep AUTH_SECRET
```

両方 1 行ずつ出ること。drift 確認は `signSessionJwt` で mint → `verifySessionJwt` 経由の `/auth/session-resolve` 200 応答で間接検証。

## 7. 参照

- `packages/shared` の `signSessionJwt` / `verifySessionJwt`
- `scripts/smoke/mint-staging-bearers.mts`（TTL=600s reference）
- `apps/web/scripts/lhci-auth-storage.ts`（storageState 生成 reference）
- spec: `docs/00-getting-started-manual/specs/13-mvp-auth.md` §「MVP session JWT 構造」
