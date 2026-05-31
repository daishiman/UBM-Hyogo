# 2026-05-30 issue-998-members-publish-state-production-rollout

## Summary

Synced `docs/30-workflows/completed-tasks/issue-998-members-publish-state-production-rollout/` as `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION`.

## Changes

- Applied `apps/api/wrangler.toml` production `MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"`.
- Kept auto-publish policy, Forms sync integration, diagnostics, backfill endpoint, public filter, and ops scripts unchanged.
- Recorded Issue #998 as CLOSED; PR wording must use `Refs #998` only.
- Registered quick-reference, resource-map, task-workflow-active, artifact inventory, LOGS, SKILL.md, and SKILL-changelog in the same wave.
- Recorded Gate-B local evidence: API typecheck, API build, API regression suite including the target specs, flag drift grep, and shell syntax check.

## Lessons Learned

- lessons-learned 新規: `lessons-learned/lessons-learned-issue-998-members-publish-state-production-rollout-2026-05.md`（L-I998PROD-001..007）
- 主要教訓: flag + backfill の両輪（001）/ apply 前 D1 backup（002）/ admin override 非上書き保証（003）/ staging 実績比乖離で apply 中止・escalate（004）/ deploy rollback 手順（005）/ secret redaction grep（006）/ Issue #998 CLOSED 維持・`Refs #998` のみ（007）
- artifact inventory に `## Lessons Learned` 節を追加

## User-Gated

Staging/production deploy, D1 backfill apply, `/members` browser smoke screenshots, commit, push, and PR remain user-gated. Issue #998 is CLOSED and remains `Refs #998` only.
