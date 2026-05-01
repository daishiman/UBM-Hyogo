# System Spec Update Summary

Current state: `spec_created` / Phase 11 `not executed`. The canonical workflow path has been added to aiworkflow quick-reference / resource-map, but captured visual evidence has not been reflected as completed system behavior.

| Step | 判定 | 反映先 | 内容 | 完了条件 |
| --- | --- | --- | --- | --- |
| Step 1-A | planned | `docs/00-getting-started-manual/specs/05-pages.md` | `/profile` read-only visual observation（#4/#5/#8/#11） | M-08〜M-10 and M-14〜M-16 captured |
| Step 1-B | planned | `docs/00-getting-started-manual/specs/13-mvp-auth.md`, `02-auth.md` | local fixture / staging session の二経路 | session evidence captured without secrets |
| Step 1-C | partial | `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md` | legacy follow-up から canonical workflow root への導線 | current diff reviewed and index regenerated if required |
| Step 1-D | planned | `references/task-workflow-active.md` or equivalent aiworkflow task ledger | pending / partial / captured state transition | Phase 11 result known |
| Step 2 | conditional | `docs/30-workflows/unassigned-task/UT-06B-PROFILE-VISUAL-EVIDENCE-STAGING-FOLLOWUP.md` | 09a staging gate 未達時の follow-up materialization | M-14〜M-16 unavailable at Phase 11 close |

親 06b `manual-smoke-evidence.md` の captured 化は Phase 11 の `manual-smoke-evidence-update.diff` として扱う。実 evidence 未取得のため、この文書は completed sync ではなく pending sync plan である。
