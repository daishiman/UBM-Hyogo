## Summary

- A-2 skill ledger fragment 化の 13 Phase 実装仕様書を `docs/30-workflows/task-skill-ledger-a2-fragment/` に作成
- `pnpm skill:logs:render` / `pnpm skill:logs:append` と共通 lib（`scripts/lib/*`）を実装、vitest 15 件 Green
- 8 skill の `LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` を `_legacy.md` へ git mv（92 ファイル、履歴連続性保持）
- workflow: `implementation` / NON_VISUAL

## Test plan

- [x] `mise exec -- pnpm typecheck` PASS
- [x] `mise exec -- pnpm vitest run scripts/skill-logs-render.test.ts scripts/skill-logs-append.test.ts` 16/16 Green
- [x] `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/task-skill-ledger-a2-fragment --strict --json`（実行は承認後）
- [x] `git log --follow .claude/skills/aiworkflow-requirements/LOGS/_legacy.md` で旧 `LOGS.md` 履歴の連続性確認
- [x] artifacts.json と outputs/ 実体の 1 対 1 突合
- [ ] 4 worktree smoke は計画固定のみ（後続 implementation タスクで実機）
- [x] `log_usage.js` 4 件の writer 切替は完了

## Acceptance Criteria

| AC | 結果 |
| -- | ---- |
| AC-1 fragment 受け皿作成 | PASS |
| AC-2 legacy 退避 | PASS |
| AC-3 writer 切替 | PASS |
| AC-4 render 降順 | PASS |
| AC-5 fail-fast（exit 1） | PASS |
| AC-6 `--out` tracked 拒否（exit 2） | PASS |
| AC-7 `--include-legacy` 30 日 | PASS |
| AC-8 4 worktree smoke 0 件 | 計画固定（後続実機） |

Refs: #130
