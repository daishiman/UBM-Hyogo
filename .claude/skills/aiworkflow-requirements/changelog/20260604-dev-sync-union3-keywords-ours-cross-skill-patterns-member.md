# dev sync: union 3（resource-map + topic-map + task-spec `patterns-lessons-and-pitfalls`）+ keywords `--ours` のスキル横断 member 構成を `pnpm sync:resolve` 単独完結（2026-06-04）

- 日時: 2026-06-04
- ブランチ: `feat/issue-1070-tag-reactivate-physical-delete`（sub-worktree `.worktrees/task-20260603-115209-wt-13`）← `dev`（HEAD 7 behind / ローカル dev = origin/dev 一致・独自コミット 0・ff 不要）
- 関連: `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-097（本件）/ L-DEVSYNC-096（union 3 の別構成・keywords 非衝突）/ task-specification-creator `lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-086
- 事象: `git merge dev --no-edit`（取込 7 コミット = #1070 系 tag reactivate / physical delete API + 既存 dev の skill 同期・apps 小デルタ群）の content CONFLICT は **4 file**:
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（派生物 = `--ours`）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md`（union・**スキル横断 member**）
  - （`indexes/quick-reference.md` / `references/task-workflow-active.md` / `SKILL.md` / `SKILL-changelog.md` / `LOGS/_legacy.md` は git auto-merge で衝突回避）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 3 files`（resource-map + topic-map + task-spec patterns-lessons-and-pitfalls）+ `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild`（keywords 5393 件）を完遂。`all skill / index conflicts resolved`・`WARN unhandled` なし exit 0 → `git diff --diff-filter=U` 0 で手動解消なしに収束。merge commit `b85cb643f`。
- member 構成の新規性: L-DEVSYNC-096 は union 3 = `quick-reference + topic-map + task-workflow-active`（keywords **非衝突**）だったが、本件は union 3 = `resource-map + topic-map + task-spec patterns-lessons-and-pitfalls`（keywords **衝突 `--ours`**）。同じ「union 3」でも member 集合と keywords 衝突有無が異なり、5 番目 union member が task-spec 配下に出る SP-DEVSYNC-085 型のスキル横断も同居しうる。**件数 N も内訳も予測せず resolver の実ログで確認**する結論は不変（全 member が `.gitattributes merge=union` 登録済で集合非依存に畳む）。
- `=` 罫線 false-positive: 残存マーカー確認の素朴 `git grep -lE '^(<<<<<<<|=======|>>>>>>>)'` が `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-11/manual-smoke-log.md` の `=` 装飾区切り線を `^=======` で偽陽性検出（本回も再現）。残存判定の正本は `git diff --name-only --diff-filter=U` = 0。
- 検証: `git fetch --prune origin`（dev=origin/dev 一致・独自コミット 0）→ `git rev-list --count HEAD..dev` = 7 → `git merge dev --no-edit` CONFLICT 4 → `pnpm sync:resolve` exit 0 → `git diff --diff-filter=U` 0 → merge commit `b85cb643f`（pre-commit hook 全 pass: main-branch-guard / block-test-suffix / staged-task-dir-guard（MERGE_HEAD で auto-skip）/ block-stable-key-update）→ `pnpm install --frozen-lockfile`（exit 0）→ `pnpm typecheck`（全 package Done）→ `pnpm lint`（exit 0）→ `pnpm indexes:rebuild` drift 0（5393 キーワード）で all green。CI failure なし。
