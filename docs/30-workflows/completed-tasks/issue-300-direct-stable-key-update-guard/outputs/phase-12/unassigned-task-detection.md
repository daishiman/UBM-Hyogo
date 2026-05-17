[実装区分: 実装仕様書]

# Unassigned task detection

| # | 検出項目 | status | formalize decision | path | 根拠 |
| --- | --- | --- | --- | --- | --- |
| 1 | SQL AST / TypeScript AST guard への強化 | no-op | 今回は起票しない | N/A | 400/160 lookahead の multiline fixture、quoted/schema-qualified SQL fixture、builder fixture、複数違反 fixture、repository scan 14 tests を実装済み。AST 化は現時点では複雑性が要件を上回る |
| 2 | repository contract test（`schema_questions` repository に stable_key 更新メソッドを持たないことの型レベル / contract 検査） | done | guard repository scan + dead code deletion で同一 wave 完了 | `scripts/lint-stable-key-update.spec.ts` / `apps/api/src/repository/schemaQuestions.ts` | `updateStableKey()` 削除、`--strict` 全 scan 0 violation を Phase 11 evidence 化 |
| 3 | 既存 unassigned `task-issue-191-direct-stable-key-update-guard-001` の close-out | done | 本 workflow が同タスクの実体化（`docs/30-workflows/completed-tasks/unassigned-task/` への移管は Phase 13 PR merge 後） | `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md` | 起票元 |

## 起票元更新

- `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md` の末尾に
  「後継 workflow: `docs/30-workflows/issue-300-direct-stable-key-update-guard/`、status: implemented_local_runtime_pending、AC close-out: pending PR/CI runtime」を追記済み

## raw / formal

- open follow-up 0 件。今回サイクル内で解消できる改善は実装へ取り込み済み。
