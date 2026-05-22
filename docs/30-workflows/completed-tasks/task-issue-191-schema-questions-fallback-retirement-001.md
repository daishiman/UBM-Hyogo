# task-issue-191-schema-questions-fallback-retirement-001

## メタ情報

| Field | Value |
| --- | --- |
| Status | completed by task-issue-299 (2026-05-15) |
| Priority | Medium |
| Source | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Type | migration-cleanup |
| GitHub Issue | #299 |
| Production apply prerequisite | satisfied by `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 already-applied verification |
| Canonical execution root | `docs/30-workflows/task-issue-299-schema-questions-fallback-retirement-001/` |
| Current execution state | implementation_complete_pending_pr（GO 分岐、Phase 13 ユーザー承認待ち） |

## 1. なぜこのタスクが必要か（Why）

`schema_questions.stable_key` fallback は移行期間だけの互換策である。永続化すると `schema_aliases` と `schema_questions` の二重正本になり、03a / 07b の stableKey 解決契約が再び曖昧になる。

## 2. 何を達成するか（What）

- `schema_questions.stable_key IS NOT NULL` の全行が `schema_aliases.alias_question_id` に移行済みか確認する。
- alias lookup hit / fallback hit / unresolved 件数を運用ログで確認する。
- fallback hit が 0 で廃止条件を満たす場合のみ fallback を削除または無効化する。
- 廃止または延期の判断を migration report と正本仕様へ反映する。

## 3. どのように実行するか（How）

issue-191 実装完了後、D1 の coverage query と 03a sync logs を見て廃止可否を判断する。2026-05-02 時点で production D1 の `schema_aliases` table と required indexes は確認済みのため、次の blocker は production apply ではなく coverage / runtime fallback hit の監査である。例外が 1 件でもある場合は fallback を残し、例外一覧、理由、再判定条件を記録する。

## 4. 実行手順

1. issue-191 実装タスクと production D1 shape verification が完了済みであることを確認する。
2. `schema_questions.stable_key IS NOT NULL` の行を抽出する。
3. 全行が `schema_aliases.alias_question_id` に存在するか確認する。
4. 03a sync logs で alias lookup hit / fallback hit / unresolved enqueue を確認する。
5. 廃止可なら fallback code を削除または無効化する。
6. 廃止不可なら migration report に例外と再判定条件を残す。

## 5. 完了条件チェックリスト

- [x] fallback coverage report がある。
- [x] fallback hit が 0、または例外一覧が明記されている。
- [x] 廃止した場合は 03a lookup が `schema_aliases` 正本へ一本化されている。
- [x] 延期不要。coverage 0 rows で GO 分岐完了。
- [x] `database-implementation-core.md` と関連 task docs が更新されている。

## 6. 検証方法

```sql
SELECT q.question_id, q.stable_key
FROM schema_questions q
LEFT JOIN schema_aliases a ON a.alias_question_id = q.question_id
WHERE q.stable_key IS NOT NULL
  AND a.alias_question_id IS NULL;
```

期待: 廃止する場合は 0 件。

```bash
rg -n "findStableKeyById|schema_questions\\.stable_key|UPDATE schema_questions SET stable_key" apps packages
```

期待: 廃止後の 03a 実行経路に fallback 依存が残らない。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| coverage 不完全のまま fallback を削除する | coverage query が 0 件になるまで削除しない |
| fallback hit の実運用依存を見落とす | 03a sync logs と queue metrics を併用する |
| 廃止延期が恒久化する | 再判定条件と期限を migration report に残す |

## 8. 参照情報

- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/implementation-guide.md`

## 9. 備考

このタスクは cleanup であり、`schema_aliases` DDL や 07b wiring の初回実装は含まない。

## 2026-05-15 同期メモ

Issue #299 の canonical execution root は `docs/30-workflows/task-issue-299-schema-questions-fallback-retirement-001/`。source trace として本ファイルは残す。2026-05-15 に coverage query 0 rows、fallback 削除、test/static gate PASS まで GO 分岐が完了したため、本ファイルは `completed by task-issue-299` として扱う。Phase 13 の commit / push / PR / Issue mutation はユーザー承認待ち。

## 2026-05-15 完了メモ（completed by task-issue-299）

| 項目 | 結果 |
| --- | --- |
| production coverage SQL | 0 rows（`scripts/diagnose/schema-aliases-coverage.sql`） |
| staging coverage SQL | 0 rows（production と同一 D1 binding） |
| fallback コード削除 | `apps/api/src/repository/schemaQuestions.ts#findStableKeyByQuestionId` の `schema_questions.stable_key` SELECT fallback を削除 |
| test 更新 | `apps/api/src/sync/schema/resolve-stable-key.spec.ts` を fallback retired セマンティクスへ書き換え（6/6 PASS） |
| static guard | 対象ファイル内に fallback SELECT 0 件確認 |
| 正本仕様 | `database-implementation-core.md` の Schema Alias Resolution Contract / 03a lookup 順序 / 移行終端条件を retired 表記へ同期 |
| 残作業 | Phase 13 ユーザー承認 → commit / push / PR 作成（`Refs #299`、Issue は open 維持） |

履歴トレースのため本ファイルは削除しない。後続の direct stable_key update guard 強化は `task-issue-191-direct-stable-key-update-guard-001` で別途扱う。

## 苦戦箇所【記入必須】

苦戦箇所は「互換 fallback を安全に消すタイミング」の判断である。設計上は早く消したいが、移行中の既存 stableKey を失うと sync の unresolved が増えるため、coverage と実ログの両方を廃止条件にする。

## スコープ（含む/含まない）

含む: coverage report、fallback hit audit、fallback 削除/延期判断、仕様反映。

含まない: 初回 `schema_aliases` migration、07b route 実装、本番 apply の承認操作。
