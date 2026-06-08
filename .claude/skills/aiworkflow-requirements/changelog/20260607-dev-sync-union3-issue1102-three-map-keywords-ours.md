# dev sync: issue-1102 ブランチへ #1151（issue-1094 close-out）を取込み union 3＝3 index map（quick-reference + resource-map + topic-map）+ keywords.json `--ours` で解消＝L-DEVSYNC-076 定番パターンの安定再現（2026-06-07）

- 日時: 2026-06-07
- ブランチ: `docs/issue-1102-usedismissable-hook-extraction-spec` ← `dev`（sub-worktree wt-5・**1 behind / 3 ahead**・ローカル dev = origin/dev `8ed2e222d` 一致で dev 同期は no-op・独自コミット 0）
- 関連: `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-076 / 077**（union 3＝3 map + keywords `--ours` の正本パターン）/ L-DEVSYNC-097-A（union N と member 集合は独立変数）
- 取込: dev 新規 1 コミット = `8ed2e222d`（#1151 identity-conflicts の optimistic 消失アナウンスを単一 aria-live region 化・issue-1094・admin）
- 事象: content CONFLICT は **3 file（union）+ keywords（`--ours`）** = L-DEVSYNC-076 と同一構成:
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `indexes/keywords.json`（`--ours` 発火・1 derived file）
  - **`SKILL.md` / `SKILL-changelog.md` / `references/task-workflow-active.md` / `LOGS/_legacy.md` / `lessons-learned/*.md` は全て Auto-merging（衝突 0）**。task-workflow-active が union member から離脱した点が直近 L-DEVSYNC-111（union 4＝3 map + task-workflow-active）との差。
- 解消: `pnpm sync:resolve` **1 回**で `union-resolving 3 files`（quick-reference / resource-map / topic-map）+ `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --name-only --diff-filter=U` 0 / 実マーカー `<<<<<<<`・`>>>>>>>` grep 0。
- 核心データポイント（union member = 取込デルタ依存の再確認）: #1151 は issue-1094 の close-out（completed-tasks 配下の workflow ディレクトリ追加 + 3 index map への波及）で、task-workflow-active は本ブランチ側と行領域非重複で Auto-merge に転んだ。確定則「union member = 取込デルタが実 touch する skill ファイル集合」は本ケースでも揺るがず、resolver は member 集合非依存に単一パス収束。keywords.json は今回 `--ours` 側（hunk 位置依存・L-DEVSYNC-108-A の二択を再確認）。
- 検証順: `git fetch --prune origin`（dev = origin/dev `8ed2e222d` 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --left-right --count origin/dev...HEAD` = 1/3 → `git log HEAD..origin/dev` = #1151 単一 → `git merge dev --no-edit` CONFLICT 3 union + keywords → `pnpm sync:resolve`（`union-resolving 3 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `2751ecb0f`・lefthook 全 pass: staged-task-dir-guard は MERGE_HEAD で auto-skip / lefthook-edit-guard / block-test-suffix / block-stable-key-update）→ #1151 が `apps/web` コード（IdentityConflictAnnouncer 等）を含むため `pnpm typecheck` exit 0（7 packages 全 Done）/ `pnpm lint` exit 0（dep-cruiser 0 violations・eslint Done）/ `pnpm indexes:rebuild` 冪等（5476 kw・drift 0）。CI コード修正なしで全緑。
- 反映先: 本 changelog（L-DEVSYNC-076 パターンの安定再現）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-076/077 の確定データとして記録（直近 issue-1094 4th pass の運用方針を踏襲）。task-specification-creator [[dev-sync-merge-conflict-resolution]] SP-DEVSYNC-076 系と対。
