# Phase 13: PR 作成

[実装区分: 実装仕様書]

## 1. 前提

- user の明示承認後のみ実施
- base branch: `dev`（CLAUDE.md 既定方針）
- 4 spec 実装の差分を 1 PR にまとめる（spec-01 は仕様書 + runbook のみのため diff に含めても良い）

## 2. PR title 候補

```
fix(auth): recover staging AUTH_SECRET runtime binding + add zod gate, ci smoke, cf.sh guard
```

## 3. PR body 雛形

```md
## Summary
- staging worker `ubm-hyogo-api-staging` の `AUTH_SECRET` ランタイム binding 欠落により admin endpoint が全滅していた真因対応
- PR #854 の defensive try/catch は維持しつつ、middleware 構造化ログ + env zod 検証 + CI auth-gate smoke + cf.sh empty guard で再発予防

## Changes
- spec-02: `apps/api/src/middleware/require-admin.ts` に `UBM-AUTH-SECRET-MISSING` 構造化ログ追加
- spec-02: `apps/api/src/env.ts` の AUTH_SECRET を zod min(32) 必須化
- spec-03: `.github/workflows/backend-ci.yml` deploy-staging 後段に auth-gate smoke step 追加
- spec-03: `scripts/smoke/runtime-attendance-provider.sh` に `auth misconfigured` 検知分岐
- spec-04: `scripts/cf.sh secret put` に empty-value guard + `--dry-run` flag 追加

## Test plan
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] pnpm --filter @ubm-hyogo/api test
- [ ] bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh
- [ ] staging curl /admin/members 200 確認
- [ ] backend-ci runtime smoke staging green

## Related
- workflow: docs/30-workflows/task-staging-auth-secret-binding-recovery-001/
- supersedes (root cause fix): docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001/ (誤診断 workflow)
- predecessor PR: #854 (defensive only, not root cause)
```

## 4. Phase 13 DoD

- user 承認 → `gh pr create --base dev` 実行
- PR URL を最終レポートに記載
