# Phase 13: PR 作成

## 13.1 前提（ユーザー明示承認必須）

Phase 13 は **ユーザーの明示承認後のみ実施する**。承認前に commit / push / PR 作成は禁止。本サイクルでは local 実装と focused evidence まで完了しているため、PR は staging runtime evidence 取得またはユーザー承認後に作成する。

## 13.2 PR 構成

| 項目          | 値                                                                                  |
| ------------- | ----------------------------------------------------------------------------------- |
| base branch   | `dev`（CLAUDE.md「既定の PR base ブランチは `dev`」）                                |
| head branch   | `feat/profile-server-components-render-error`                                       |
| title         | `fix: route apps/web /profile env access through getApiBaseEnv() and wrap /me with safeServerFetch` |
| labels        | `bug`, `area:apps/web`, `priority:high`                                              |

## 13.3 PR 本文テンプレート

```markdown
## Summary
- staging `/profile` で発生していた Server Components render error (digest=398449091, scope=profile) を修正
- `apps/web/src/lib/fetch/authed.ts` の env 参照を `getApiBaseEnv()` 経由に変更（不変条件遵守）
- `http://127.0.0.1:8787` fallback を撤去（CLAUDE.md 違反の解消）
- `apps/web/app/(member)/profile/page.tsx` の初回 `/me` 呼び出しを `safeServerFetch` でラップし、`AuthRequiredError` 以外は SectionError UI に降格

## Root cause
`apps/web/src/lib/fetch/authed.ts` の `resolveApiBase()` が `process.env["INTERNAL_API_BASE_URL"]` / `process.env["PUBLIC_API_BASE_URL"]` を直接読んでいたため、Cloudflare Workers + `@opennextjs/cloudflare` runtime で env binding を読めず、fallback の `http://127.0.0.1:8787` に fetch して失敗。`/profile` page の初回 `/me` 呼び出しは `try/catch` + `throw err;` で例外を bubble up していたため、Server Component が render error を投げ、production build の digest 化に伴いブラウザには digest のみが露出していた（`/profile/error.tsx` boundary が「マイページの読み込みに失敗しました」を表示）。

これは CLAUDE.md「`apps/web` ランタイムでの env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由のみ・`process.env.*` 直接参照禁止」不変条件の違反であり、`fix-admin-server-components-render-error-stg` で `apps/web/src/lib/admin/server-fetch.ts` に対して既に解消した問題と完全同型。

## Changes
- `apps/web/src/lib/fetch/authed.ts`: env 参照を `getApiBaseEnv()` 経由に置換、`FALLBACK_INTERNAL_API` / `127.0.0.1` 撤去、env 未解決時 throw
- `apps/web/app/(member)/profile/page.tsx`: 初回 `/me` を `safeServerFetch(..., { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] })` でラップ、SectionError UI 降格
- `apps/web/src/lib/fetch/authed.spec.ts`: `getApiBaseEnv()` 経路 + `process.env[` 0 件 + `127.0.0.1` 0 件 regression
- `apps/web/app/(member)/profile/page.spec.tsx`: `/me` 5xx → SectionError UI / 401 → redirect の regression

## Test plan
- [x] `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/fetch/authed.spec.ts "apps/web/app/(member)/profile/page.spec.tsx" apps/web/src/lib/__tests__/env.spec.ts`
- [x] `pnpm --filter @ubm-hyogo/web typecheck`
- [x] `pnpm --filter @ubm-hyogo/web lint`
- [ ] `pnpm --filter @ubm-hyogo/web build`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] staging deploy 後、`/profile` が 200 で render される
- [ ] `wrangler tail` で `error.boundary.caught` (scope=profile, digest=398449091) が新規発生しない
- [ ] grep gate: `apps/web/src/lib/fetch/authed.ts` 内で `process.env[` 0 件、`127.0.0.1` 0 件

## Related
- Reproducer: 報告事象（digest=398449091, scope=profile, staging `/profile`）
- Related workflow: `docs/30-workflows/fix-admin-server-components-render-error-stg/`（admin 側の同型違反解消の前例）

## Reviewed Non-Tasks
- `apps/web/src/lib/fetch/public.ts` は既に `getPublicFetchEnv()` 経由で env.ts に集約済み。
- `apps/web/src/lib/auth.ts` は既存認証 env 境界として維持。本タスクで新規未タスク化しない。
- profile scope の Sentry alert ルールは既存運用範囲で扱う。本タスクで新規未タスク化しない。
```

## 13.4 PR 作成コマンド

```bash
# Phase 13 ユーザー承認後にのみ実行
git add -A
git status --short
git commit -m "$(cat <<'EOF'
fix(profile): route apps/web /profile env access through getApiBaseEnv() and wrap /me with safeServerFetch

Resolve Server Components render error on staging /profile (digest=398449091, scope=profile).
- replace process.env[INTERNAL_API_BASE_URL/PUBLIC_API_BASE_URL] with getApiBaseEnv() in apps/web/src/lib/fetch/authed.ts
- remove http://127.0.0.1:8787 fallback (violates CLAUDE.md localhost embed rule)
- wrap /me call in apps/web/app/(member)/profile/page.tsx with safeServerFetch and degrade non-AuthRequired errors to SectionError UI
- add focused regression specs for getApiBaseEnv() routing, grep gates (process.env[ / 127.0.0.1 = 0), and /me 5xx -> SectionError behavior
EOF
)"
git push -u origin feat/profile-server-components-render-error
gh pr create --base dev --title "fix: route apps/web /profile env access through getApiBaseEnv() and wrap /me with safeServerFetch" \
  --body "$(cat outputs/phase-13/pr-body.md)"
```

## 13.5 完了条件

- PR URL が取得できる
- CI gate（required status checks）が pass する
- ユーザーが merge を承認する（merge 自体は本タスクのスコープ外）
