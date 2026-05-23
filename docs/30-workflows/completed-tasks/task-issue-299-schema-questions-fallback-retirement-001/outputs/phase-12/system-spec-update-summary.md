# System Spec Update Summary

## Step 1-A: task record

`implementation_complete_pending_pr`: Issue #299 fallback retirement のローカル実装が GO 分岐で完了。production / staging coverage 0 件確認後、`findStableKeyByQuestionId` 内 `schema_questions.stable_key` SELECT fallback を削除し、test と正本仕様を retired セマンティクスへ同期した。残作業は Phase 13 のユーザー承認・commit・push・PR 作成のみ。

Updated surfaces（今サイクルの最終形）:

| Surface | State | Evidence |
| --- | --- | --- |
| `apps/api/src/repository/schemaQuestions.ts` | **modified (code)** | L142-150 fallback SELECT を削除し alias-only 経路に統一。doc comment を retirement note へ更新 |
| `apps/api/src/sync/schema/resolve-stable-key.spec.ts` | **modified (test)** | "fallback" ケースを "fallback retired" セマンティクスへ書き換え、known-hit ケースを追加（計 6 ケース） |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | **modified (spec)** | Schema Alias Resolution Contract / 03a lookup 順序 / 移行終端条件を retired 表記へ更新 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | updated (前サイクル) | fallback follow-up は本 workflow を canonical execution root として指す |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | updated (前サイクル) | Schema Alias Resolution row が Issue #299 workflow を含む |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | updated (前サイクル) | active workflow entry を保持。GO 完了に伴い後続ローテーション対象に追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260515-issue299-schema-questions-fallback-retirement-spec.md` | created (前サイクル) | aiworkflow sync changelog |
| `docs/30-workflows/LOGS.md` | updated (前サイクル) | workflow sync log |
| `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` | **mark completed by task-issue-299** | GO 完了に伴い「completed by task-issue-299 on 2026-05-15」を追記（ファイル削除はしない） |

## Step 1-B: implementation state

Root state は `implementation_complete_pending_pr` に遷移する。production / staging coverage 0 件で GO 判定し、`findStableKeyByQuestionId` 内 fallback SELECT 削除、関連 test 更新、正本仕様同期、focused unit test 6/6 PASS、typecheck PASS、static guard 0 件確認まで完了している。

## Step 1-C: related task status

Source unassigned task `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` は **completed by task-issue-299** として追記し、ファイル自体は履歴トレースのため残す。`task-issue-191-direct-stable-key-update-guard-001` は本タスクスコープ外として `unassigned-task-detection.md` に残し open 維持。

## Step 2: system spec changes

- public API・D1 schema・Cloudflare binding の追加変更は無し。
- `apps/api/src/repository/schemaQuestions.ts#findStableKeyByQuestionId` の internal 実装が「alias lookup + schema_questions fallback」から「alias lookup-only」に縮退（外部シグネチャ不変）。
- 正本仕様 `database-implementation-core.md` の 03a lookup 順序を「step 2 で fallback SELECT を読む」記述から「miss なら null を返し unresolved として enqueue」記述へ更新。
- 移行終端条件セクションを「今後の判定対象」→「2026-05-15 達成済み」へ書き換え。

## Same-wave sync notes

- `topic-map.md` / `keywords.json` は generated indexes であり、必要に応じて Phase 13 の前後で `pnpm indexes:rebuild` を実行する。
- production D1 への apply は不要（schema 変更を含まないため）。本タスクはコード経路のみの変更で、D1 スキーマ・データは無変更。
