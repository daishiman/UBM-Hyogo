# dev sync: 同一ブランチ 2nd pass・単一 smoke コミット #1165 取込で union 4（**SKILL.md 衝突・topic-map は Auto-merge**）+ `pnpm sync:resolve` 1 パス収束・CI コード修正 0 で全緑（2026-06-08 issue-1118 2nd pass）

- 日時: 2026-06-08（`docs/issue-1118-admin-tag-catalog-lifecycle-ui-spec` への dev 取込・**二度目**）
- ブランチ: `docs/issue-1118-admin-tag-catalog-lifecycle-ui-spec` ← `dev`（sub-worktree wt-18・**1 behind / 4 ahead**・ローカル dev vs origin/dev = 0/0 で同期済み → ff 不要・独自コミット 0）
- 関連: 同一ブランチ 1st pass [[20260608-dev-sync-issue1118-behind8-union5-keywords-ours]]（behind 8・union 5・topic-map 衝突・keywords `--ours`・merge `83041e5fa`）/ 同日他ブランチ [[20260608-dev-sync-union5-staging-mint-bearer-4commit-aiworkflow-only-conflict]] / `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107**
- 取込: dev 新規 1 コミット = `8bab08a62`(#1165 staging bearer mint の env 契約を role-scoped 化 + `verify-mint-env-contract` drift gate 追加・親 issue-1081)。`.github/workflows/{runtime-smoke-staging,verify-mint-env-contract}.yml` + `apps/web/playwright/tests/admin-meetings-prototype-alignment.spec.ts` + staging-mint-bearer-env-contract-guard close-out 一式を同梱。
- 事象: content CONFLICT は **union 4**。1st pass（union 5）と member が変動:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union・本文衝突）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `indexes/topic-map.md` は **Auto-merging で非衝突**（1st pass では衝突していた）
  - `indexes/keywords.json` も Auto-merging（`--ours` 非発火・1st pass では `--ours` 発火）/ `SKILL-changelog.md`（両スキル）も Auto-merging / `task-specification-creator/SKILL.md` は非衝突（マージ出力未出現）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 4 files` + 内部 `pnpm indexes:rebuild` を完遂し `all skill / index conflicts resolved`。`git diff --diff-filter=U` 0 / 実マーカー grep 0（`ut-08-monitoring-alert-design/.../manual-smoke-log.md` の `===` 60 文字罫線は誤検出として除外確認済み・確立済みパターン）。
- **核心データポイント（同一ブランチ 1st→2nd pass で union member が縮退）**: 確定則「**union member = 取込デルタが実 touch する skill ファイル集合**」は本回も成立。1st pass は behind 8 の大デルタで topic-map / keywords まで波及し union 5 + keywords `--ours`。本 2nd pass は behind 1（#1165 single・workflow/smoke 中心デルタ）で topic-map / keywords は触れず union 4 へ縮退。**取込デルタが浅まる二度目以降は union member が縮退しやすく、keywords `--ours` 発火・topic-map 衝突は取込内容に独立連動する**（件数を予測子にせず毎回 `git diff --name-only --diff-filter=U` と `union-resolving N files` の N を実確認）。
- 検証順: `git fetch --prune origin`（local dev vs origin/dev = 0/0 一致・独自 0 → ff 不要）→ `git rev-list --left-right --count HEAD...dev` で 4 ahead / 1 behind → `git merge dev --no-edit` CONFLICT 4 union → `pnpm sync:resolve`（`union-resolving 4 files` + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → `git commit --no-edit`（merge commit `a144bc94c`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ #1165 が `.github/workflows`/`apps/web` 変更を含むため `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0・5485 キーワード）。CI コード修正なしで全緑。
- 反映先: 本 changelog（同一ブランチ 1st→2nd pass の union 5→4 縮退・topic-map/keywords が二度目で非衝突化した新データ点）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-098/107 の確定データ（二度目 sync の union member 縮退・keywords/topic-map の独立連動）として記録。
