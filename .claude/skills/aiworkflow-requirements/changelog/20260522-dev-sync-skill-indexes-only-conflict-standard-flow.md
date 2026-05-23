# dev sync: skill indexes のみが UU の場合は `pnpm sync:resolve` 単独で完結する

- 日時: 2026-05-22
- ブランチ: `feat/step-06-meetings-attendance-confirm-dialog` ← `dev`
- 関連: `task-specification-creator/changelog/20260522-dev-sync-skill-indexes-only-conflict-standard-flow.md`
- 事象: `git merge dev` 後の UU は本 skill (`aiworkflow-requirements`) の indexes 4 ファイルのみ:
  - `indexes/keywords.json`
  - `indexes/quick-reference.md`
  - `indexes/resource-map.md`
  - `indexes/topic-map.md`
- 解消パス:
  1. `pnpm sync:resolve` を実行
     - 3 `.md` は scripts/sync/resolve-skill-merge-conflicts.sh が union 採用
     - `keywords.json` は `--ours` 採用 → `pnpm indexes:rebuild` で再生成
  2. `git commit --no-edit` で merge コミット完成 (lefthook の `main-branch-guard` / `staged-task-dir-guard` / `block-test-suffix` / `block-stable-key-update` を pass)
  3. `pnpm typecheck` / `pnpm lint` で all green を確認
- 補足: 本ケースは `apps/**` や `docs/30-workflows/**` の意味的競合が無く、`pnpm sync:resolve` の 3 層予防のうち層 1 (.gitattributes union) と層 2 (resolver) のみで完了する最短経路。
- 反映先 (本 skill 側): `references/task-workflow-active.md` の dev-sync runbook に「UU が本 skill indexes のみの場合は sync:resolve 1 コマンドで完結」と明文化する候補として記録。
