# member-profile-google-form-data-reflection artifact inventory

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/member-profile-google-form-data-reflection/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| purpose | Google Form 回答が `schema_questions` 空により unmapped 化し、公開メンバー詳細へ反映されない fail-silent を恒久修正する |
| implementation | `packages/integrations/google/src/forms/{mapper,client}.ts` including `GoogleFormsClient.getQuestionIdToStableKey`, `packages/integrations/src/index.ts`, `apps/api/src/forms/build-qid-map.ts`, `apps/api/src/index.ts`, `apps/api/src/jobs/sync-forms-responses.ts` |
| tests | `packages/integrations/google/src/forms/{mapper,client.branches}.spec.ts`, `apps/api/src/forms/build-qid-map.spec.ts`, `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` |
| docs | `docs/30-workflows/completed-tasks/member-profile-google-form-data-reflection/runbooks/recovery.md`, `outputs/phase-1/*` through `outputs/phase-12/*` |
| evidence | integrations google forms focused 18 PASS; build-qid-map 2 PASS; response sync contract 34 PASS; api/integrations/integrations-google typecheck PASS; phase12 compliance PASS |
| user-gated | staging schema sync, response fullSync, before/after screenshots, deploy, commit, push, PR |

## Lessons

| ID | Lesson |
| --- | --- |
| L-MPFR-001 | Response sync must not depend solely on persisted `schema_questions`; live form labels are available in the same API call and can provide a bounded fallback. |
| L-MPFR-002 | Empty qid maps and fully-unmapped response batches are related but distinct operational signals; measure qidMapSize from the Forms client and emit alerts without breaking cursor progression. |
| L-MPFR-003 | VISUAL recovery can be locally implemented while runtime mutation/screenshots remain user-gated. |
