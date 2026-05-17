# Phase 13: PR 作成

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: conditional code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL
> status: blocked_user_approval

---

## 1. 前提

- Phase 1-12 完了。
- `.github/workflows/web-cd.yml` は no-code。
- Cloudflare Workers GitHub Actions docs / `wrangler-action` README の API token 前提を一次情報で確認済み。
- Phase 12 strict 7 outputs と artifacts parity が存在。
- **ユーザーから明示的な PR 作成許可が出ていること**。

## 2. PR タイトル

```text
docs(issue-717): record Cloudflare OIDC support revalidation
```

## 3. PR 本文テンプレート

```markdown
## Summary

- Revalidated Cloudflare Workers GitHub Actions OIDC deploy support from primary sources.
- Confirmed current official guidance still uses Cloudflare API token / account ID for `cloudflare/wrangler-action`.
- Kept `.github/workflows/web-cd.yml` unchanged; no `id-token: write`, guessed action input, or custom token exchange endpoint is introduced.
- Synced aiworkflow requirements so Issue #640 step-scoped `CLOUDFLARE_API_TOKEN` remains the current web-cd contract.
- Formalized follow-ups for official-support staging proof / production cutover, apps-api D1 credential cutover, and 1Password cleanup.

Refs #717, #640

## Changed files

- `.claude/skills/aiworkflow-requirements/**`
- `.claude/skills/task-specification-creator/LOGS/_legacy.md`
- `docs/30-workflows/issue-717-oidc-cf-full-migration/**`
- `docs/30-workflows/unassigned-task/issue-717-followup-*.md`

## Test plan

- [ ] `cmp -s docs/30-workflows/issue-717-oidc-cf-full-migration/artifacts.json docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/artifacts.json`
- [ ] `test -f docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/phase-11/cloudflare-oidc-support-revalidation.md`
- [ ] `test -f docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/phase-12/phase12-task-spec-compliance-check.md`
- [ ] `git diff --check -- docs .claude/skills`

## Risk

- The main risk is future Cloudflare support changing after this revalidation date. Follow-up execution must re-check primary sources before adding OIDC workflow changes.
- Legacy token revocation remains blocked until official support, staging proof, production cutover, and observation are complete.

## Not included

- No workflow mutation.
- No GitHub Secret / Cloudflare / 1Password mutation.
- No production cutover.
```

## 4. 自動実行禁止事項

- `git push` および `gh pr create` はユーザーが明示承認した時のみ実行。
- Cloudflare trust policy mutation / GitHub Secret mutation / 1Password mutation は実行しない。

## 5. DoD

- [ ] ユーザー明示承認取得
- [ ] PR 本文が no-code verification として記述されている
- [ ] workflow 変更を主張していない
