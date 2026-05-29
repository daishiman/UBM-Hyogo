# Phase 10: デプロイ・ロールアウト計画

## 10.1 ブランチ / PR 戦略

- ブランチ: `feat/h2-identity-rebuild`
- base: `dev`（CLAUDE.md PR base 既定）
- PR 1 本（migration + code + spec doc 同梱）

## 10.2 staging ロールアウト

```bash
# 1. PR merge 後、staging deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 2. staging D1 migration 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# 3. 適用後 diagnostic 確認
curl -H "x-internal-auth: $INTERNAL_AUTH_SECRET" \
  "https://api-staging.example.workers.dev/admin/diagnostics/snapshot" \
  | jq '.identityHealth'

# 期待: { totalIdentities: N, identitiesWithoutMember: 0, membersWithoutIdentity: 0 }

# 4. 冪等性確認: 再適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
# → "No migrations to apply" を確認

# 5. 3 sample memberId で /admin/diagnostics/member/:id を叩き H2_identityMissing=false 確認
```

## 10.3 production ロールアウト

```bash
# 1. backup（必須・C4）
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output backup-h2-rebuild-$(date +%Y%m%d-%H%M%S).sql

# 2. deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# 3. migration 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# 4. 検証（staging と同じクエリで membersWithoutIdentity=0 確認）

# 5. 24h 後ログ確認: UBM-AUTH-AUTOLINK-* の発火状況
```

## 10.4 ロールバック手順

migration 0021 は INSERT のみで destructive ではないため、データロールバックは原則不要。万一 row を取り消す場合:

```bash
# backup から該当 row のみ復元する場合（手動 SQL）
# 影響範囲: migration 0021 で追加された row（created_at >= deploy 時刻）

# code rollback
bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env production
```

## 10.5 ゲート

| ゲート     | 条件                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------- |
| Gate-A     | PR merge 前: typecheck / lint / api test green、reviewer 承認（solo: 自己 review）         |
| Gate-B     | staging migration 適用後: membersWithoutIdentity=0 確認、3 sample 検証 OK                |
| Gate-C     | production deploy 後 24h: log エラーなし、metric 維持                                     |
