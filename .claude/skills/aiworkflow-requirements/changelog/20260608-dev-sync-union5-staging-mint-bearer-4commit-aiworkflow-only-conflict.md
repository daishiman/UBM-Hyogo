# dev sync: 4 コミット取込で union 5 file（**aiworkflow 側のみ衝突・task-spec SKILL.md は非衝突**）+ `pnpm sync:resolve` 1 パス収束・CI コード修正 0 で全緑（2026-06-08 staging-mint-bearer-env-contract-guard）

- 日時: 2026-06-08（`docs/staging-mint-bearer-env-contract-guard-spec` への dev 取込）
- ブランチ: `docs/staging-mint-bearer-env-contract-guard-spec` ← `dev`（sub-worktree wt-7・**4 behind / 2 ahead**・ローカル dev は origin/dev に 4 behind → メイン WT で `git merge --ff-only origin/dev` 同期・独自コミット 0）
- 関連: 同型先行例 [[20260607-dev-sync-union6-issue1105-skillmd-content-conflict]] / [[20260607-dev-sync-union5-issue1105-2nd-pass-issue1103-intake]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107**
- 取込: dev 新規 4 コミット = `f902a8e05`(#1155 admin/meetings 出席人数バッジ 3 段階色強調 issue-1112) / `0a70a8dd6`(#1160 useDismissable hook 抽出・SidebarUserMenu / DensityToggle 挙動不変移行 issue-1102) / `a7fdfb5fc`(#1154 member_status.member_id FK 制約導入で orphan を DB レベル構造禁止 #1105) / `c53a275df`(#1152 出席分析の zone 境界・延べ/unique 指標是正 issue-1101)
- 事象: content CONFLICT は **5 file（全 union）**。今回は **aiworkflow 側のみ衝突し、task-spec SKILL.md は Auto-merge で非衝突**:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union・本文衝突）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `indexes/keywords.json` は Auto-merging で非衝突（`--ours` 発火せず）/ `SKILL-changelog.md`（両スキル）も Auto-merging
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 5 files` + 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0（`ut-08-monitoring-alert-design/.../manual-smoke-log.md` の `===` 60 文字罫線は誤検出として除外確認済み・確立済みパターン）。
- **核心データポイント（取込デルタ規模 → union member 拡張則の再確認）**: 確定則「**union member = 取込デルタが実 touch する skill ファイル集合**」は本回も成立。本回 4 コミットは admin/web/api コード中心で **aiworkflow SKILL.md の変更履歴 table のみ touch**、task-spec SKILL.md（最新 3 件規約行）は touch せず → union member が aiworkflow 5 file に限定（task-spec SKILL.md 非衝突）。resolver は member 集合の大小・偏りに非依存で単一パス収束。
- 検証順: `git fetch --prune origin`（local dev vs origin/dev = 4 behind → メイン WT `git merge --ff-only origin/dev` で同期・dev = origin/dev 一致確認・独自 0）→ `git rev-list --left-right --count` で 4 behind / 2 ahead → `git merge dev --no-edit` CONFLICT 5 union → `pnpm sync:resolve`（`union-resolving 5 files` + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `6eedc0900`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ #1152/#1154/#1160/#1155 が `apps/web`/`apps/api` コード変更を含むため `pnpm install --force` → `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0・5484 キーワード）。CI コード修正なしで全緑。
- 反映先: 本 changelog（union 5 / aiworkflow 単独衝突の新データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-098/107 の確定データ（デルタ規模・偏り → member 拡張/限定）として記録。
