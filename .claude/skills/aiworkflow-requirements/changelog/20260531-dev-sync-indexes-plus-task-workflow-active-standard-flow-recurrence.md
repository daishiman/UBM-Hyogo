# dev sync: indexes 3 map + task-workflow-active の UU は `pnpm sync:resolve` 単独で完結（再現確認 2026-05-31）

- 日時: 2026-05-31
- ブランチ: `feat/issue-1006-members-selected-filters-chip-ux-hardening` ← `dev`
- 関連: `task-specification-creator/changelog/20260531-dev-sync-indexes-plus-task-workflow-active-standard-flow-recurrence.md`
- 事象: `git merge dev --no-edit` 後に CONFLICT(content) が本 skill 配下の 4 ファイルのみ:
  - `indexes/quick-reference.md`
  - `indexes/resource-map.md`
  - `indexes/topic-map.md`
  - `references/task-workflow-active.md`
  - （`indexes/keywords.json` と `SKILL-changelog.md` は `.gitattributes merge=union` で auto-merge、コンフリクトせず）
- 解消: `pnpm sync:resolve`（`scripts/sync/resolve-skill-merge-conflicts.sh`）のみで完結。4 ファイルを union-resolve → `pnpm indexes:rebuild` で索引再生成。手動編集・追加スクリプト不要。
- 検証: 残 UU 0 件（`git ls-files -u` = 0）→ `git commit --no-edit`（lefthook pre-commit pass）→ `pnpm install` / `pnpm typecheck`（全 package Done）/ `pnpm lint`（exit 0）で all green。CI failure なし。
- 教訓: コンフリクトマーカー残存の確認に `grep ... | head` を使うと `$?` がパイプ末尾 `head` の 0 を拾い誤って「残存なし」と判定する。残 UU は `git diff --diff-filter=U --name-only` と `git ls-files -u | wc -l` を正本に確認する。
- 本 skill 索引への影響: `indexes/*` は `pnpm indexes:rebuild` が冪等再生成するため、union-resolve 後の手動整形は不要。`references/task-workflow-active.md` は union 後も active workflow の重複行が出る場合があるが、本セッションでは重複なし。
