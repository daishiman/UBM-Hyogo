# dev sync 3rd pass: 1 コミット取込（behind 1・#1169）で union 1 + keywords `--ours`・**CI fail なし・routine conflict のみ**（2026-06-09 issue-1137・通算 3 回目）

- 日時: 2026-06-09（`feat/issue-1137-bulk-tag-production-runtime-smoke-spec` への dev 取込・通算 3 回目）
- ブランチ: `feat/issue-1137-bulk-tag-production-runtime-smoke-spec` ← `origin/dev`（sub-worktree wt-6・**1 behind / 6 ahead**・前回 merge `b506c90c0` 後に #1169 が 1 件 land・ローカル dev = origin/dev 0/0）
- 起点: ユーザー指示「CI が失敗していたら CI を改善・コンフリクトが発生していたら解消」。**今回は CI fail 0（PR #1171 全 pass）・conflict のみ発生** → conflict のみ解消。
- 関連: 1 回目 [[20260609-dev-sync-issue1137-behind9-union1-topicmap-only-keywords-ours]] / 2 回目（CI 修正含む）[[20260609-dev-sync-issue1137-2ndpass-behind1-union1-keywords-ours-ci-workflow-shell-lint-fix]]
- 取込: dev 新規 1 コミット = `963e7e914`（#1169 単一 tag write の audit payload に batchId 相関キーを付与・issue-1129）
- 事象: content CONFLICT は **2 file**＝`indexes/topic-map.md`（union・**union 1**）+ `indexes/keywords.json`（`--ours`）。`quick-reference` / `resource-map` / `task-workflow-active` / 両 `SKILL-changelog` は Auto-merge、`task-specification-creator/` 配下は衝突 0。1〜2 回目と同一プロファイル（feature = CI/infra 層で skill core 非 touch → union は topic-map 単独・#1169 の keyword delta が両側 rebuild 行衝突規模ゆえ keywords `--ours`）。
- 解消: `pnpm sync:resolve` 1 回（`union-resolving 1 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → merge `302e79651`（lefthook 全 pass・MERGE_HEAD で staged-task-dir-guard auto-skip）。
- 反映先: 本 changelog（新規教訓なし＝同一 feature プロファイルでの routine sync-merge 3 連の収束確認データ点。新規 lesson 番号は SSOT インフレ回避で起こさない）+ 両 SKILL-changelog.md 1 行。task-specification-creator [[dev-sync-merge-conflict-resolution]] と対。
