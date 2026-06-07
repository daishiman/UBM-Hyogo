# dev sync: union 1（topic-map.md 単独・他 index 全 Auto-merge・keywords `--ours` 非発火）を実測し union member 実測レンジ下端を 2→1 へ更新（2026-06-06 issue-1094 2nd pass）

- 日時: 2026-06-06（同ブランチ feat/issue-1094 への 2 回目 dev 取込）
- ブランチ: `feat/issue-1094-identity-conflicts-optimistic-aria-live-announcement` ← `dev`（sub-worktree wt-1・**1 behind / 4 ahead**・ローカル dev = origin/dev 一致で dev 同期は no-op・独自コミット 0）
- 関連: 同ブランチ 1st pass [[20260606-dev-sync-union4-issue1094-skillmd-automerge]]（5 コミット union 4・SKILL.md Auto-merge）/ [[20260605-dev-sync-union2-second-pass-shrink]]（従来下端 union 2）/ `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107**
- 取込: dev 新規 1 コミット = `8f7d4faca`（#1147 staging API loopback 404 と session 取得失敗を service-binding 統一で解消・3 lane）
- 事象: content CONFLICT は **1 file のみ（union）**:
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - **他の skill 共有ファイルは全て Auto-merging**: `indexes/keywords.json` / `indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` / 両 `SKILL-changelog.md`（衝突なし＝今回 keywords の `--ours` は **非発火**）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 1 files`（topic-map.md のみ）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0。
- **核心データポイント（L-DEVSYNC-098 のレンジ更新）**: L-DEVSYNC-098 で「union 2 を実測し下端をレンジ 2〜6 に更新」と記録していたが、本 pass は **取込 1 コミット（#1147）で topic-map.md 単独 union 1** を実測。これにより union member 実測レンジ下端を **2 → 1** に更新。1st pass（同日・5 コミット union 4）と 2nd pass（1 コミット union 1）の対比は「union member = 取込デルタが実 touch する skill ファイル集合」確定則を同一ブランチ内で再々補強。**keywords の `--ours` 発火有無・topic-map 以外の index 衝突有無は取込デルタ内容に独立連動**し、本件は topic-map のみが両側で同一行を競合させた（他 index は 3-way base 保持で Auto-merge 成立）。union 件数は最小 1 まで縮退しうる → 件数を予測子にせず `union-resolving N files` の N を毎回ログ実確認。
- 検証順: `git fetch --prune origin`（dev = origin/dev 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --left-right --count HEAD...origin/dev` = 4/1 → `git log HEAD..dev` = #1147 単一 → `git merge dev --no-edit` CONFLICT 1（topic-map）→ `pnpm sync:resolve`（`union-resolving 1 files` + rebuild・`--ours` 行 0）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `45b567896`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ #1147 が `apps/web` コード変更を含むため `pnpm install` → `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0）。CI コード修正なしで全緑。
- 反映先: 本 changelog（レンジ下端 1 更新）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-098/107 の確定データとして記録。
