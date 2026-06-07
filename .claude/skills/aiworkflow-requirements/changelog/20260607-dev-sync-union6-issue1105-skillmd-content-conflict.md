# dev sync: 8 コミット取込で union 6 file（**両 SKILL.md 本文 content conflict 含む**）+ keywords `--ours` 構成・取込デルタ大型化で union member が SKILL.md 本文まで拡張することを確認（2026-06-07 issue-1105）

- 日時: 2026-06-07（`docs/issue-1105-member-status-fk-constraint-spec` への dev 取込）
- ブランチ: `docs/issue-1105-member-status-fk-constraint-spec` ← `dev`（sub-worktree wt-6・**8 behind / 2 ahead**・ローカル dev = origin/dev 一致で dev 同期は no-op・独自コミット 0）
- 関連: 同型先行例 [[20260607-dev-sync-union4-issue1094-4th-pass-recurrence]] / [[20260607-dev-sync-union4-issue1094-3rd-pass-keywords-ours]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107**
- 取込: dev 新規 8 コミット = `8ed2e222d`(#1151 identity-conflicts aria-live 単一 region 化 issue-1094) / `7922d38bf`(#1150 backfill 件数プレビュー issue-1089) / `8298bcd7e`(#1149 manual resync durationMs 行) / `8f7d4faca`(#1147 staging API loopback 404 / session service-binding 統一) / `4769767c6`(#1148 test-accounts seed) / `e679722f5`(#1144 bulk tag real D1 runtime smoke + CI gate + skill 同期) / `314fd0a4a`(#1143 hono bump) / `38da7c254`(#1140 collapsed sidebar tooltip + footer/header sticky)
- 事象: content CONFLICT は **6 file（union）+ keywords（`--ours`）**。先行 issue-1094 の「union 4 + SKILL.md Auto-merge」と異なり、**両 SKILL.md 本文が content conflict** した:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（**union・本文衝突**）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `.claude/skills/task-specification-creator/SKILL.md`（**union・本文衝突**）
  - `indexes/keywords.json`（`--ours` 発火・1 derived file）
  - `SKILL-changelog.md`（両スキルとも Auto-merging で非衝突）/ `phase-template-phase1.md`・`LOGS.md` も Auto-merging
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 6 files` + `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0（ut-08 smoke-log の `===` 60 文字罫線は誤検出として除外確認済み）。
- **核心データポイント（取込デルタ規模 → union member 拡張則）**: issue-1094 の 1 コミット取込（admin feature 単発）は union 4 + SKILL.md Auto-merge に収まったが、本回の **8 コミット取込（#1140〜#1151 の admin/web/api/skill 横断）は両 SKILL.md 本文の最新 3 件規約行・変更履歴 table まで touch するため union member が SKILL.md 本文まで拡張**。確定則「**union member = 取込デルタが実 touch する skill ファイル集合**」は本回も成立し、デルタが大型化すると SKILL.md 本文（aiworkflow の変更履歴 table / task-spec の最新 3 件規約）も member に入る。resolver は member 集合の大小（4→6）に非依存で単一パス収束。
- 検証順: `git fetch --prune origin`（dev = origin/dev 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --count` で 8 behind / 2 ahead → `git merge dev --no-edit` CONFLICT 6 union + keywords → `pnpm sync:resolve`（`union-resolving 6 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `3432e2729`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ #1140/#1147/#1148/#1149/#1150/#1151 が `apps/web`/`apps/api` コード変更を含むため `pnpm install` → `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0）。CI コード修正なしで全緑。
- 反映先: 本 changelog（union 6 / SKILL.md 本文衝突の新データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-098/107 の確定データ（デルタ規模 → member 拡張）として記録。
