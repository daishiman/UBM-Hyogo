# System Spec Update Summary — 02c-followup-002

## Step 1-A: current facts

- `apps/api` production build typecheck は `apps/api/tsconfig.build.json` を使い、`src/**/__tests__/**` / `src/**/__fixtures__/**` / `*.test.ts` / `*.spec.ts` を除外する。
- root `lint` は `lint:deps` を経由して `.dependency-cruiser.cjs` を実行し、production code から `__fixtures__` / `__tests__` への import を error 化する。
- runtime bundle evidence は esbuild substitute で `__fixtures__` / `__tests__` / `miniflare` 0 件を確認済み。実 `wrangler deploy --dry-run` は未取得。

## Step 1-B: updated canonical specs

| spec | status |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md` | updated |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | updated |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | updated |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | changelog updated |
| `docs/30-workflows/LOGS.md` | updated |

## Step 1-C: task inventory

- Original unassigned task consumed:
  `docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md`
- Canonical workflow:
  `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/`

## Step 2: stale contract withdrawal

- Withdrawn: `database-admin-repository-boundary.md` の「test fixture と production は future build config gate」表現。
- Replacement: `tsconfig.build.json` + dep-cruiser + esbuild/wrangler bundle evidence の current gate。
- Remaining: 実 wrangler dry-run evidence は `task-02c-followup-002-wrangler-dry-run-evidence-001` に分離。
