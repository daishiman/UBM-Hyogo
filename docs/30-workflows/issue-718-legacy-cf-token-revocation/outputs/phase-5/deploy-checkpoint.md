# Phase 5 Deploy Checkpoint

## マージ前 operator gate

- [ ] `CF_TOKEN_D1_STAGING` が GitHub Environment `staging` に投入済み
- [ ] `CF_TOKEN_WORKERS_STAGING` が GitHub Environment `staging` に投入済み
- [ ] `CF_TOKEN_D1_PRODUCTION` が GitHub Environment `production` に投入済み
- [ ] `CF_TOKEN_WORKERS_PRODUCTION` が GitHub Environment `production` に投入済み
- [ ] 確認コマンド: `gh secret list --env staging` / `gh secret list --env production`

## マージ後

- [ ] dev push → `backend-ci / deploy-staging` job green
- [ ] runtime smoke staging green
- [ ] main release後 → `backend-ci / deploy-production` job green

## NG 時 rollback

- backend-ci の secret 参照を `CLOUDFLARE_API_TOKEN` に戻す revert commit を即時作成。
- legacy token が未失効の間は rollback 可能。Phase 11 revocation 実施後は rollback 不可。
