# dev sync: cross-skill 6-file conflict も `pnpm sync:resolve` 単一パスで full resolve（2026-05-31 issue-1016）

- 日時: 2026-05-31
- ブランチ: `docs/issue-1016-mobile-drawer-responsive-spec` ← `dev`（9 behind / 3 ahead・ローカル dev は origin/dev に既一致 `bb647c502` で同期は冪等スキップ）
- 関連: `task-specification-creator/changelog/20260531-devsync-issue-1016-cross-skill-6file-conflict-single-resolve-pass.md`、lessons-learned L-DEVSYNC-076 / SP-DEVSYNC-076
- 事象: `git merge dev --no-edit` で `CONFLICT (content)` が **6 件・2 skill 横断**:
  - `aiworkflow-requirements/indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}`
  - `aiworkflow-requirements/references/task-workflow-active.md`
  - `task-specification-creator/references/patterns-lessons-and-pitfalls.md`
  - （`SKILL-changelog.md` / `LOGS/_legacy.md` は `.gitattributes merge=union` で Auto-merging・衝突なし）
  - `apps/**` / `packages/**` の source conflict は 0 件。
- 解消: `pnpm sync:resolve` **1 回**で完結。resolver ログ = `union-resolving 5 files`（quick-reference / resource-map / topic-map / task-workflow-active / **patterns-lessons-and-pitfalls.md**）→ `taking --ours for 1 derived files`（keywords.json）→ `pnpm indexes:rebuild`。`git ls-files -u` 0 で収束。L-DEVSYNC-074 の index.lock 中間状態は発生せず（dev ff 同期と時間的に重ねなかった）。
- 新規知見:
  1. resolver の union 対象は task-spec `patterns-lessons-and-pitfalls.md` も含む（衝突が task-spec 側に出ても resolver 直行で足りる）。
  2. keywords.json は merge=union ではなく `--ours`+rebuild 段で処理される（「常に union auto-merge」前提に依存しない）。
  3. skill-only なら conflict file 数が 6・2 skill 横断でも resolver 単一パスで full resolve。
- 検証: `pnpm sync:resolve`（exit 0・`all skill / index conflicts resolved`）→ `git ls-files -u | wc -l` = 0 → merge commit → `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `pnpm indexes:rebuild` drift 0 で all green。CI failure なし。
