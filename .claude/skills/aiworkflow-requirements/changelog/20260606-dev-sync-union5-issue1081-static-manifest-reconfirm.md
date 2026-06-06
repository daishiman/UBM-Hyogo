# dev sync: union 5（全 aiworkflow コア + keywords.json `--ours`）が behind 数 7→6 でも member 不変・static-manifest drift なしを再追認（2026-06-06）

- 日時: 2026-06-06
- ブランチ: `docs/issue-1081-bulk-tag-real-d1-runtime-smoke-spec` ← `dev`（sub-worktree wt-10・**6 behind / 2 ahead**、ローカル dev = origin/dev 一致（`d9fe6b398`）で dev 同期は no-op・独自コミット 0）
- 関連: `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-101**（再追認・新規番号は起こさず）/ `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` **SP-DEVSYNC-091**（再追認）/ 直前事例 [[20260605-dev-sync-union5-fullcore-keywords-ours-static-manifest-clean]]
- 事象: `git merge dev --no-edit` 後の content CONFLICT は 6 file で、前回 union5（2026-06-05・7 behind）と **member 完全一致**:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（派生物 = `--ours`）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - （`SKILL-changelog.md` / `docs/30-workflows/LOGS.md` / `task-specification-creator/SKILL-changelog.md` は git auto-merge で衝突回避）
- 解消: `pnpm sync:resolve` 1 回で **`union-resolving 5 files`**（aiworkflow コア 5 = SKILL.md + quick-reference + resource-map + topic-map + task-workflow-active）+ **`taking --ours for 1 derived files: keywords.json`** + 内部 `pnpm indexes:rebuild` を完遂。`all skill / index conflicts resolved` exit 0・`unhandled WARN` なし・手動編集/追加スクリプト不要。
- **核心データポイント（L-DEVSYNC-101 / SP-DEVSYNC-091 の再追認）**: 取込デルタには `docs/00-getting-started-manual/specs/01-api-schema.md`（tag CRUD spec）+ `apps/api/src/repository/_shared/generated/static-manifest.json` + `apps/api/src/repository/tagDefinitions.ts` が含まれるにもかかわらず、merge 後 `pnpm verify:static-manifest` は `[verify-static-manifest] OK`（drift 0）でパス。dev 側が spec 変更と同一デルタ内で manifest を再生成済（auto-merge で整合版を取込）のため取込 feature 側に hash drift が残らず、`regenerate:static-manifest` 1 手は不要だった。前回の境界結論「upstream が spec + manifest を同伴 land すれば drift しない条件付き故障」は本件で 2 例目として安定確認。運用（delta に `01-api-schema.md` を見たら `verify:static-manifest` を必ず実行）は維持。
- **新規性（振動則の安定性追認）**: behind 数が前回 7 → 今回 6 に変わっても union member 集合は同一 5 + keywords `--ours` で不変。L-DEVSYNC-097/101 の「union member は取込デルタの大きさに依らず skill コア構造で決まる」という振動則が behind 数非依存で再現。`union-resolving N files` の N（=5）と `--ours` 行はログで実確認するのが正運用。keywords 件数は rebuild 後 5469。
- 検証順: `git fetch --prune origin`（dev=origin/dev 一致 `d9fe6b398`・独自コミット 0）→ `git rev-list --left-right --count origin/dev...HEAD` = 6/2 → `git merge dev --no-edit` で CONFLICT 6（上記）→ `pnpm sync:resolve`（`union-resolving 5 files` + `--ours` 1 + rebuild + `all skill / index conflicts resolved`）→ `git diff --name-only --diff-filter=U` = 0 / 実マーカー `<<<<<<<`・`>>>>>>>` 0 件（`=======` 60 文字装飾線 false-positive は別途無害確認）→ `git commit --no-edit`（merge commit `debdeaded`・lefthook: lefthook-edit-guard / block-test-suffix / staged-task-dir-guard（MERGE_HEAD で auto-skip）/ main-branch-guard / block-stable-key-update 全 pass）→ `pnpm typecheck`（7 packages 全 Done）→ `pnpm lint`（exit 0）→ `pnpm indexes:rebuild` 冪等（drift 0）→ **`pnpm verify:static-manifest` OK（drift 0・regenerate 不要）**。CI failure なし。
- 反映先: 本 changelog（再追認データポイント）。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-101 / SP-DEVSYNC-091 の有効性確認として記録。
