# Documentation Changelog

## Entry Checklist

```text
$ git status --porcelain apps/ packages/ scripts/ docs/30-workflows/web-app-route-bundle-parse-fix .claude/skills/aiworkflow-requirements CLAUDE.md docs/00-getting-started-manual/specs/00-overview.md
 M .claude/skills/aiworkflow-requirements/SKILL-changelog.md
 M .claude/skills/aiworkflow-requirements/SKILL.md
 M .claude/skills/aiworkflow-requirements/indexes/quick-reference.md
 M .claude/skills/aiworkflow-requirements/indexes/resource-map.md
 M .claude/skills/aiworkflow-requirements/references/lessons-learned.md
 M .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
 M CLAUDE.md
 M apps/web/package.json
 M docs/00-getting-started-manual/specs/00-overview.md
 M scripts/patch-next-standalone-instrumentation.mjs
?? .claude/skills/aiworkflow-requirements/changelog/20260509-web-app-route-bundle-parse-fix.md
?? .claude/skills/aiworkflow-requirements/references/lessons-learned-web-app-route-bundle-parse-fix-2026-05.md
?? .claude/skills/aiworkflow-requirements/references/workflow-web-app-route-bundle-parse-fix-artifact-inventory.md
?? docs/30-workflows/web-app-route-bundle-parse-fix/
```

`apps/` dirty diff is classified as this workflow's implementation diff: `apps/web/package.json`. `packages/` has no current worktree diff for this workflow. `scripts/patch-next-standalone-instrumentation.mjs` is classified as this workflow's build-patch compatibility diff.

The previously mixed Issue #547 / #548 workflow deletions were restored because active SSOT references still require those roots. This removes the canonical-tree blocker from the current branch diff.

## Changed Paths

| Path | Change |
| --- | --- |
| `apps/web/package.json` | `scripts.build` を `next build --webpack` に変更 |
| `apps/web/app/(admin)/admin/audit/audit-query.ts` | App Router page named export 制約に対応するため、既存 helper をページ外へ分離 |
| `apps/web/app/(admin)/admin/audit/page.tsx` | `jstLocalToUtcIso` named export を削除し helper import に置換 |
| `apps/web/app/(admin)/admin/audit/page.test.ts` | helper import 先を `audit-query.ts` へ変更 |
| `scripts/patch-next-standalone-instrumentation.mjs` | webpack output で instrumentation が未生成の場合の explicit skip guard を追加 |
| `CLAUDE.md` | `apps/web` production build は OpenNext Workers 互換のため webpack を正本と明記 |
| `docs/00-getting-started-manual/specs/00-overview.md` | apps/web production build の webpack 正本を追記 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | workflow sync 履歴を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | workflow sync 履歴を追加 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | workflow sync log を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | workflow quick reference を追加し、`runner-version.txt` evidence 名へ補正 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | resource-map entry を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` で再生成 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` で再生成 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow entry を追加 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned.md` | lessons hub entry を追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-web-app-route-bundle-parse-fix-artifact-inventory.md` | artifact inventory を追加 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-web-app-route-bundle-parse-fix-2026-05.md` | lessons を追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260509-web-app-route-bundle-parse-fix.md` | changelog を追加 |
| `docs/30-workflows/web-app-route-bundle-parse-fix/` | Phase 1-13 workflow package and Phase 11/12 evidence outputs を追加 |

## Skill Ledger

| Category | Path | Result |
| --- | --- | --- |
| skill 正本 | `.claude/skills/aiworkflow-requirements/SKILL.md` | updated |
| skill 履歴 | `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | updated |
| skill LOGS | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | updated |
| skill changelog fragment | `.claude/skills/aiworkflow-requirements/changelog/20260509-web-app-route-bundle-parse-fix.md` | created |
| skill reference | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | updated |
| skill reference | `.claude/skills/aiworkflow-requirements/references/workflow-web-app-route-bundle-parse-fix-artifact-inventory.md` | created |
| skill reference | `.claude/skills/aiworkflow-requirements/references/lessons-learned-web-app-route-bundle-parse-fix-2026-05.md` | created |
| system spec | `docs/00-getting-started-manual/specs/00-overview.md` | updated |

`task-specification-creator` was consulted but not edited. Its existing Phase 12 rules already cover strict outputs, artifacts parity, implemented-local state vocabulary, and adjacent dirty-code classification; this workflow's improvement is recorded as applied lessons and routed feedback.

## Validator / Command Evidence

| Command | Exit | Evidence |
| --- | --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 0 | `outputs/phase-11/evidence/typecheck.log` |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | 0 | `outputs/phase-11/evidence/lint.log` |
| `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | 0 | `outputs/phase-11/evidence/build.log` |
| `grep -E "\\[project\\]/" apps/web/.open-next/worker.js` | 1 | `outputs/phase-11/evidence/grep-gate.log`; expected no match |
| `cmp -s docs/30-workflows/web-app-route-bundle-parse-fix/artifacts.json docs/30-workflows/web-app-route-bundle-parse-fix/outputs/artifacts.json` | 0 | root/output artifacts parity |
| `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | 0 | regenerated `indexes/topic-map.md` and `indexes/keywords.json`; 569 files / 4372 keywords |
| `git diff --diff-filter=D --name-only -- docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export docs/30-workflows/issue-548-ml-model-selection` | 0 matches after restore | external workflow deletion blocker cleared |

The 2026-05-09 review reran `typecheck`, `lint`, `build:cloudflare`, and Worker bundle grep after the admin audit helper extraction; all passed in the current worktree.

Evidence index: `docs/30-workflows/web-app-route-bundle-parse-fix/outputs/phase-11/main.md`.
