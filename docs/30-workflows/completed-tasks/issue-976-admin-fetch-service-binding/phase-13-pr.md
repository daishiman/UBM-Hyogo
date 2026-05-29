# Phase 13 — PR

## Base / Branch

- base: `dev`
- branch: `fix/issue-976-admin-fetch-service-binding`

## PR Title

`fix(admin-fetch): admin server-fetch を API_SERVICE service-binding 経路に統一 (#976)`

## PR Body 雛形

```markdown
## Summary
- `apps/web/src/lib/admin/server-fetch.ts` の `fetchAdmin` が同一 Cloudflare account の `*.workers.dev → *.workers.dev` 外向き HTTP fetch のみで実装されており、staging で loopback 404 (`ADMIN_FETCH_404`) を引き起こしていた問題を根本修正。
- `apps/web/src/lib/fetch/public.ts` と同じ "service-binding 最優先 / test runtime fallback" モデルに統一。
- `/admin/meetings` だけでなく `/admin/members` `/admin/requests` `/admin/identity-conflicts` `/admin/audit` 等 admin route 全体の 404 経路を構造的に解消(波及修復)。

Closes #976

## 変更
- `apps/web/src/lib/admin/server-fetch.ts`: `getAdminFetcher()` helper 追加、`fetchAdmin` 末尾の fetcher を切替
- `apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts`: 新規 6 ケース

## Test plan
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test` (apps/web vitest 全 pass)
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] (staging) `/admin/meetings` authenticated 200 + list 描画
- [ ] (staging) `wrangler tail` で ADMIN_FETCH_404 非発火
- [ ] (staging) 他 admin route 波及的に正常化

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 注意

- staging deploy / browser smoke / commit / push / PR 作成は user-gated
- production deploy は staging 観測 1 サイクル後
