# dev sync: behind 8（8 PR まとめ取込）でも CONFLICT は skill core の union 5 + keywords --ours に収束（2026-06-07 issue-1112 ブランチ）

- 日時: 2026-06-07
- ブランチ: `docs/issue-1112-attendance-count-badge-emphasis-spec` ← `dev`（sub-worktree wt-9・**8 behind / 2 ahead**、ローカル dev = origin/dev 一致（`c53a275df`）・独自コミット 0）
- 関連: [[20260607-dev-sync-issue1111-public-ts-transport-util-double-extraction]] / [[20260607-dev-sync-issue1103-behind6-catchup-union5-hono-bump]] / aiworkflow-requirements 側 `20260607-dev-sync-issue1112-behind8-union5-keywords-ours.md`
- 事象: 取込 dev コミット 8 件（#1152/#1156/#1153/#1151/#1150/#1149/#1147/#1148）。content CONFLICT は **5 file（全て aiworkflow-requirements の skill core）**: SKILL.md / indexes/quick-reference.md / indexes/resource-map.md / indexes/topic-map.md / references/task-workflow-active.md（いずれも union）+ `keywords.json`（derived → `--ours` + rebuild）。task-specification-creator 配下のファイルには本マージで CONFLICT なし（changelog 新規追加のみ auto-merge）。
- 解消: `pnpm sync:resolve` 1 回（`union-resolving 5 files` + `ours: keywords.json` + `pnpm indexes:rebuild`）で exit 0。残 unmerged 0 / 実マーカー 0。
- **教訓（task-spec 視点）**: dev sync の CONFLICT は構造的に aiworkflow-requirements の skill core に集中し、task-specification-creator 側は changelog の新規ファイル追加（衝突しない add）が中心。behind 数（今回 8）は union member 数を増やさず、union 集合は取込デルタが skill core を touch するかのみで決まる（behind 非依存則）。両 skill の changelog に同期記録を残すのが標準運用。
- 反映先: 本 changelog（cross-skill 記録の標準化）。
