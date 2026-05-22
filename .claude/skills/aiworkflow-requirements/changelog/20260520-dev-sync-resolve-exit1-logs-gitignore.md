# dev sync: `pnpm sync:resolve` exit 1 on `LOGS/_legacy.md` `.gitignore` hint

- 日時: 2026-05-20
- ブランチ: `feat/ut-07c-followup-001-attendance-csv-import` ← `dev`
- 事象: `pnpm sync:resolve` が 4 ファイル union-resolved 後の最終 `git add` で `.gitignore` (LOGS/) 競合 hint により `ELIFECYCLE exit 1` 終了。`indexes/keywords.json` の `--ours + rebuild` step がスキップされ、UU 残置。
- 解消: 手動で `git checkout --ours indexes/keywords.json && mise exec -- pnpm indexes:rebuild` を発行。
- 反映先:
  - `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` に L-DEVSYNC-027 を追加
  - `task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` に section 10「dev sync `pnpm sync:resolve` exit 1 後の自律継続条件」を追加
