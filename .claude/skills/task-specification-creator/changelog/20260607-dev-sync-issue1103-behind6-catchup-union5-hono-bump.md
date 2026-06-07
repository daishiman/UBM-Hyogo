# dev sync: behind 6 の一括キャッチアップを union 5 + keywords --ours の単一 `pnpm sync:resolve` で吸収・hono bump 再同伴で install レイヤーのみ別途必要（2026-06-07 issue-1103）

- 日時: 2026-06-07
- ブランチ: `docs/issue-1103-globals-css-shell-block-consolidation-spec` ← `dev`（sub-worktree wt-15・**2 ahead / 6 behind**、ローカル dev = origin/dev 一致（`8298bcd7e`）で dev 同期は no-op・独自コミット 0）
- 関連: [[20260606-dev-sync-union5-issue1140-behind1-confirms-delta-dependence]]（member=取込デルタ依存）/ `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` **SP-DEVSYNC-104**（本 changelog の lesson ID）/ aiworkflow-requirements `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-112**（対の aiworkflow 版）
- 事象: 取込 6 コミット = #1149（durationMs 行）+ #1147（staging API loopback / session service-binding 統一）+ #1148（テストアカウント seed）+ #1144（bulk tag real D1 runtime smoke 基盤）+ #1143（hono 4.12.18→4.12.21 bump）+ #1140（shell tooltip + footer/header sticky）。直近 sync 群の 1〜3 behind より大きい **6 behind** の一括キャッチアップ。content CONFLICT は `aiworkflow-requirements` 配下 6 file（SKILL.md + indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md} + references/task-workflow-active.md）。`task-specification-creator` 配下は全て auto-merge（衝突 0）で本 skill 固有の手解消は不要。`apps/web/src/styles/globals.css`（本 feature が編集）も dev 取込と path 非交差で auto-merge 成立。
- 解消: `pnpm sync:resolve` exit 0（**`union-resolving 5 files`**（SKILL.md + 3 index map + task-workflow-active）+ **`taking --ours for 1 derived files`**（keywords.json）+ 内部 `pnpm indexes:rebuild`（5474kw）+ `all skill / index conflicts resolved`）。`task-specification-creator` に `indexes/` は無く rebuild 非対象。
- 核心データポイント:
  - **behind 件数は解消手順を変えない**: 6 commit 一括でも skill index/SKILL コアに衝突が限局し、単一 `pnpm sync:resolve` で収束。behind 距離を見て手分割マージへ走らない。
  - **hono bump 再同伴 → install レイヤーのみ別途**: `package.json`/`pnpm-lock.yaml` は auto-merge だが merge 後 `pnpm install`（lockfile drift 0 の no-op）→ typecheck/lint を挟む（SP-DEVSYNC-099 / L-DEVSYNC-107-A の再適用）。
  - **feature 編集の apps source も path 非交差なら auto-merge**: globals.css（issue-1103 の重複 shell ブロック 1 本化）と dev 取込が同一 hunk 非接触で衝突 0。衝突は両側同一 path/hunk の skill コアに限局。
- 検証: `git log HEAD..dev` = 6 commit → `git merge dev --no-edit` CONFLICT 6 → `pnpm sync:resolve` exit 0（`union-resolving 5 files` + `--ours`(keywords) + rebuild）→ `--diff-filter=U` 0 / 実マーカー 0 → merge commit `3972af44d` → `pnpm install`（no-op）→ `pnpm typecheck` 0 / `pnpm lint` 0 / `pnpm indexes:rebuild` 冪等 drift 0。CI failure なし。
- 反映先: 本 changelog + aiworkflow L-DEVSYNC-112。SP-DEVSYNC-104 として lesson 採番（現行最大 103 の次番号）。
