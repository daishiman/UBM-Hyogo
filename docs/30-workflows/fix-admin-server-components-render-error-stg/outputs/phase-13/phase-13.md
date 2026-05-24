# Phase 13: PR 作成

## 13.1 前提（ユーザー明示承認必須）

Phase 13 は **ユーザーの明示承認後のみ実施する**。承認前に commit / push / PR 作成は禁止。

## 13.2 PR 構成

| 項目          | 値                                                                                  |
| ------------- | ----------------------------------------------------------------------------------- |
| base branch   | `dev`（CLAUDE.md「既定の PR base ブランチは `dev`」）                                |
| head branch   | `fix/admin-server-components-render-error`（既に作成済み）                          |
| title         | `fix: route apps/web admin env access through getEnv() and remove localhost fallback` |
| labels        | `bug`, `area:apps/web`, `priority:high`                                              |

## 13.3 PR 本文テンプレート

```markdown
## Summary
- staging /admin で発生していた Server Components render error (digest=167275886) を修正
- `apps/web/src/lib/admin/server-fetch.ts` の env 参照を `getEnv()` 経由に変更（不変条件遵守）
- `http://127.0.0.1:8787` fallback を撤去（CLAUDE.md 違反の解消）
- runtime env 解決から localhost fallback と `process.env` 直参照を撤去

## Root cause
`server-fetch.ts` が `process.env["INTERNAL_API_BASE_URL"]` を直接読んでいたため、
Cloudflare Workers + `@opennextjs/cloudflare` runtime で env binding を読めず、
fallback の `http://127.0.0.1:8787` に fetch して失敗。Server Component が例外を投げ、
production build の digest 化に伴いブラウザ側には digest のみが露出していた。

## Changes
- `apps/web/src/lib/admin/server-fetch.ts`: env 参照を `getEnv()` 経由に置換、fallback 撤去
- `apps/web/src/lib/env.ts`: `EnvSchema` に `INTERNAL_AUTH_SECRET` optional を追加
- `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts`: 新規 regression
- `apps/web/src/lib/__tests__/env.spec.ts`: `INTERNAL_AUTH_SECRET` optional schema regression

## Test plan
- [x] `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts apps/web/src/lib/__tests__/env.spec.ts`
- [ ] `pnpm typecheck`（Phase 13 承認前の broader gate）
- [ ] `pnpm lint`（Phase 13 承認前の broader gate）
- [ ] `pnpm --filter @ubm-hyogo/web build`（Phase 13 承認前の broader gate）
- [ ] `bash scripts/verify-pr-ready.sh`（Phase 13 承認前の broader gate）
- [ ] staging deploy 後、`/admin` が 200 で render される
- [ ] Playwright admin dashboard runtime smoke (#849) が pass
- [ ] `wrangler tail` で `error.boundary.caught` (scope=admin) が新規発生しない

## Related
- Reproducer: 報告事象（digest=167275886, 2026-05-23T00:24:25.584Z）
- Related PR: #849 (admin dashboard runtime screenshot via Playwright + mock-api)

## Follow-up (out-of-scope)
- `apps/web/src/lib/auth.ts` は既存認証 env 境界として維持。本タスクで新規未タスク化しない。
- admin scope の Sentry alert ルールは既存運用範囲で扱う。本タスクで新規未タスク化しない。
```

## 13.4 PR 作成コマンド

```bash
# Phase 13 ユーザー承認後にのみ実行
git add -A
git status --short
git commit -m "$(cat <<'EOF'
fix(admin): route apps/web admin env access through getEnv() and remove localhost fallback

Resolve Server Components render error on staging /admin (digest=167275886).
- replace process.env[INTERNAL_API_BASE_URL/INTERNAL_AUTH_SECRET] with getEnv() in apps/web/src/lib/admin/server-fetch.ts
- remove http://127.0.0.1:8787 fallback (violates CLAUDE.md localhost embed rule)
- add INTERNAL_AUTH_SECRET optional field to EnvSchema
- add focused regression specs for Cloudflare env binding and schema parsing
EOF
)"
git push -u origin fix/admin-server-components-render-error
gh pr create --base dev --title "fix: route apps/web admin env access through getEnv() and remove localhost fallback" \
  --body "$(cat outputs/phase-13/pr-body.md)"
```

## 13.5 完了条件

- PR URL が取得できる
- CI gate（required status checks）が pass する
- ユーザーが merge を承認する（merge 自体は本タスクのスコープ外）
