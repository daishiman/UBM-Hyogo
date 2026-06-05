# dev sync: 本スキル `patterns-lessons-and-pitfalls.md` が 5 番目 union member として衝突した union 3 + keywords `--ours` を `pnpm sync:resolve` 単独完結（2026-06-04）

- 日時: 2026-06-04
- ブランチ: `feat/issue-1070-tag-reactivate-physical-delete`（sub-worktree `.worktrees/task-20260603-115209-wt-13`）← `dev`（HEAD 7 behind / ローカル dev = origin/dev 一致・独自コミット 0・ff 不要）
- 関連: `lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-086（本件）/ SP-DEVSYNC-085（5 番目 union member が本スキル配下になる初観測）/ aiworkflow-requirements `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-097
- 事象: `git merge dev --no-edit`（dev → feature、取込 7 コミット）の content CONFLICT は **4 file**で、うち 1 件が本スキル配下:
  - `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md`（union・スキル横断 member）
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（派生物 = `--ours`）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - （`indexes/quick-reference.md` / `references/task-workflow-active.md` / `SKILL.md` / 本スキルの changelog/lessons は git auto-merge で衝突回避）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 3 files`（resource-map + topic-map + 本スキル patterns-lessons-and-pitfalls）+ `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild`（keywords 5393 件）を完遂。手動編集・追加スクリプト不要。merge commit `b85cb643f`。
- 教訓（本スキル視点）: `.gitattributes` の `merge=union` は `.claude/skills/**` をパス glob で横断登録するため、本スキルの `references/patterns-lessons-and-pitfalls.md` も dev 側で追記があれば union member として衝突する（SP-DEVSYNC-085 と同型・本件で再現）。union member は aiworkflow 配下に閉じないので「aiworkflow の index だけ」と決め打たず、`git diff --name-only --diff-filter=U` で本スキル配下ファイルが含まれるか毎回実確認する。いずれも resolver が union で畳むため手解消は不要。
- 検証順: `pnpm sync:resolve` → `git diff --diff-filter=U` 0 → `git add -A && git commit --no-edit`（lefthook 全 pass）→ `pnpm install --frozen-lockfile`（exit 0）→ `pnpm typecheck`（全 package Done）→ `pnpm lint`（exit 0）→ `pnpm indexes:rebuild` drift 0（5393 キーワード）で all green。CI failure なし。
- `=` 罫線 false-positive: 残存判定の正本は `git diff --name-only --diff-filter=U` = 0。素朴 `git grep '^======='` は ut-08 `manual-smoke-log.md` の装飾区切り線を誤検出するため使わない（SP-DEVSYNC-085 と同条件・本回も再現）。
- 反映先: `lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-086 として事例追記。aiworkflow-requirements L-DEVSYNC-097 と相互参照。
