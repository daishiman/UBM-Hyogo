# Phase 10 — Local Verification

## ローカル実行手順

```bash
# 1. T1-T4 編集後、drift 検証（V1-V4）
grep -n "Node ランタイム側で実行" \
  docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md
# 期待: 1 件 hit

grep -nR "page\.route" \
  docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-10-local-verification.md
# 期待: 戦略Bと併記された否定文脈のみ、または hit 0

grep -nE "Server Component fetch.*page.route|testDir.*apps/web/playwright/tests" \
  .claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md
# 期待: 2 件 hit

grep -n "status: consumed" \
  docs/30-workflows/completed-tasks/unassigned-task/serial-06-followup-003-phase-6-playwright-topology-sync.md
# 期待: 1 件 hit

# 2. 全 quality gate を一括実行
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh

# 3. indexes drift 確認
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/
```

## 失敗時のリカバリ

| 失敗箇所 | 原因仮説 | リカバリ |
|---------|---------|---------|
| `verify:phase12-compliance` | canonical 9 headings drift | Phase 12 spec の見出しを SSOT に逐語修正 |
| `gate-metadata:validate` | `outputs/artifacts.json` zod schema 違反 | Phase 11 spec の artifact 定義に従い再生成 |
| `indexes:rebuild` drift | skill 編集が indexes に反映されていない | `pnpm indexes:rebuild` を commit に含める |
