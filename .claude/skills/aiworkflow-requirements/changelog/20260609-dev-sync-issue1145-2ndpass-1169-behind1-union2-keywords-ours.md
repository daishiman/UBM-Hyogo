# dev sync 2nd pass: issue-1145 ブランチへ追加 1 コミット（#1169）取込で **union 2（`resource-map` / `topic-map`）・`keywords.json` `--ours`**・`pnpm sync:resolve` 1 パス収束・CI 失敗 0（2026-06-09）

- 日時: 2026-06-09（`refactor/issue-1145-public-api-base-url-env-unification` への dev 再取込・初回 push 直後に origin/dev が進行したため）
- ブランチ: `refactor/issue-1145-public-api-base-url-env-unification` ← `origin/dev`（sub-worktree wt-5・**1 behind**・初回 sync-merge `51c84cf12` 後に origin/dev が `c4b48aa44`→`963e7e914` へ進行）2nd-pass sync-merge
- 起点: ユーザー追加指示「CI が失敗していたら改善・コンフリクトが発生していたら解消」。PR #1174 の mergeStateStatus が **DIRTY / CONFLICTING**（CI チェックは全 pass・"skipping" 2 件は条件付きスキップで失敗ではない）だったため origin/dev 再取込で base コンフリクトを解消。
- 関連: 同日初回 [[20260609-dev-sync-issue1145-behind8-ahead2-union3-keywords-ours-twa-skillmd-automerge]] / `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/098/107/117-B**
- 取込: dev 新規 **1 コミット** = `963e7e914`（#1169 単一 tag write の audit payload に batchId 相関キーを付与 issue-1129・issue-1128 の batchId index 最適化と対の write 側付与で apps/api + skill index/changelog を touch）
- 事象: content CONFLICT は **aiworkflow 配下のみ union 2**:
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
  - `indexes/keywords.json` は `--ours`（派生物）
  - `indexes/quick-reference.md` / `references/task-workflow-active.md` / 両 `SKILL-changelog.md` は **すべて Auto-merging（非衝突）**
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 2 files` + `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`--diff-filter=U` 0 / 残マーカー 0。
- **核心データポイント（CI 失敗ではなく base 進行による mergeStateStatus DIRTY の解消パターン）**: 初回 push 後 GitHub の mergeable が UNKNOWN→DIRTY/CONFLICTING に確定したのは CI 失敗でなく、push と同時に origin/dev が #1169 で進行し base との 3-way に skill index 衝突が生じたため。PR checks は初回 push 時点で全 pass・本 2nd-pass でも CI コード修正 0。確定則「PR DIRTY ≠ CI fail。CI 全 pass でも base 進行で skill index union 衝突は再発しうる→origin/dev 再取込 + `pnpm sync:resolve` で解消」を 1 コミット behind の最小再取込で確認。union member は #1169 が touch する index 生成物 + quick-reference が dev 側で初回マージ済（行域非重複で Auto-merge）に縮退し resource-map/topic-map 2 件のみ衝突。
- 検証順: `gh pr checks 1174`（fail/pending 0）→ `gh pr view --json mergeable`（DIRTY/CONFLICTING）→ `git fetch origin dev`（origin/dev `963e7e914`）→ `git merge origin/dev --no-edit` CONFLICT 3（resource-map / topic-map / keywords）→ `pnpm sync:resolve`（`union-resolving 2 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit` → `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等 → push。
- 反映先: 本 changelog（2nd-pass・union 2・PR DIRTY≠CI fail の実例）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避で起こさず L-DEVSYNC-117-B の確定データとして記録。
