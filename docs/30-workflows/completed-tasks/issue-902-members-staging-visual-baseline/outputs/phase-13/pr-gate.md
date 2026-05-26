# Phase 13 — Commit / PR Draft

## 1. user-gated 境界

本仕様作成時点では commit / push / PR は実行しない。ユーザー明示承認後に下記フローを実行する。

## 2. PR draft

### Title

```
feat(issue-902): staging-visual baseline for /members and /members/[id] (UT-DSF-07-FU-02)
```

### Body

```
## Summary

- Add `members-list.spec.ts` and `member-detail.spec.ts` to the `staging-visual` Playwright project (expand 4 → 6 screens).
- `member-detail.spec.ts` is env-gated by `PLAYWRIGHT_MEMBER_DETAIL_ID` and falls back to `test.skip` when unset to keep CI green without staging seed coupling.
- Update `staging-visual` workflow input, 6-screen naming, and Phase 11 evidence artifact path.

Refs #902 (closed) — implements the FU-02 follow-up of UT-DSF-07 against the current codebase.

## Spec

- `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/index.md`
- Phase 1-13: `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/outputs/`

## Test plan

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] `playwright test --project=staging-visual --list` enumerates 6 tests
- [ ] CI baseline PNG generated and committed for both new specs
- [ ] `staging-visual (chromium, 6 screens)` job green (diff < 5%)
```

### Base

`dev`

## 3. 実行コマンド（user 承認後）

```bash
git add docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline \
        docs/30-workflows/issues/issue-902.md \
        docs/30-workflows/unassigned-task/UT-DSF-07-FU-02-members-list-detail-staging-visual.md \
        .claude/skills/aiworkflow-requirements \
        apps/web/playwright/tests/visual-staging/members-list.spec.ts \
        apps/web/playwright/tests/visual-staging/member-detail.spec.ts \
        .github/workflows/playwright-smoke.yml

git commit -m "feat(issue-902): staging-visual baseline for /members and /members/[id]"
git push -u origin feat/issue-902-members-staging-visual

gh pr create --base dev --title "..." --body "..."
```

baseline PNG は dispatch 後 artifact から download し、追加 commit として同 PR に push する。
