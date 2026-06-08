# dev sync: issue-1102 ブランチへ #1151（issue-1094 close-out）を取込み union 3＝3 index map + keywords.json `--ours` で解消＝SP-DEVSYNC-076 定番パターンの安定再現（2026-06-07）

- 日時: 2026-06-07
- ブランチ: `docs/issue-1102-usedismissable-hook-extraction-spec` ← `dev`（sub-worktree wt-5・**1 behind / 3 ahead**・ローカル dev = origin/dev `8ed2e222d` 一致で dev 同期は no-op・独自コミット 0）
- 関連: `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` **SP-DEVSYNC-076 系**（union 3＝3 map + keywords `--ours` の正本パターン）。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-076 が正本。
- 取込: dev 新規 1 コミット = `8ed2e222d`（#1151 identity-conflicts の optimistic 消失アナウンスを単一 aria-live region 化・issue-1094・admin）
- 事象: content CONFLICT は **aiworkflow-requirements 配下のみ**＝`indexes/{quick-reference.md, resource-map.md, topic-map.md}`（union 3）+ `indexes/keywords.json`（`--ours`）。**`task-specification-creator/**` 配下は SKILL.md / SKILL-changelog / changelog / references 含め衝突 0（全 Auto-merging）**。本スキル横断衝突なし＝SP-DEVSYNC-088「行領域非重複なら本スキル配下 0」の再現。
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 3 files` + `taking --ours for 1 derived files`（keywords.json）+ rebuild、`git diff --diff-filter=U` 0 / 実マーカー 0。
- 核心: 取込 #1151 は issue-1094 close-out で task-specification-creator/SKILL.md を行領域レベルで触らず、本スキル配下は完全 auto-merge。SP-DEVSYNC-091「2 スキル横断 SKILL.md 同時衝突」の逆＝衝突が aiworkflow 側 index map に閉じる回。本スキル配下衝突有無は `--diff-filter=U` 実集合で判定し「必ず衝突する/しない」を一般則化しない（SP-DEVSYNC-091-1）。
- 検証: `git fetch --prune origin`（dev=origin/dev 一致・独自 0）→ `git rev-list --left-right --count origin/dev...HEAD` = 1/3 → `git merge dev --no-edit` CONFLICT 4（3 map + keywords）→ `pnpm sync:resolve` exit 0（`union-resolving 3 files` + `--ours` 1 + rebuild）→ `--diff-filter=U` 0 → merge commit `2751ecb0f` → `pnpm typecheck` 7 packages exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（5476 kw・drift 0）。CI コード修正なしで全緑。
- 反映先: 本 changelog + 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず SP-DEVSYNC-076/088 の確定データとして記録。aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-076 が正本。
