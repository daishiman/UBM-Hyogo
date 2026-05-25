# Phase 10 — 最終レビュー

## チェック項目

- [ ] CONST 1（env 経由参照のみ）が保持されている（`process.env.*` 直参照導入なし）。
- [ ] `getPublicEnv` / `getEnv` の throw 仕様が unchanged。
- [ ] `buildBaseMetadata` / `getSiteUrl` の export signature 不変。
- [ ] robots index/follow が env unresolved 時に false（SEO 安全側）。
- [ ] playwright smoke が `/` → `/terms` prefetch で error 0 件を担保。
- [ ] git diff が `apps/web/src/lib/env.ts` / `apps/web/src/lib/seo/site-metadata.ts` / 対応 spec / 新規 smoke のみに収まっている（不要 file 変更なし）。
