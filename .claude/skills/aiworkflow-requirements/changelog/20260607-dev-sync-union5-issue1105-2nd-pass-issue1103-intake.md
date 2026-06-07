# dev sync: 同一ブランチ 2nd pass・1 コミット取込（#1153 issue-1103 globals.css 1 本化）で union 5・**task-spec SKILL.md は今回 Auto-merge**・前回 union 6 から member 縮約を確認（2026-06-07 issue-1105 2nd pass）

- 日時: 2026-06-07（`docs/issue-1105-member-status-fk-constraint-spec` への 2 回目 dev 取込）
- ブランチ: `docs/issue-1105-member-status-fk-constraint-spec` ← `dev`（sub-worktree wt-6・**1 behind / 4 ahead**・ローカル dev = origin/dev 一致で dev 同期 no-op・独自コミット 0）
- 関連: 同ブランチ 1st [[20260607-dev-sync-union6-issue1105-skillmd-content-conflict]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107**
- 取込: dev 新規 1 コミット = `d34ce8131`（#1153 globals.css の重複 shell ブロック 1 本化・issue-1103・web refactor）
- 事象: content CONFLICT は **5 file（union）+ keywords（`--ours`）**。前回 1st pass（8 コミット取込→union 6 + 両 SKILL.md 本文衝突）と異なり、**`task-specification-creator/SKILL.md` は今回 Auto-merge**（非衝突）で member から離脱:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `indexes/keywords.json`（`--ours` 発火・1 derived file）
  - `SKILL-changelog.md`（aiworkflow 側 Auto-merge）/ `LOGS.md` も Auto-merge
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 5 files` + `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0。
- **核心データポイント（member は取込内容依存・前回構成を当て込まない）**: 同一ブランチ 1st pass（8 コミット・admin/web/api/skill 横断）は両 SKILL.md 本文の最新 3 件規約 / 変更履歴 table まで touch して union 6 だったが、2nd pass（#1153 単一 web refactor）は aiworkflow 側の task-workflow-active + index 3 map + SKILL.md 変更履歴のみ touch し **task-spec SKILL.md には波及せず union 5**。確定則「**union member = 取込デルタが実 touch する skill ファイル集合**」は同一ブランチ連続 pass（union 6→5）でも揺るがず、resolver は member 集合の大小・内訳に非依存で単一パス収束。前回の「両 SKILL.md 衝突」を 2nd pass に当て込まず `git diff --name-only --diff-filter=U` 実集合で毎回判定することの実証。
- 検証順: `git fetch --prune origin`（dev = origin/dev 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --count` で 1 behind / 4 ahead → `git log HEAD..dev` = #1153 単一 → `git merge dev --no-edit` CONFLICT 5 union + keywords → `pnpm sync:resolve`（`union-resolving 5 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `d153335c6`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ #1153 が `apps/web`（globals.css）変更を含むため `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0）。依存変更なしのため install 不要。CI コード修正なしで全緑。
- 反映先: 本 changelog（同一ブランチ連続 pass の union 縮約 6→5・task-spec SKILL.md auto-merge データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-098/107 の確定データとして記録。
