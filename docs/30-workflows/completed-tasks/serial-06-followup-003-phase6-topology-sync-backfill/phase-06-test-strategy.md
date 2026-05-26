# Phase 6 — Test Strategy

本タスクはドキュメント整合タスクであり、コード変更を伴わないため新規 vitest / Playwright spec の追加は **なし**。

## 検証戦略

| # | 検証観点 | コマンド | 期待結果 |
|---|---------|---------|---------|
| V1 | Phase 6 spec §3 への SSR intercept note 反映 | `grep -n "Node ランタイム側で実行" docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md` | 1 件以上 hit |
| V2 | Phase 10 spec の page.route 表現除去 | `grep -nR "page\.route" docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-10-local-verification.md` | hit 0（または mockApi fixture と併記された否定文脈のみ） |
| V3a | SSR fetch + page.route cross-link entry 追加 | `grep -n "Server Component fetch.*page.route" .claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` | 1 件 hit |
| V3b | Playwright testDir topology cross-link entry 追加 | `grep -n "testDir.*apps/web/playwright/tests" .claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` | 1 件 hit |
| V4 | unassigned-task consumed 化 | `grep -n "status: consumed" docs/30-workflows/completed-tasks/unassigned-task/serial-06-followup-003-phase-6-playwright-topology-sync.md` | 1 件 hit |
| V5 | phase spec path drift grep | `find docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding -maxdepth 1 -name 'phase-*.md' -print0 \| xargs -0 grep -n "apps/web/tests/e2e"` | hit 0 |
| V6 | phase12 compliance | `mise exec -- pnpm verify:phase12-compliance` | exit 0 |
| V7 | gate-metadata | `mise exec -- pnpm gate-metadata:validate` | exit 0 |
| V8 | indexes drift | `mise exec -- pnpm indexes:rebuild && git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/` | drift 0 |

## 既存テストへの影響

なし。Playwright spec / vitest spec / Cloudflare Workers runtime いずれも本 PR では touch しない。
