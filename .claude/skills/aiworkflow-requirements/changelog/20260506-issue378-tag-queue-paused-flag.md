# Issue #378 Tag Queue Paused Flag

- Workflow root: `docs/30-workflows/completed-tasks/issue-378-tag-queue-paused-flag/`
- State: `implemented-local / implementation / NON_VISUAL / Phase 12 strict outputs present / Phase 13 pending_user_approval`
- Source unassigned task: `docs/30-workflows/completed-tasks/task-issue-109-tag-queue-pause-flag-001.md`（旧 `docs/30-workflows/unassigned-task/task-issue-109-tag-queue-pause-flag-001.md` を `consumed_by_issue_378` でクローズ移送）
- Runbook: `docs/30-workflows/runbooks/tag-queue-pause.md`
- Runtime contract: `TAG_QUEUE_PAUSED` は non-secret Cloudflare variable。`"true"` 完全一致のみ Forms sync candidate enqueue を D1 read/write 前に停止し、`{ enqueued: false, reason: "paused" }` と structured log `UBM-TAGQ-PAUSED` を返す。`"True"` / `"1"` / `"yes"` 等は停止しない strict parser。
- Boundary: pause 対象は Forms sync candidate enqueue のみ。admin queue listing / resolve / reject / retry tick / 既存 queue 行 / `member_tags` guarded write は影響を受けない。
- Implementation files: `apps/api/src/env.ts`、`apps/api/wrangler.toml`、`apps/api/src/workflows/tagCandidateEnqueue.ts`、`apps/api/src/workflows/tagCandidateEnqueue.test.ts`、`apps/api/src/jobs/sync-forms-responses.ts`、`apps/api/src/jobs/sync-forms-responses.test.ts`。
- System spec sync: `docs/00-getting-started-manual/specs/11-admin-management.md` に `TAG_QUEUE_PAUSED` 運用 guard、`docs/00-getting-started-manual/specs/12-search-tags.md` に candidate enqueue pause 契約と strict parser ルールを追記。
- Skill spec sync: `references/environment-variables.md`（non-secret Cloudflare variable に追加）、`references/deployment-cloudflare.md`（Forms sync 停止 + runbook 参照）、`references/task-workflow-active.md`（issue-378 行追加）、`indexes/quick-reference.md`（pause flag 早見行）、`indexes/resource-map.md`（workflow root + Inventory / Lessons 参照）、`SKILL.md`（v2026.05.06-issue378-tag-queue-paused-flag change-history）。
- Artifact inventory: `references/workflow-issue-378-tag-queue-paused-flag-artifact-inventory.md`（Phase 12 strict outputs と implementation/spec sync の正本台帳）。
- Lessons-learned: `lessons-learned/lessons-learned-issue-378-tag-queue-paused-flag-2026-05.md`（L-378-001..004: 三点セット設計 / pause 境界の固定 / admin UI toggle 後回し / skill 定義変更不要とリソース追加の区別）。
- Stale-current classification: 旧 issue-109 phase-12.md / phase-13.md の secret / 503 短絡 / admin UI 停止記述を stale-current として撤回。current source は本 workflow と runbook。
- Phase 12 skill-feedback-report: task-specification-creator / aiworkflow-requirements / automation-30 の **skill 定義** 変更不要を明記。本 changelog / inventory / lessons の 3 件は spec sync resource として追加（skill 定義変更とは別レイヤー）。
- Phase 12 unassigned-task-detection: 0 件（log sampling / admin UI toggle / 汎用 parser 等の後続候補を検討・却下）。
- Legacy filename register: 新規 workflow root のため `references/legacy-ordinal-family-register.md` 更新不要。
