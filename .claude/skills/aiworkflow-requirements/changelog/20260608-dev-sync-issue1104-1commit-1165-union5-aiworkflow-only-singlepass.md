# dev sync: #1165（staging-mint-bearer env 契約 role-scoped 化）1 コミット取込で union 5 file（**aiworkflow 側のみ衝突・task-spec SKILL.md は非衝突**）+ `pnpm sync:resolve` 1 パス収束・CI コード修正 0 で全緑（2026-06-08 issue-1104 ブランチ）

- 日時: 2026-06-08（`docs/issue-1104-member-creation-path-unification-spec` への dev 取込）
- ブランチ: `docs/issue-1104-member-creation-path-unification-spec` ← `dev`（sub-worktree wt-16・**1 behind / 4 ahead**・ローカル dev は origin/dev と一致（0 behind / 0 own）→ dev 同期は冪等スキップ・独自コミット 0）
- 関連: 同型先行例 [[20260608-dev-sync-union5-staging-mint-bearer-4commit-aiworkflow-only-conflict]] / [[20260608-dev-sync-issue1104-2commit-intake-union4-twa-in-web-disjoint]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107**
- 取込: dev 新規 1 コミット = `8bab08a62`（#1165 staging bearer mint の env 契約を role-scoped 化 + 新規 `verify-mint-env-contract` drift gate 追加）。この 1 コミットが staging-mint-bearer-env-contract-guard workflow 成果物 47 file（completed-tasks 配下 + 両 SKILL-changelog 行 + 先行 session が事前 author 済の union5 changelog 自体）を内包。
- 事象: content CONFLICT は **5 file（全 union）**。先行 [[20260608-dev-sync-union5-staging-mint-bearer-4commit-aiworkflow-only-conflict]] と**完全同型 = aiworkflow 側のみ衝突し、task-spec SKILL.md は Auto-merge で非衝突**:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union・本文衝突）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `indexes/keywords.json` は Auto-merging で非衝突（`--ours` 発火せず）/ `SKILL-changelog.md`（両スキル）も Auto-merging
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 5 files` + 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0。
- **核心データポイント（union member 拡張則の再々確認 + intake コミット数非依存）**: 確定則「**union member = 取込デルタが実 touch する skill ファイル集合**」は本回も成立。先行 union5 例は 4 コミット intake だったが、本回は **dev へ #1165 が squash-merge された結果 1 コミット intake** でも、touch する skill ファイル集合が同一（aiworkflow SKILL.md 変更履歴 table + 4 index/reference）であるため **union member 集合・衝突 file は完全一致**。→ **resolver の収束は intake コミット数に非依存・touch ファイル集合のみに依存**することを実証。task-spec SKILL.md（最新 3 件規約行）は本回も touch されず非衝突。
- 検証順: `git fetch --prune origin`（local dev vs origin/dev = 0 behind / 0 own → dev 同期は冪等スキップ・dev = origin/dev `8bab08a62` 一致確認）→ `git rev-list --count` で 1 behind / 4 ahead → `git merge dev --no-edit` CONFLICT 5 union → `pnpm sync:resolve`（`union-resolving 5 files` + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `37f53e3f4`・lefthook 全 pass: lefthook-edit-guard / main-branch-guard / block-test-suffix / staged-task-dir-guard は MERGE_HEAD で auto-skip / block-stable-key-update）→ #1165 が `apps/web`/`apps/api`/`.github/workflows` を含むため `pnpm install --force` → `pnpm typecheck` / `pnpm lint` / `pnpm indexes:rebuild` 冪等確認。CI コード修正なしで全緑。
- 反映先: 本 changelog（intake コミット数非依存の新データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-098/107 の確定データ（touch ファイル集合 → member 集合・intake 数非依存）として記録。
