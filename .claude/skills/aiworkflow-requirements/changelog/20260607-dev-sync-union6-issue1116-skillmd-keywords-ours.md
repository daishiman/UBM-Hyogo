# dev sync: 6 コミット取込で union 6 file（SKILL.md 本文衝突含む）+ keywords `--ours` 構成・task-specification-creator 側は衝突 0 で union member が skill 単位で非対称になることを再確認（2026-06-07 issue-1116）

- 日時: 2026-06-07（`docs/issue-1116-admin-tag-master-code-edit-ui-spec` への dev 取込）
- ブランチ: `docs/issue-1116-admin-tag-master-code-edit-ui-spec` ← `dev`（sub-worktree wt-13・**3 ahead / 6 behind**・ローカル dev = origin/dev 一致（`a7fdfb5fc`）で dev 同期は no-op・独自コミット 0）
- 関連: 同型先行例 [[20260607-dev-sync-union6-issue1105-skillmd-content-conflict]]（8 取込で両 SKILL.md 本文衝突）/ `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-098/107/117**（本 changelog の lesson ID）/ 対の task-spec 版 [[20260607-dev-sync-union6-issue1116-skillmd-keywords-ours]]（SP-DEVSYNC-109）
- 取込: dev 新規 6 コミット = `a7fdfb5fc`(#1154/#1105 member_status.member_id FK 制約で orphan を DB レベル禁止) / `c53a275df`(#1152/issue-1101 出席分析 zone 境界・延べ/unique 指標是正) / `ec22db916`(#1156 transport 選択 util 集約) / `d34ce8131`(#1153/issue-1103 globals.css 重複 shell ブロック 1 本化) / `8ed2e222d`(#1151/issue-1094 identity-conflicts optimistic 消失アナウンス単一 aria-live region 化) / `7922d38bf`(#1150/issue-1089 全件 backfill 確定前の実 response 件数プレビュー)
- 事象: content CONFLICT は **aiworkflow-requirements 配下 6 file（union 5 + keywords `--ours` 1）に限局**:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（**union・本文衝突**）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（`--ours` 発火・1 derived file）
  - `task-specification-creator` 配下は SKILL.md / SKILL-changelog.md とも **全て Auto-merging（衝突 0）**で本 skill 固有の手解消は不要。`apps/web/src/styles/globals.css`（#1153 が dev 側で 1 本化）と `apps/web/playwright/fixtures/auth.ts` も path 非交差で auto-merge 成立。
- 解消: `pnpm sync:resolve` exit 0（**`union-resolving 5 files`**（SKILL.md + 3 index map + task-workflow-active）+ **`taking --ours for 1 derived files`**（keywords.json）+ 内部 `pnpm indexes:rebuild`（5483kw）+ `all skill / index conflicts resolved`）。`git diff --diff-filter=U` 0 / 実マーカー grep 0。
- 核心データポイント（union member の skill 非対称性）:
  - **union member 集合は skill 単位で非対称になりうる**: 同一取込デルタ（6 コミット）でも、aiworkflow-requirements は SKILL.md 本文まで衝突（最新規約行・変更履歴 table が両側 touch）だが task-specification-creator は衝突 0。確定則「**union member = 取込デルタが実 touch する skill ファイル集合**」は skill ごとに独立評価され、片側 0・片側 6 の非対称が正常成立する。resolver は両 skill を一括スキャンするため member 非対称でも単一パスで収束。
  - **keywords.json は aiworkflow-requirements にのみ存在**: task-specification-creator に `indexes/` ディレクトリが無いため `--ours` + rebuild は aiworkflow 側のみ発火。
  - **behind 6 でも単一 `pnpm sync:resolve` で収束**: behind 距離を見て手分割マージへ走らない（L-DEVSYNC-107 / SP-DEVSYNC-104 の再確認）。#1105/#1101/#1156/#1103/#1094/#1089 が `apps/api`/`apps/web` コード変更を含むため merge 後 `pnpm install`（lockfile drift 0 の no-op）→ typecheck/lint を挟む。
- 検証順: `git fetch --prune origin`（dev = origin/dev 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --count` で 6 behind / 3 ahead → `git merge origin/dev --no-edit` CONFLICT 6 → `pnpm sync:resolve`（`union-resolving 5 files` + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0 → merge commit `b3977a5d5`（lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（未ステージ drift 0・5483kw）。CI コード修正なしで全緑。
- 反映先: 本 changelog（union member の skill 非対称性データ点）+ 対の task-spec changelog + 両 SKILL-changelog.md 1 行。L-DEVSYNC-117 として lesson 採番（現行最大 116 の次番号）。

## 後日談: dev 取込後に CI が赤化（merge は緑でも取込デルタが test 表明と衝突）— L-DEVSYNC-118

merge commit 自体は typecheck/lint/indexes 全緑だったが、PR の `gh pr checks` で **5 job fail**（coverage-gate-shard (web) / coverage-gate / e2e (desktop-chromium) / e2e-tests-coverage-gate / smoke (chromium)）が出た。原因 2 系統で、いずれも「**dev 取込が増やした nav item と、feature ブランチ側 test の固定カウント表明の衝突**」という sync-merge 特有の semantic drift:

1. **admin sidebar nav カウント drift（14→15）**: 本 feature(issue-1116) が `shell-config.ts` の admin group に `tag-master` を追加し admin nav が 11 項目化（合計 15）したが、`SidebarShell.spec.tsx` / `SidebarShell.server.spec.tsx`（unit）と `sidebar-shell-smoke.spec.ts`（Playwright `toHaveCount(14)`）の固定表明が 14 のまま。**git auto-merge は両側の nav 追加を行衝突なく結合するため、カウント表明の drift は merge では検出されず CI で初めて顕在化**する。dev 側 nav は 10 のままで dev の test 14 は正しい→ feature 側追加分 +1 を test に反映するのが正（14→15、3+1+10→3+1+11）。
2. **SSR list の mock port 競合 404（full e2e 並列特有）**: `/admin/tag-master` の Server Component は `safeServerFetch("/admin/tags?page=1&pageSize=100")` を実行。**単体 e2e 実行ではローカル mock API(127.0.0.1:8787) が応答し緑だが、full e2e の複数 spec 並列実行では port 8787 の owner worker 切替/EADDRINUSE reuse タイミングで稀に 404 化**し、page が list の代わりに `AdminSectionErrorClient` を render → `getByTestId('admin-tag-master-list')` 不可視で fail（retry も同様 = flaky でなく並列構造依存）。**確立パターン = `fetchAdmin` に `PLAYWRIGHT_TEST=1` gated SSR fixture を足す**（`/admin/schema/diff` が mock route を持つのに重ねて PLAYWRIGHT_TEST fixture を持つ先例 server-fetch.ts:536-543 と同型）。GET `path === "/admin/tags" || startsWith("/admin/tags?")` のみ捕捉し `/admin/tags/queue`（tag-queue page）と PATCH（browser-side route mock）は非該当に設計。

- 核心教訓:
  - **merge 緑 ≠ CI 緑**: sync-merge 後は merge の typecheck/lint だけでなく `gh pr checks` を必ず確認。固定カウント test（nav 個数 / 件数 assertion）は両側追加の auto-merge で静かに drift する。
  - **「単体で緑な e2e が full run で 404」は mock SSR を fetchAdmin fixture へ移すサイン**: 並列実行で port 共有 mock に依存する SSR page は非決定。schema/diff 先例どおり `PLAYWRIGHT_TEST=1` gated fixture で決定化。
- 検証: `SidebarShell.spec` / `SidebarShell.server.spec` / `tag-master/page.spec` 18 tests PASS（root=../..）→ `admin-tag-master-code-edit-ui` e2e desktop-chromium 1 passed（fixture 経由・404 消失）→ web typecheck / lint exit 0 → commit `d4b431570` push。CI 再実行で確認。
- 反映先: 本節 + 対の task-spec changelog 同節（SP-DEVSYNC-110）+ 両 SKILL-changelog.md。L-DEVSYNC-118 採番。
