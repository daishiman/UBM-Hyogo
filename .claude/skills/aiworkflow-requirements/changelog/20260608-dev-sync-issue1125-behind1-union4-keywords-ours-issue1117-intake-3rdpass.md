# dev sync 3rd pass: 1 コミット取込（#1157）で union 4 file + `keywords.json` --ours（**aiworkflow 側のみ衝突・task-spec SKILL.md は非衝突**）+ `pnpm sync:resolve` 1 パス収束・CI 全緑（2026-06-08 issue-1125・同日 3 回目）

- 日時: 2026-06-08（`docs/issue-1125-bulk-tag-result-staging-mutation-visual-baseline-spec` への dev 取込・**同日 3 回目**）
- ブランチ: `docs/issue-1125-bulk-tag-result-staging-mutation-visual-baseline-spec` ← `origin/dev`（sub-worktree wt-3・**1 behind / 6 ahead**・前回 sync 後に dev へ #1157 が 1 件 land・ローカル dev = origin/dev **0 behind/0 ahead** 独自 0 でメイン WT 同期不要）
- 起点: ユーザー指示「CI が失敗していたら CI を改善・コンフリクトが発生していたら解消」。**CI は全 pass（43 pass / 4 skipping＝条件付きジョブ・失敗 0）→ CI 改善は不要**。一方 PR #1164 が `mergeable: CONFLICTING / mergeStateStatus: DIRTY`（base=dev に #1157 が land しブランチが 1 behind）→ **コンフリクト解消のみ実施**。
- 関連: 同日 1 回目 [[20260608-dev-sync-issue1125-behind8-union4-keywords-ours]] / 同日 2 回目 [[20260608-dev-sync-issue1125-behind1-union4-keywords-ours-issue1119-intake]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/098/107**
- 取込: dev 新規 1 コミット = `596fc0c24`(#1157 参照付き tag の強制移行つき物理削除を実装 issue-1117)
- 事象: content CONFLICT は **5 file**。同日 1・2 回目と**完全同一の衝突 file 集合**:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union・本文衝突）
  - `.claude/skills/aiworkflow-requirements/indexes/{quick-reference, resource-map, topic-map}.md`（union 4）
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（**`--ours` → rebuild 再生成**）
  - `references/task-workflow-active.md` / `SKILL-changelog.md`（両スキル）/ `LOGS/_legacy.md` は Auto-merging で非衝突
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 4 files` + `taking --ours for 1 derived files` + 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0。
- **核心データポイント（CI green × PR CONFLICTING の判別 + behind 8→1→1 同日 3 連続）**:
  1. **CI pass と PR mergeable は独立軸**: push 済み commit の CI が全 pass でも、その後 base(dev) に land した commit で PR が `CONFLICTING` になる。`gh pr checks` の pass と `gh pr view --json mergeable` の CONFLICTING を別々に確認し、前者が緑なら CI 改善は走らせず後者の解消（dev 取込 + `sync:resolve`）のみ行うのが正しい切り分け。
  2. **union member は intake コミット数に非依存（同一ブランチ同日 3 連続で実証）**: behind 8 → behind 1 → behind 1 の 3 回とも衝突 file 集合・keywords.json `--ours` 分岐が完全一致（L-DEVSYNC-097-A 独立変数則）。
- 検証順: `gh pr checks 1164`（43 pass / 4 skipping）→ `gh pr view --json mergeable`（CONFLICTING/DIRTY）→ `git fetch --prune origin`（local dev = origin/dev 0/0）→ `git merge origin/dev --no-edit` CONFLICT 5 → `pnpm sync:resolve`（union 4 + `--ours` + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git add -A && git commit --no-edit`（merge `385e274b8`・lefthook 全 pass・MERGE_HEAD で staged-task-dir-guard auto-skip）→ #1157 apps/api 同梱ゆえ `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0。CI コード修正 0。
- 反映先: 本 changelog（CI green × PR CONFLICTING 判別則 + 同日 3 連続データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避で起こさず L-DEVSYNC-097/098/107 の確定データ拡張として記録。
