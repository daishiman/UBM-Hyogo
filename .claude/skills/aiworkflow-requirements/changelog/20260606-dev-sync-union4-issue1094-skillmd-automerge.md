# dev sync: 5 コミット取込でも union 4（SKILL.md は Auto-merge で衝突せず）・union member = 取込デルタが実 touch する skill ファイル集合という確定則を「複数コミット取込 × SKILL.md 非衝突」で再補強（2026-06-06）

- 日時: 2026-06-06
- ブランチ: `feat/issue-1094-identity-conflicts-optimistic-aria-live-announcement` ← `dev`（sub-worktree wt-1・**5 behind / 2 ahead**・ローカル dev = origin/dev 一致で dev 同期は no-op・独自コミット 0）
- 関連: 同日 [[20260606-dev-sync-union5-issue1140-behind1-confirms-delta-dependence]]（union member = 取込デルタ依存・behind 非依存の決定的確定）/ [[20260606-dev-sync-union2-issue1079-audit-member-shrink]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/101/107**
- 取込: dev 新規 5 コミット = `4769767c6`（#1148 テストアカウント網羅 seed staging D1 投入可能化）/ `e679722f5`（#1144 issue-1081 bulk tag endpoint real D1 runtime smoke 基盤 + CI gate）/ `314fd0a4a`（#1143 hono 4.12.18→4.12.21 bump）/ `38da7c254`（#1140 collapsed サイドバー tooltip + 公開フッター sticky + モバイルヘッダー sticky）/ `6e7b3e344`（#1139 issue-1079 admin audit bulk tag batchId 検索・行表示・copy）
- 事象: content CONFLICT は **4 file（全て union）**:
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `indexes/keywords.json` は `--ours` で解消（1 derived file）
  - **`SKILL.md` は今回 Auto-merging で衝突回避**（両 `SKILL-changelog.md` / `_legacy.md` / `lessons-learned/*` / task-spec 配下も Auto-merging）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 4 files` + `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved` exit 0。`git diff --diff-filter=U` 0 / 実マーカー（`<<<<<<<`/`=======`/`>>>>>>>`）grep 0。
- **核心データポイント（L-DEVSYNC-097/101 の確定則の再補強）**: 直近の #1140 単独取込（同日 3rd pass）は behind 1 でも SKILL.md を含む union 5 だった。本 pass は **5 コミットの大デルタ取込にもかかわらず union 4 で SKILL.md は非衝突（Auto-merge）**。これは「union member 数 = behind 数」でも「取込コミット数」でもなく、**取込デルタが実際に書き換える skill ファイル集合**で決まるという確定則をさらに裏付ける。今回 5 コミットはいずれも `SKILL.md` 本文の同一行を HEAD 側と競合させず（3-way base が保持され Auto-merge 成立）、index map 3 + task-workflow-active のみ union 衝突。**union member の見積りは取込コミット数からも behind 数からも不能 → 必ず `git diff --name-only --diff-filter=U` と `union-resolving N files` の N を実確認**。
- 検証順: `git fetch --prune origin`（dev = origin/dev 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --left-right --count HEAD...origin/dev` = 2/5 → `git merge dev --no-edit` CONFLICT 4 union + keywords → `pnpm sync:resolve`（`union-resolving 4 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `85cdac6ac`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ `pnpm install`（hono bump 取込で固定実行・Done 1m17s）→ `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0（stablekey-literal は mode=warning の既存 3 件で exit 0）/ `pnpm indexes:rebuild` 冪等（5472 kw・drift 0）。CI コード修正なしで全緑。
- 反映先: 本 changelog（確定則の再補強データ）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-097/101/107 の確定データとして記録。
