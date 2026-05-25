# Implementation Guide

## Part 1: 中学生レベル説明

このタスクは、serial-06 のテスト仕様書に残っていた古い説明を、実際に使っている Playwright の仕組みに合わせ直す作業です。

ブラウザで見るページの中には、ブラウザではなくサーバー側で先にデータを取りに行くものがあります。今回のページは Next.js Server Component の `fetch()` を使うため、Playwright の `page.route()` ではその通信を止めたり差し替えたりできません。だから、実装で使った `mockApi` fixture を正しい方法として仕様書にも書きます。

また、Playwright のテスト置き場は `apps/web/tests/e2e/` ではなく `apps/web/playwright/tests/` です。今後同じ間違いをしないように、task-specification-creator の lesson にも短い cross-link を追加しました。

## Part 2: 技術者レベル実装詳細

### Applied Changes

| Task | File | Result |
| --- | --- | --- |
| T1 | `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md` | Added SSR fetch / `page.route()` constraint note under Phase 6 §3. |
| T2 | `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-10-local-verification.md` | Replaced stale `page.route()` primary strategy wording with in-process mockApi fixture strategy. |
| T3 | `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` | Added 2 cross-link entries for Server Component fetch and Playwright `testDir` topology. |
| T4 | `docs/30-workflows/completed-tasks/unassigned-task/serial-06-followup-003-phase-6-playwright-topology-sync.md` | Marked source task consumed and pointed to canonical workflow. |

### Verification Commands

```bash
grep -n "Node ランタイム側で実行" docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md
grep -n "Server Component fetch.*page.route" .claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md
grep -n "testDir.*apps/web/playwright/tests" .claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md
grep -n "status: consumed" docs/30-workflows/completed-tasks/unassigned-task/serial-06-followup-003-phase-6-playwright-topology-sync.md
find docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding -maxdepth 1 -name 'phase-*.md' -print0 | xargs -0 grep -n "apps/web/tests/e2e"
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm gate-metadata:validate
```

### Boundary

No `apps/` or `packages/` code changes were required. Commit, push, PR creation, and Issue mutation remain user-gated.
