# dev sync: 同一ブランチ 3rd pass・1 コミット取込（#1156 issue-1111 transport util 集約）で union 4・**task-workflow-active も今回 Auto-merge**・連続 pass で union 6→5→4 と member 単調縮約を確認（2026-06-07 issue-1105 3rd pass）

- 日時: 2026-06-07（`docs/issue-1105-member-status-fk-constraint-spec` への 3 回目 dev 取込）
- ブランチ: `docs/issue-1105-member-status-fk-constraint-spec` ← `dev`（sub-worktree wt-6・**1 behind / 6 ahead**・ローカル dev = origin/dev 一致で dev 同期 no-op・独自コミット 0）
- 関連: 同ブランチ 1st [[20260607-dev-sync-union6-issue1105-skillmd-content-conflict]] / 2nd [[20260607-dev-sync-union5-issue1105-2nd-pass-issue1103-intake]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107**
- 取込: dev 新規 1 コミット = `ec22db916`（#1156 transport 選択 util を集約・issue-1111・web refactor）
- 事象: content CONFLICT は **4 file（union）+ keywords（`--ours`）**。2nd pass（union 5）からさらに **`references/task-workflow-active.md` も今回 Auto-merge**（非衝突）で member 離脱:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `indexes/keywords.json`（`--ours` 発火・1 derived file）
  - `SKILL-changelog.md` / `references/task-workflow-active.md`（aiworkflow 側 Auto-merge）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 4 files` + `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0。
- **核心データポイント（連続 pass の union 単調縮約 6→5→4）**: 同一ブランチで 1st（8 コミット横断→両 SKILL.md + task-workflow-active + index 3 map = union 6）→ 2nd（#1153 web refactor→task-spec SKILL.md 離脱で union 5）→ 3rd（#1156 web refactor→task-workflow-active も離脱で union 4）と、取込が web refactor 単発に収束するにつれ member が縮約。確定則「**union member = 取込デルタが実 touch する skill ファイル集合**」は揺るがず、union 4 のコア（aiworkflow SKILL.md + index 3 map）は L-DEVSYNC-098 の最小構成に収束。task-workflow-active は「タスク台帳に新行が載る回」のみ member 入りし、純 refactor 取込では離脱する。resolver は member 集合の大小（6/5/4）に非依存で単一パス収束。
- 検証順: `git fetch --prune origin`（dev = origin/dev 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --count` で 1 behind / 6 ahead → `git log HEAD..dev` = #1156 単一 → `git merge dev --no-edit` CONFLICT 4 union + keywords → `pnpm sync:resolve`（`union-resolving 4 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `19bf823cd`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ #1156 が `apps/web`（transport util）変更を含むため `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0）。依存変更なしのため install 不要。CI コード修正なしで全緑。
- 反映先: 本 changelog（連続 pass union 単調縮約 6→5→4・task-workflow-active auto-merge データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-098/107 の確定データとして記録。
