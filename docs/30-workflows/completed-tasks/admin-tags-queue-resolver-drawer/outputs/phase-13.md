# Phase 13 — commit / PR

**ユーザーの明示承認後のみ実施**。それまでは `blocked_pending_user_approval` を維持。

## branch / base

| 項目 | 値 |
| --- | --- |
| feature branch | `feat/admin-tags-queue-resolver-drawer` |
| base branch | `dev` |
| PR title | `feat(admin-tags): tag queue resolver drawer (hardening + a11y)` |

## commit message テンプレート

```
feat(admin-tags-queue-resolver-drawer): extract resolve drawer + useAdminMutation

- Split resolve UI from TagQueuePanel into TagsQueueResolveDrawer
- Route mutation through useAdminMutation hook (busy guard / toast / router.refresh)
- Validate body against tagQueueResolveBodySchema on client
- Add dialog a11y (role/aria-modal/focus trap/ESC/return focus)
- Map status badge color to OKLch design tokens
- Add 11 unit specs + 5 VISUAL screenshots

Refs: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-04-tags-assignment/spec.md
Refs: docs/30-workflows/admin-tags-queue-resolver-drawer/
```

## PR description template

```
## Summary
- Extract resolve drawer from TagQueuePanel and harden a11y (dialog / focus trap / ESC)
- Migrate mutation path to useAdminMutation; unify busy / toast / router.refresh
- Client-side validation via tagQueueResolveBodySchema (single source of truth)
- OKLch design tokens for status badges

## Scope
Changed: apps/web/src/components/admin/TagsQueueResolveDrawer.tsx (new), TagQueuePanel.tsx, _tagQueueStatus.ts (new), tokens.css
Unchanged: apps/api/*, packages/shared/*, D1 schema, endpoint surface

## Invariants
- #13 tag writes go through tagQueueResolve workflow only
- #5 No direct D1 access from apps/web

## Test plan
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web test -- TagsQueueResolveDrawer TagQueuePanel --run
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- admin-tags

## Screenshots
- outputs/phase-11/screenshots/admin-tags-drawer-closed.png
- outputs/phase-11/screenshots/admin-tags-drawer-confirmed-open.png
- outputs/phase-11/screenshots/admin-tags-drawer-rejected-open.png
- outputs/phase-11/screenshots/admin-tags-drawer-validation-error.png
- outputs/phase-11/screenshots/admin-tags-drawer-terminal-disabled.png

## Refs
- docs/30-workflows/admin-tags-queue-resolver-drawer/
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-04-tags-assignment/spec.md
```

## 実行コマンド（承認後）

```bash
git switch -c feat/admin-tags-queue-resolver-drawer
git add apps/web docs/30-workflows/admin-tags-queue-resolver-drawer
git commit -m "$(cat <<'EOF'
feat(admin-tags-queue-resolver-drawer): extract resolve drawer + useAdminMutation
...
EOF
)"
git push -u origin feat/admin-tags-queue-resolver-drawer
gh pr create --base dev --title "feat(admin-tags): tag queue resolver drawer (hardening + a11y)" --body-file outputs/phase-13/pr-body.md
```

## DoD

- ユーザー明示承認を受領
- Phase 1-12 が全て completed
- CI gate（typecheck / lint / verify-design-tokens / playwright-smoke）が PR 上で green
- PR URL が `outputs/phase-13/pr-url.txt` に記録される
