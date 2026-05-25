# dev sync: skill indexes 4 種 + `task-workflow-active.md` の UU が `pnpm sync:resolve` 1 発で完結（再発確認）

- 日時: 2026-05-25
- ブランチ: `docs/issue-864-admin-staging-runtime-smoke-ci-gate-spec` ← `origin/dev`
- 事象: `git merge origin/dev` 後の UU は次の 5 ファイルのみ:
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- 解消: `pnpm sync:resolve` 単独で完結（`.md` は union、`keywords.json` は `--ours` + `pnpm indexes:rebuild`）。手動編集ゼロ。
- 意義: `20260522-*-standard-flow` 系で文書化された 3 層予防（`.gitattributes merge=union` + `pnpm sync:resolve` + lessons-learned）が再現性をもって機能していることを再確認。本 skill 群への新規ルール追加は不要、運用通り。
- 検証順: `pnpm sync:resolve` → `git commit` (lefthook pass) → `pnpm typecheck` → `pnpm lint`。
- 関連: `task-specification-creator/changelog/20260525-dev-sync-indexes-plus-task-workflow-active-recurrence.md`
- 再現#2 (同日): ブランチ `docs/issue-872-google-brand-4tone-icon-spec` ← `origin/dev`。UU は本 skill の `SKILL.md` を加えた 6 ファイル + `docs/30-workflows/LOGS.md`（`merge=union` 自動結合）。`pnpm sync:resolve` 1 発で full resolve、手動編集ゼロ。3 層予防（`.gitattributes merge=union` + `pnpm sync:resolve` + lessons-learned）が同日 2 回連続で再現性を実証。新規ルール追加なしの判断を維持。
