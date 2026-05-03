# 2026-05-03 ut-branch-flow-dev-staging-sync

`docs/30-workflows/ut-branch-flow-dev-staging-sync/` を `verified / implementation / NON_VISUAL / implementation_complete_pending_pr` として同期した。

- `scripts/new-worktree.sh` の分岐元を `origin/dev` に統一。
- `CLAUDE.md` と `.claude/commands/ai/diff-to-pr.md` の PR default base を `dev` に統一。
- dev → main は別 release gate として分離。
- Phase 11 NON_VISUAL evidence、Phase 12 strict 7 files、root/outputs `artifacts.json` parity を追加。
- `docs/30-workflows/ut-05a-auth-ui-logout-button-001/` 削除に伴い、active quick/resource/task-workflow から stale evidence link を撤回。

commit / push / PR は user approval gate。
