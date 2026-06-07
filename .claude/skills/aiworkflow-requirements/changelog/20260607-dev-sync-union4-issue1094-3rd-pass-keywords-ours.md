# dev sync: 取込 1 コミット（#1149）でも union 4（map 3 + task-workflow-active・SKILL.md は Auto-merge）+ keywords `--ours` 発火・同一ブランチ 3rd pass で union member は取込デルタ内容に依存し件数 1〜5 を振動する確定則を再々々補強（2026-06-07 issue-1094 3rd pass）

- 日時: 2026-06-07（同ブランチ feat/issue-1094 への 3 回目 dev 取込）
- ブランチ: `feat/issue-1094-identity-conflicts-optimistic-aria-live-announcement` ← `dev`（sub-worktree wt-1・**1 behind / 6 ahead**・ローカル dev = origin/dev 一致で dev 同期は no-op・独自コミット 0）
- 関連: 同ブランチ 1st pass [[20260606-dev-sync-union4-issue1094-skillmd-automerge]]（5 コミット union 4・SKILL.md Auto-merge）/ 2nd pass [[20260606-dev-sync-union1-issue1094-topic-map-only]]（1 コミット union 1・下端更新）/ `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107**
- 取込: dev 新規 1 コミット = `8298bcd7e`（#1149 手動フォームリシンク結果に durationMs（取込所要時間）行を追加・admin）
- 事象: content CONFLICT は **4 file（union）+ keywords（`--ours`）**:
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `indexes/keywords.json`（`--ours` 発火・1 derived file）
  - **`SKILL.md` は Auto-merging で非衝突**（両 `SKILL-changelog.md` も Auto-merging）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 4 files` + `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0。
- **核心データポイント（同一ブランチ 3 連続 pass での振動則確定）**: feat/issue-1094 への 3 連続 dev 取込で union member 数が **4（1st・5 コミット）→ 1（2nd・1 コミット）→ 4（3rd・1 コミット）** と振動。特に 2nd（1 コミット union 1）と 3rd（1 コミット union 4）は**同じ取込コミット数 1 でも union member 数が 1 と 4 で異なる**ことを実測し、「union member 数 = 取込コミット数」説を改めて棄却。union member は**取込デルタが実際に同一行を競合させる skill ファイル集合**で決まり、#1149（durationMs 行追加）は map 3 + task-workflow-active を両側競合させたが SKILL.md は 3-way base 保持で Auto-merge 成立。**keywords `--ours` 発火・SKILL.md 衝突有無・各 index の衝突有無は取込デルタ内容に独立連動** → 件数・member を取込量や前回比で固定せず必ず `union-resolving N files` の N をログ実確認。
- 検証順: `git fetch --prune origin`（dev = origin/dev 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --left-right --count HEAD...origin/dev` = 6/1 → `git log HEAD..dev` = #1149 単一 → `git merge dev --no-edit` CONFLICT 4 union + keywords → `pnpm sync:resolve`（`union-resolving 4 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `1f9850327`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ #1149 が `apps/web`/`apps/api` コード変更を含むため `pnpm install`（Done 1m49s）→ `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0）。CI コード修正なしで全緑。
- 反映先: 本 changelog（振動則の同一ブランチ 3 連続実測）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-098/107 の確定データとして記録。
