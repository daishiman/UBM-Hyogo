# Documentation Changelog

| Date | Area | Change |
| --- | --- | --- |
| 2026-05-15 | workflow | Added root/output `artifacts.json`, Phase 11 evidence index, and Phase 12 strict 7 outputs for Issue #299 fallback retirement |
| 2026-05-15 | workflow | Clarified GO vs DEFERRED state transitions and prevented source unassigned task from being marked completed before fallback deletion |
| 2026-05-15 | aiworkflow-requirements | Registered the new workflow in database implementation core, quick-reference, resource-map, task-workflow-active, artifact inventory, changelog, and LOGS |
| 2026-05-15 | compliance | Added 30-method compact evidence, strict 7 inventory, root/output artifacts parity, and planned-wording grep gate |
| 2026-05-15 | runtime / coverage | ユーザーローカルで production / staging coverage SQL を実行し、両方 0 件であることを確認（`outputs/phase-11/coverage-evidence.md`） |
| 2026-05-15 | code | `apps/api/src/repository/schemaQuestions.ts#findStableKeyByQuestionId` 内 `schema_questions.stable_key` SELECT fallback を削除（L142-150） |
| 2026-05-15 | test | `apps/api/src/sync/schema/resolve-stable-key.spec.ts` の "fallback" ケースを "fallback retired" セマンティクスへ書き換え、known-hit assertion を追加（6/6 PASS） |
| 2026-05-15 | review-fix | `resolve-stable-key.ts` の旧 `schema_questions` alias コメントを `schema_aliases` 正本へ補正 |
| 2026-05-15 | review-fix | workflow root index と `task-workflow-active.md` / `quick-reference.md` の実装後状態を `implementation_complete_pending_pr` / fallback retired へ同期 |
| 2026-05-15 | review-fix | `scripts/diagnose/schema-aliases-coverage.sql` を alias 存在確認から stable_key 一致確認込みの semantic coverage へ強化 |
| 2026-05-15 | review-fix | Phase 11 coverage evidence に staging が production D1 と同一 binding である境界を明記 |
| 2026-05-15 | aiworkflow-requirements | `database-implementation-core.md` の Schema Alias Resolution Contract / 03a lookup 順序 / 移行終端条件を retired 表記へ同期 |
| 2026-05-15 | evidence | Phase 11 evidence ファイル群を runtime_pending から実測値へ書き換え（test-results / coverage / static-guard / diff / sync-log / main） |

## Verification commands

| Command | Expected |
| --- | --- |
| `test -f docs/30-workflows/task-issue-299-schema-questions-fallback-retirement-001/artifacts.json` | exit 0 |
| `cmp -s docs/30-workflows/task-issue-299-schema-questions-fallback-retirement-001/artifacts.json docs/30-workflows/task-issue-299-schema-questions-fallback-retirement-001/outputs/artifacts.json` | exit 0 |
| `find docs/30-workflows/task-issue-299-schema-questions-fallback-retirement-001/outputs/phase-12 -maxdepth 1 -type f | wc -l` | at least 7 |
| `rg -n "TODO|TBD|FIXME|planned|予定" docs/30-workflows/task-issue-299-schema-questions-fallback-retirement-001/outputs/phase-12` | only explanatory gate wording, no placeholder evidence |
| `pnpm indexes:rebuild` | indexes regenerate successfully |
