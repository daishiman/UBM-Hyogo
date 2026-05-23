# Phase 13 — PR 作成

`[実装区分: 実装仕様書]`

## 1. 前提

- ユーザーの **明示承認** を受けてから実行 (CLAUDE.md PR 自律フロー §「重要 — 仕様書」)
- base ブランチは `dev` (CLAUDE.md 既定)
- 現在ブランチ: `feat/issue-256-e2e-coverage-baseline-runbook`

## 2. PR タイトル / 本文

### Title
```
feat(issue-256): coverage exclude ratio baseline & playwright smoke SLA runbook
```

### Body
```markdown
## Summary
- `scripts/measure-coverage-exclude-ratio.ts` 追加 (apps/web/app/**/*.tsx の exclude 比率を JSON / markdown 出力)
- `.github/workflows/verify-coverage-exclude-ratio.yml` 追加 (PR comment soft warn at >= 30%)
- `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md` / `playwright-smoke-19-route-sla.md` 追加
- `vitest.config.ts` の coverage include / exclude を現行 `apps/web/app` topology に同期
- Issue #256 (closed) の AC2 (smoke SLA 明文化) と AC3 (baseline + 代替指標 runbook) を根本解決

## Refs
- Refs #256 (既に closed。本 PR は post-close root fix のため Closes/Fixes/Resolves は使わない)
- Parent: docs/30-workflows/unassigned-task/task-e2e-playwright-coverage-001.md
- Workflow: docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/

## Test plan
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm vitest run scripts/__tests__/measure-coverage-exclude-ratio.spec.ts`
- [ ] `mise exec -- pnpm vitest run apps/web/app/__tests__`
- [ ] `mise exec -- pnpm tsx scripts/measure-coverage-exclude-ratio.ts` → JSON 出力確認
- [ ] CI `playwright-smoke / smoke (chromium)` GREEN (regression なし)
- [ ] CI `verify-coverage-exclude-ratio` 実行確認

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 3. 実行手順

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(issue-256): coverage exclude ratio baseline & smoke SLA runbook

- add scripts/measure-coverage-exclude-ratio.ts
- add .github/workflows/verify-coverage-exclude-ratio.yml (soft warn)
- add docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md
- add docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md
- sync vitest.config.ts coverage include/exclude with current apps/web/app topology
- Refs #256 residual AC2 / AC3 root fix

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push -u origin feat/issue-256-e2e-coverage-baseline-runbook
gh pr create --base dev --title "..." --body "..."
```

## 4. 注意

- `--no-verify` 禁止
- Issue は CLOSED のまま (リオープンしない)。PR description は `Refs #256` のみを使い、`Closes #256` / `Fixes #256` / `Resolves #256` は使わない
- 実装が未着手の段階では PR 作成しない (仕様書のみの commit でも可、別タスクで実装着手後に PR)
