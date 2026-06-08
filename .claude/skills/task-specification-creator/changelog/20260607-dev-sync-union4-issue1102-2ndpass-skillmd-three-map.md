# dev sync: issue-1102 ブランチ 2 回目 dev 取込（#1153 issue-1103 close-out）で union 4＝aiworkflow SKILL.md + 3 index map + keywords.json `--ours`・本スキル配下衝突 0 の再確認（2026-06-07）

- 日時: 2026-06-07（同ブランチ `docs/issue-1102-...-spec` への 2 回目 dev 取込）
- ブランチ: `docs/issue-1102-usedismissable-hook-extraction-spec` ← `dev`（sub-worktree wt-5・**1 behind / 5 ahead**・ローカル dev = origin/dev `d34ce8131` 一致で dev 同期は no-op・独自コミット 0）
- 関連: 同ブランチ 1 回目 [[20260607-dev-sync-union3-issue1102-three-map-keywords-ours]] / `lessons-learned/dev-sync-merge-conflict-resolution.md` **SP-DEVSYNC-088**（行領域非重複なら本スキル配下 0）。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-097-A が正本。
- 取込: dev 新規 1 コミット = `d34ce8131`（#1153 globals.css の重複 shell ブロックを 1 本化・issue-1103・web refactor）
- 事象: content CONFLICT は **aiworkflow-requirements 配下のみ**＝`SKILL.md` + `indexes/{quick-reference.md, resource-map.md, topic-map.md}`（union 4）+ `indexes/keywords.json`（`--ours`）。**`task-specification-creator/**` 配下は SKILL.md / SKILL-changelog / changelog / references / lessons-learned 含め衝突 0（全 Auto-merging・lessons は union-merge）**＝SP-DEVSYNC-088 の再現。1 回目（#1151）の union 3 から件数・member ともに入替（aiworkflow 側 SKILL.md が衝突側へ加入）したが本スキル配下は両 pass とも 0。
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 4 files` + `taking --ours for 1 derived files`（keywords.json）+ rebuild、`git diff --diff-filter=U` 0 / 実マーカー 0。
- 核心: 取込 #1153 は issue-1103 close-out で task-specification-creator/SKILL.md を行領域レベルで触らず、本スキル配下は完全 auto-merge。本スキル配下衝突有無は `--diff-filter=U` 実集合で判定し「必ず衝突する/しない」を一般則化しない（SP-DEVSYNC-091-1）。
- 検証: `git fetch --prune origin`（dev=origin/dev 一致・独自 0）→ `git rev-list --left-right --count origin/dev...HEAD` = 1/5 → `git merge dev --no-edit` CONFLICT 5（SKILL.md + 3 map + keywords）→ `pnpm sync:resolve` exit 0（`union-resolving 4 files` + `--ours` 1 + rebuild）→ `--diff-filter=U` 0 → merge commit `6efa9d7a3` → `pnpm typecheck` / `pnpm lint` / `pnpm indexes:rebuild` 冪等（5477 kw・drift 0）。CI コード修正なしで全緑。
- 反映先: 本 changelog + 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避で起こさず SP-DEVSYNC-088 の確定データとして記録。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-097-A が正本。
