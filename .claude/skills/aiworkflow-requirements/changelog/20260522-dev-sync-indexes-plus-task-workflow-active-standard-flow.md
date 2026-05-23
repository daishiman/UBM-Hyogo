# dev sync: skill indexes + `task-workflow-active.md` の UU も `pnpm sync:resolve` 単独で完結する

- 日時: 2026-05-22
- ブランチ: `feat/issue-806-dynamic-member-og-image` ← `dev`
- 関連: `task-specification-creator/changelog/20260522-dev-sync-indexes-plus-task-workflow-active-standard-flow.md`
- 事象: `git merge origin/dev` 後の UU が本 skill 配下の 4 ファイル:
  - `indexes/keywords.json`
  - `indexes/quick-reference.md`
  - `indexes/topic-map.md`
  - `references/task-workflow-active.md`
- 解消パス:
  1. `pnpm sync:resolve` 実行
     - `.md` 3 ファイル (`quick-reference.md` / `topic-map.md` / `task-workflow-active.md`) は `scripts/sync/resolve-skill-merge-conflicts.sh` が union 採用
     - `keywords.json` は `--ours` 採用 → `pnpm indexes:rebuild` で再生成
  2. `git add -A && git commit --no-edit` で merge コミット完成 (lefthook `main-branch-guard` / `staged-task-dir-guard` / `block-test-suffix` / `block-stable-key-update` を pass)
  3. `pnpm typecheck` / `pnpm lint` all green
- 拡張点 (20260522-dev-sync-skill-indexes-only-conflict-standard-flow.md からの差分):
  - `references/task-workflow-active.md` も UU になるケースが追加。これも `.gitattributes` の `merge=union` 層と resolver の union 採用層で機械的に解消されるため、`indexes/**` 限定ではなく **`references/task-workflow-active.md` を含む skill 内 union 対象全ファイルが UU の場合も `pnpm sync:resolve` 1 コマンドで完結する** と一般化できる。
- 反映先: `references/task-workflow-active.md` の dev-sync runbook に「`indexes/**` + `references/task-workflow-active.md` だけが UU なら `sync:resolve` 1 コマンドで完結」と明文化候補。
