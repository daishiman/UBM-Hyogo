# dev sync: behind 8（8 PR まとめ取込）でも CONFLICT は skill core の union 5 + keywords --ours に収束・`pnpm sync:resolve` 1 回で完遂（2026-06-07 issue-1112 ブランチ）

- 日時: 2026-06-07
- ブランチ: `docs/issue-1112-attendance-count-badge-emphasis-spec` ← `dev`（sub-worktree wt-9・**8 behind / 2 ahead**、ローカル dev = origin/dev 一致（`c53a275df`）で dev 同期は no-op・独自コミット 0）
- 関連: [[20260606-dev-sync-union5-issue1140-behind1-confirms-delta-dependence]]（union member = 取込デルタ依存・behind 非依存の確定）/ [[20260607-dev-sync-union4-issue1094-4th-pass-recurrence]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/101**
- 事象: 取込んだ dev 新規コミットは **8 件**（#1152 issue-1101 出席分析是正 / #1156 transport util 集約 / #1153 issue-1103 globals.css shell 1本化 / #1151 issue-1094 aria-live region / #1150 issue-1089 backfill preview / #1149 durationMs 行 / #1147 staging service-binding 統一 / #1148 test-accounts seed）。content CONFLICT は **5 file（いずれも skill core）**:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `keywords.json` は derived のため `--ours` 採用 → 内部 `pnpm indexes:rebuild` で再生成（5481 keywords・md5=ec5611f3）
  - （`SKILL-changelog.md` / `LOGS/_legacy.md` は `.gitattributes` `merge=union` で git auto-merge 成立＝今回 resolver 介入なし。`apps/web/src/styles/globals.css` も auto-merge 成立）
- 解消: `pnpm sync:resolve` 1 回で **`union-resolving 5 files`** + `ours: keywords.json` + 内部 `pnpm indexes:rebuild` を完遂。`all skill / index conflicts resolved` exit 0。残 `--diff-filter=U` 0 / 実マーカー 0。
- **データポイント（L-DEVSYNC-097/101 の追補）**: behind 8（8 PR まとめ取込）の大量デルタにもかかわらず CONFLICT 集合は behind 1 ケースと同じ union 5 + keywords --ours に収束。union member の数は取込 PR 件数ではなく「取込デルタが skill core（SKILL.md / 索引 3 / task-workflow-active）を touch するか」のみで決まることを再確認。8 PR のうち skill 同期を伴うもの（各 issue の close-out）が SKILL.md/索引/active を上書きした結果が union として現れ、apps/* のソース変更（transport util / globals.css / seed 等）は skill core に触れないため CONFLICT を増やさない。
- 検証順: `git fetch --prune origin`（dev=origin/dev `c53a275df` 一致・独自 0）→ `git rev-list --left-right --count HEAD...origin/dev` = 2/8 → `git log HEAD..dev` = 8 件 → `git merge dev --no-edit` CONFLICT 5 → `pnpm sync:resolve`（`union-resolving 5 files` + keywords ours + rebuild）→ `--diff-filter=U` 0 / 実マーカー 0 → merge commit → `pnpm typecheck` / `pnpm lint`。CI failure は本マージ起因なし。
- 反映先: 本 changelog（behind 数非依存則の追補データ）。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-097/101 の確定データとして記録。
