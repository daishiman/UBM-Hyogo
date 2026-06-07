# dev sync: 同一ブランチ 4th pass で 3rd pass と完全同一の union 4 + keywords `--ours`・SKILL.md Auto-merge 構成が再現（取込 1 コミット #1150）・振動則の安定再現を確認（2026-06-07 issue-1094 4th pass）

- 日時: 2026-06-07（同ブランチ feat/issue-1094 への 4 回目 dev 取込）
- ブランチ: `feat/issue-1094-identity-conflicts-optimistic-aria-live-announcement` ← `dev`（sub-worktree wt-1・**1 behind / 8 ahead**・ローカル dev = origin/dev 一致で dev 同期は no-op・独自コミット 0）
- 関連: 同ブランチ 1st [[20260606-dev-sync-union4-issue1094-skillmd-automerge]] / 2nd [[20260606-dev-sync-union1-issue1094-topic-map-only]] / 3rd [[20260607-dev-sync-union4-issue1094-3rd-pass-keywords-ours]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107**
- 取込: dev 新規 1 コミット = `7922d38bf`（#1150 全件 backfill 確定前の実 response 件数プレビュー追加・issue-1089・admin）
- 事象: content CONFLICT は **4 file（union）+ keywords（`--ours`）** で 3rd pass と完全同一構成:
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `indexes/keywords.json`（`--ours` 発火・1 derived file）
  - **`SKILL.md` は Auto-merging で非衝突**（両 `SKILL-changelog.md` も Auto-merging）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 4 files` + `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0。
- **核心データポイント（振動則の安定再現確認）**: 3rd pass（#1149 durationMs 行追加）と 4th pass（#1150 backfill preview 追加）はいずれも取込 1 コミットで **完全同一の union 4 + keywords `--ours` + SKILL.md Auto-merge** を再現。両 admin feature コミットが「task-workflow-active 更新 + index map 3 への波及（quick-reference/resource-map/topic-map）」を生むが SKILL.md 本文は触れない、という典型 admin feature 取込パターンの安定再現。2nd pass（topic-map 単独 union 1）との差は取込デルタが task-workflow-active と他 2 map に及ぶか否か。確定則「union member = 取込デルタが実 touch する skill ファイル集合」は同一ブランチ 4 連続 pass（union 4→1→4→4）で揺るがず、resolver は member 集合非依存に単一パス収束。
- 検証順: `git fetch --prune origin`（dev = origin/dev 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --left-right --count HEAD...origin/dev` = 8/1 → `git log HEAD..dev` = #1150 単一 → `git merge dev --no-edit` CONFLICT 4 union + keywords → `pnpm sync:resolve`（`union-resolving 4 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `e7de6ea17`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ #1150 が `apps/web`/`apps/api` コード変更を含むため `pnpm install` → `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0）。CI コード修正なしで全緑。
- 反映先: 本 changelog（同構成の安定再現）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-098/107 の確定データとして記録。
