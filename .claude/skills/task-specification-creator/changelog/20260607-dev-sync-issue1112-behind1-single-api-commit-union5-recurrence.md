# dev sync: behind 1（単一 API コミット #1105 取込）でも close-out 同梱で CONFLICT は union 5 + keywords --ours に再収束・`pnpm sync:resolve` 1 回で完遂（2026-06-07 issue-1112 ブランチ・2nd pass）

- 日時: 2026-06-07（`docs/issue-1112-attendance-count-badge-emphasis-spec` への dev 取込・同ブランチ 2 回目の sync）
- ブランチ: `docs/issue-1112-attendance-count-badge-emphasis-spec` ← `dev`（sub-worktree wt-9・**1 behind / 3 ahead**、ローカル dev = origin/dev 一致（`a7fdfb5fc`）で dev 同期は no-op・独自コミット 0）
- 関連: [[20260607-dev-sync-issue1112-behind8-union5-keywords-ours]]（同ブランチ 1st pass・behind 8 でも union 5）/ [[20260606-dev-sync-union5-issue1140-behind1-confirms-delta-dependence]]（union member = 取込デルタ依存・behind 非依存）/ `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/101**
- 事象: 取込んだ dev 新規コミットは **1 件のみ**（`a7fdfb5fc` = #1105 member_status.member_id FK 制約導入 / #1154）。しかしこの単一コミットが **issue-1105 の close-out 一式（`.claude/skills/*/changelog/2026...issue-1105`・両 SKILL.md 規約行・索引・`task-workflow-active`・`completed-tasks/issue-1105/**`）を同梱**するため、content CONFLICT は **5 file（いずれも skill core・union）+ keywords.json（`--ours`）** に収束:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `keywords.json` は derived のため `--ours` 採用 → 内部 `pnpm indexes:rebuild` で再生成
  - （`SKILL-changelog.md` / `LOGS.md` / `phase-template-phase1.md` は `.gitattributes` `merge=union` で git auto-merge 成立＝resolver 介入なし。`apps/api/migrations/**`・各 `*.contract.spec.ts`・seed は Auto-merging で非衝突）
- 解消: `pnpm sync:resolve` 1 回で **`union-resolving 5 files`** + `ours: keywords.json` + 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved` exit 0。残 `git diff --diff-filter=U` 0 / 実マーカー（`<<<<<<<` / `>>>>>>>`）grep 0（`ut-08-monitoring-alert-design/.../manual-smoke-log.md` の `=======` 罫線は誤検出として除外確認済み）。
- **データポイント（L-DEVSYNC-097/101 の追補・確定則の再々確認）**: 1st pass（behind 8）も本 2nd pass（behind 1・単一 API コミット）も CONFLICT 集合は同じ union 5 + keywords --ours。**取込コミット件数（8→1）にも取込コミットの主目的（admin/web 横断 → API FK 単発）にも依存せず、「取込デルタが skill core を touch するか」のみで CONFLICT 集合が決まる**ことを再確認。#1105 は API FK が主眼でも close-out が skill core を上書きするため union が現れた。`apps/api/migrations/**` や `*.contract.spec.ts` のソース変更は skill core に触れないため CONFLICT を増やさない。
- 検証順: `git fetch --prune origin`（dev=origin/dev `a7fdfb5fc` 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --left-right --count origin/dev...HEAD` = 1/3 → `git log HEAD..dev` = `a7fdfb5fc` 1 件 → `git merge dev --no-edit` CONFLICT 5 union + keywords → `pnpm sync:resolve`（`union-resolving 5 files` + keywords ours + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` → merge commit → push。CI failure は本マージ起因なし（コード修正 0）。
- 反映先: 本 changelog（behind 1・単一 API コミット close-out 同梱でも union 5 収束の追補データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-097/101 の確定データとして記録。
