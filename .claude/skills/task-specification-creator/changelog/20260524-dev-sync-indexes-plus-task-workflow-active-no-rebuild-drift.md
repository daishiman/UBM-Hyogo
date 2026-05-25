# dev sync: indexes 4 + `references/task-workflow-active.md` の 5 件 UU でも `pnpm sync:resolve` 単独で post-merge drift ゼロ完結

- 日時: 2026-05-24
- ブランチ: `feat/wt-21` ← `dev`
- 関連: `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` 7 度目の再現追記
- 事象: `git merge dev` 後に UU が次の 5 ファイル:
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- 解消: `pnpm sync:resolve` のみで完結（4 md は union 採用、`keywords.json` は `--ours` + 内蔵 `pnpm indexes:rebuild` で deterministic 再生成）。`task-workflow-active.md` を含む 5 件型でも resolver の `UNION_TARGETS` がカバーするため手動 union 不要。
- 注目点: 過去 L-DEVSYNC-014 / L-DEVSYNC-015 系では `task-workflow-active.md` の union による行数増加に伴い `topic-map.md` の L 番号 drift が残置し、`pnpm indexes:rebuild` + 単独 `chore(indexes): rebuild …` commit が必要だった。今回は `sync:resolve` 内蔵の `indexes:rebuild` で drift も同一 merge commit に吸収され、`bash scripts/verify-pr-ready.sh` の `indexes:rebuild (no drift)` を一発 PASS。**追加コミットは発生しない**。
- 検証順: `pnpm sync:resolve` → `git commit --no-edit` (lefthook pre-commit pass) → `pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm lint` → `bash scripts/verify-pr-ready.sh` で all green（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` 3 gate）。
- 反映先（本 skill 側）:
  - `references/pr-pre-flight-ci-gate-checklist.md` 追記候補: 「UU が `indexes/*` 4 種 + `references/task-workflow-active.md` の 5 件型でも `pnpm sync:resolve` 1 コマンドで完結し、post-merge `indexes:rebuild` drift も発生しない最良ケースが定型化済。drift commit を予期して push を遅延させる必要はない」を明文化候補として記録。
