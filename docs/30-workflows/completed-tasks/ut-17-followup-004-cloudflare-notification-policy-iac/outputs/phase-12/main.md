# Phase 12 Main — ut-17-followup-004

## Summary

This workflow root is an `implementation_complete / implementation / NON_VISUAL` local implementation package for Cloudflare Notification Policy IaC. `infra/cloudflare-alerts/`, `scripts/cf.sh alerts`, and the drift workflow exist in this worktree. Runtime Cloudflare mutation, GitHub Secret placement, commit, push, and PR remain user-gated.

## Strict 7 Outputs

1. `main.md`
2. `implementation-guide.md`
3. `system-spec-update-summary.md`
4. `documentation-changelog.md`
5. `unassigned-task-detection.md`
6. `skill-feedback-report.md`
7. `phase12-task-spec-compliance-check.md`

## Normalized Decisions

- Policy count wording: 4 categories / 5 policy files.
- Canonical webhook directory: `infra/cloudflare-alerts/webhooks/`.
- Canonical tokens: `CLOUDFLARE_ALERTS_TOKEN_APPLY` and `CLOUDFLARE_ALERTS_TOKEN_READ`.
- Cloudflare update method: `PUT` for existing policies and webhooks.
- Pages target: `Pages Build`, matching the parent UT-17 matrix.
- R2 target: `R2 Class A operations`, matching the parent UT-17 matrix.
- Local implementation path: `infra/cloudflare-alerts/lib/*.ts` called through `scripts/cf.sh alerts`.
- Token split implementation: diff/list use `CLOUDFLARE_ALERTS_TOKEN_READ`; apply uses `CLOUDFLARE_ALERTS_TOKEN_APPLY`; `apply --ci` is rejected.

## Boundary

Runtime Cloudflare mutation, GitHub Secret placement, commit, push, and PR remain user-gated.
