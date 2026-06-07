# dev sync: 同一ブランチ 3 回目・behind 1 の #1151 取込で union が 4 へ縮退（SKILL.md が今回は Auto-merge）— member は取込デルタ依存で SKILL.md の衝突可否すら delta 依存（2026-06-07 issue-1103 3rd pass）

- 日時: 2026-06-07（同一ブランチ 3 回目の dev 取込）
- ブランチ: `docs/issue-1103-globals-css-shell-block-consolidation-spec` ← `dev`（sub-worktree wt-15・**6 ahead / 1 behind**、ローカル dev = origin/dev 一致で dev 同期は no-op・独自コミット 0）
- 関連: [[20260607-dev-sync-issue1103-2ndpass-behind1-union5-stable]]（2 回目・union 5）/ [[20260607-dev-sync-issue1103-behind6-catchup-union5-hono-bump]]（1 回目・union 5）/ lessons SP-DEVSYNC-106 / aiworkflow L-DEVSYNC-114
- 事象: 取込 1 コミット = #1151（issue-1094 identity-conflicts の optimistic 消失アナウンスを単一 aria-live region 化）。content CONFLICT は `aiworkflow-requirements` 配下 5 file（indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md} + references/task-workflow-active.md）＝**union 4 + keywords `--ours`**。**今回は SKILL.md が Auto-merge 側**（前 2 回は union 5 で SKILL.md も衝突）。`task-specification-creator` 配下は全 auto-merge（衝突 0）。
- 解消: `pnpm sync:resolve` exit 0（`union-resolving 4 files` + `taking --ours`(keywords.json) + 内部 rebuild + `all skill / index conflicts resolved`）。
- 核心データポイント:
  - **同一ブランチ連続 sync でも union member は 5↔4 変動**: 1/2 回目 union 5（SKILL.md 含む）→ 3 回目 union 4（SKILL.md Auto-merge）。#1151 が SKILL.md に additive 行を残さなかったため衝突対象外。member 集合は取込コミットが touch する skill ファイルで決まり、SKILL.md を含むかも固定でない。`union-resolving N files` の N をログ実数で確認。
  - **#1151 は apps UI 系だが docs-only feature 非接触ゆえ apps 衝突 0**: IdentityConflict aria-live の apps コードを運んだが本 feature（globals.css + skill のみ）は当該 apps path 非接触で全 auto-merge。
- 検証: `git log HEAD..dev` = #1151 単一 → `git merge dev --no-edit` CONFLICT 5 → `pnpm sync:resolve` exit 0 → `--diff-filter=U` 0 / 実マーカー 0 → merge commit `7ae3d599b` → `pnpm install`（no-op）→ `pnpm typecheck` 0 / `pnpm lint` 0 / `pnpm indexes:rebuild` 冪等 drift 0。CI failure なし。
- 反映先: 本 changelog + lessons SP-DEVSYNC-106 + aiworkflow L-DEVSYNC-114。
