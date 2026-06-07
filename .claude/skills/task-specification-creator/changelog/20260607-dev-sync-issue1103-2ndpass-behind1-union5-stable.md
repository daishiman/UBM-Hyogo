# dev sync: 同一ブランチ 2 回目・behind 1 の単一コミット #1150 でも union 5 維持（member 集合 = 取込デルタの touch 集合・behind 件数非依存）を再確認（2026-06-07 issue-1103 2nd pass）

- 日時: 2026-06-07（同一ブランチ 2 回目の dev 取込）
- ブランチ: `docs/issue-1103-globals-css-shell-block-consolidation-spec` ← `dev`（sub-worktree wt-15・**4 ahead / 1 behind**、ローカル dev = origin/dev 一致で dev 同期は no-op・独自コミット 0）
- 関連: [[20260607-dev-sync-issue1103-behind6-catchup-union5-hono-bump]]（同一ブランチ 1 回目・6-behind）/ lessons SP-DEVSYNC-105 / aiworkflow L-DEVSYNC-113
- 事象: 取込 1 コミット = #1150（issue-1089 全件 backfill 確定前の実 response 件数プレビュー）。content CONFLICT は `aiworkflow-requirements` 配下 6 file（SKILL.md + indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md} + references/task-workflow-active.md）＝前回 6-behind 1 回目と完全同一の **union 5 + keywords `--ours`**。`task-specification-creator` 配下は全 auto-merge（衝突 0）。
- 解消: `pnpm sync:resolve` exit 0（`union-resolving 5 files` + `taking --ours`(keywords.json) + 内部 rebuild + `all skill / index conflicts resolved`）。
- 核心データポイント:
  - **behind 件数は union member を変えない**: 1 回目 6 commit / 2 回目 1 commit で同一 union 5。member 集合は #1150 が touch する skill core（SKILL.md + 3 map + task-workflow-active + keywords）で決まり behind 件数非依存。`union-resolving N files` の N をログ実数で確認し前回値・behind 数で予測しない。
  - **#1150 は apps sync 系だが docs-only feature 非接触ゆえ apps 衝突 0**: backfill preview の apps コードを運んだが本 feature（globals.css + skill のみ）は当該 apps path 非接触で全 auto-merge。
- 検証: `git log HEAD..dev` = #1150 単一 → `git merge dev --no-edit` CONFLICT 6 → `pnpm sync:resolve` exit 0 → `--diff-filter=U` 0 / 実マーカー 0 → merge commit `8d012e3f9` → `pnpm install`（no-op）→ `pnpm typecheck` 0 / `pnpm lint` 0 / `pnpm indexes:rebuild` 冪等 drift 0。CI failure なし。
- 反映先: 本 changelog + lessons SP-DEVSYNC-105 + aiworkflow L-DEVSYNC-113。
