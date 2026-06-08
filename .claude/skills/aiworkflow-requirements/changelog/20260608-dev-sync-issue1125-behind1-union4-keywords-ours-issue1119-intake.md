# dev sync 2nd pass: 1 コミット取込（#1161）で union 4 file + `keywords.json` --ours（**aiworkflow 側のみ衝突・task-spec SKILL.md は非衝突**）+ `pnpm sync:resolve` 1 パス収束・CI コード修正 0 で全緑（2026-06-08 issue-1125・同日 2 回目）

- 日時: 2026-06-08（`docs/issue-1125-bulk-tag-result-staging-mutation-visual-baseline-spec` への dev 取込・**同日 2 回目**）
- ブランチ: `docs/issue-1125-bulk-tag-result-staging-mutation-visual-baseline-spec` ← `dev`（sub-worktree wt-3・**1 behind / 4 ahead**・前回 sync 後に dev へ #1161 が 1 件 land・ローカル dev = origin/dev **0 behind/0 ahead** 独自 0 でメイン WT 同期不要）
- 関連: 同日 1 回目 [[20260608-dev-sync-issue1125-behind8-union4-keywords-ours]] / 同型先行 [[20260608-dev-sync-union5-staging-mint-bearer-4commit-aiworkflow-only-conflict]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/098/107**
- 取込: dev 新規 1 コミット = `21034f3b5`(#1161 member_tags 参照整合性ガード〔孤児検出〕を app 層で実装 issue-1119)
- 事象: content CONFLICT は **5 file**。前回（behind 8）と**同一の衝突 file 集合**:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union・本文衝突）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（**`--ours` 採用 → rebuild 再生成**）
  - `references/task-workflow-active.md` / `SKILL-changelog.md`（aiworkflow + task-spec 両方）/ `LOGS/_legacy.md` は Auto-merging で非衝突
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 4 files` + `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0。
- **核心データポイント（取込デルタ 1 commit → union member 拡張則の最強反例的再確認）**: 確定則「**union member = 取込デルタが実 touch する skill ファイル集合**・behind コミット数に非依存」を**同一ブランチ同日に behind 8 → behind 1 で連続検証**。behind 8（8 commit）と behind 1（1 commit）で衝突 file 集合・keywords.json の `--ours` 分岐が**完全一致** = member 集合は intake コミット数の大小に厳密に非依存（L-DEVSYNC-097-A 独立変数則 / 098/107 の確定データを同一ブランチ連続 2 回で実証）。#1161 が aiworkflow SKILL.md 変更履歴 table + index/reference を touch し task-spec curation 行を touch しないため task-spec SKILL.md は Auto-merge。
- 検証順: `git fetch --prune origin`（local dev vs origin/dev = 0/0 → メイン WT 同期不要）→ `git rev-list --count HEAD..origin/dev` で 1 behind → `git merge dev --no-edit` CONFLICT 5 → `pnpm sync:resolve`（`union-resolving 4 files` + `--ours` keywords.json + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git add -A && git commit --no-edit`（merge commit `d40da4b62`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ #1161 が `apps/api` コード変更を含むため `pnpm typecheck` exit 0（7 packages 全 Done）/ `pnpm lint` exit 0。CI コード修正なしで全緑。
- 反映先: 本 changelog（同一ブランチ同日 behind 8→1 連続検証の新データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避で起こさず L-DEVSYNC-097/098/107 の確定データ拡張として記録。
