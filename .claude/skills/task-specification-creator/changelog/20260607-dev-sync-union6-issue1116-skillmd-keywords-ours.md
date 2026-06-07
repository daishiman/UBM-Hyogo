# dev sync: 6 コミット取込で衝突は aiworkflow-requirements 側 union 6 file に限局・task-specification-creator 配下は Auto-merge（衝突 0）で union member の skill 非対称を再確認（2026-06-07 issue-1116）

- 日時: 2026-06-07（`docs/issue-1116-admin-tag-master-code-edit-ui-spec` への dev 取込）
- ブランチ: `docs/issue-1116-admin-tag-master-code-edit-ui-spec` ← `dev`（sub-worktree wt-13・**3 ahead / 6 behind**・ローカル dev = origin/dev 一致（`a7fdfb5fc`）で dev 同期は no-op・独自コミット 0）
- 関連: 同型先行例 [[20260607-dev-sync-issue1103-behind6-catchup-union5-hono-bump]]（behind 6 一括キャッチアップ）/ `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` **SP-DEVSYNC-104/109**（本 changelog の lesson ID）/ 対の aiworkflow 版 [[20260607-dev-sync-union6-issue1116-skillmd-keywords-ours]]（L-DEVSYNC-117）
- 取込: dev 新規 6 コミット = `a7fdfb5fc`(#1154/#1105 member_status.member_id FK 制約) / `c53a275df`(#1152/issue-1101 出席分析是正) / `ec22db916`(#1156 transport util 集約) / `d34ce8131`(#1153/issue-1103 globals.css 1 本化) / `8ed2e222d`(#1151/issue-1094 identity-conflicts aria-live region 化) / `7922d38bf`(#1150/issue-1089 backfill 件数プレビュー)
- 事象: content CONFLICT は **aiworkflow-requirements 配下 6 file（union 5 + keywords `--ours` 1）に限局**。`task-specification-creator` 配下は SKILL.md / SKILL-changelog.md とも **全て Auto-merging（衝突 0）**。本 skill には `indexes/` ディレクトリが無く keywords `--ours` / rebuild は非対象。
- 解消: `pnpm sync:resolve` exit 0（`union-resolving 5 files` + `taking --ours for 1 derived files`（keywords.json）+ 内部 `pnpm indexes:rebuild`（5483kw・aiworkflow 側のみ）+ `all skill / index conflicts resolved`）。`task-specification-creator` に手解消は発生せず。
- 核心データポイント:
  - **union member 集合は skill 単位で非対称になりうる**: 同一取込デルタ（6 コミット）でも aiworkflow-requirements は SKILL.md 本文まで衝突するが task-specification-creator は衝突 0。確定則「**union member = 取込デルタが実 touch する skill ファイル集合**」は skill ごとに独立評価され、片側 6・片側 0 の非対称が正常。task-spec 側に衝突 0 でも本 changelog を残すのは「衝突 0 だった」事実自体が member 非対称則の証跡になるため。
  - **behind 6 でも単一 `pnpm sync:resolve` で収束**: behind 距離を見て手分割マージへ走らない（SP-DEVSYNC-104 の再確認）。#1105/#1156/#1103/#1094/#1089/#1101 が `apps/api`/`apps/web` コード変更を含むため merge 後 `pnpm install`（lockfile drift 0 の no-op）→ typecheck/lint を挟む。
- 検証順: `git fetch --prune origin`（dev = origin/dev 一致・local dev vs origin/dev = 0/0・独自 0）→ `git rev-list --count` で 6 behind / 3 ahead → `git merge origin/dev --no-edit` CONFLICT 6（全て aiworkflow 配下）→ `pnpm sync:resolve` exit 0 → `--diff-filter=U` 0 / マーカー 0 → merge commit `b3977a5d5`（lefthook 全 pass）→ `pnpm typecheck` exit 0（7 packages）/ `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0）。CI コード修正なしで全緑。
- 反映先: 本 changelog + 対の aiworkflow L-DEVSYNC-117。SP-DEVSYNC-109 として lesson 採番（現行最大 108 の次番号）。

## 後日談: dev 取込後に CI が赤化（merge 緑でも取込デルタが test 固定表明と衝突）— SP-DEVSYNC-110

merge は typecheck/lint/indexes 全緑だったが PR の `gh pr checks` で **5 job fail**（coverage-gate-shard (web) / coverage-gate / e2e (desktop-chromium) / e2e-tests-coverage-gate / smoke (chromium)）。原因 2 系統＝いずれも sync-merge 特有の semantic drift:

1. **固定カウント test の drift（admin nav 14→15）**: feature(issue-1116) が admin sidebar に `tag-master` nav を追加（11 項目化・合計 15）したが unit 2 本 + Playwright smoke の `toHaveCount(14)` が未更新。**git auto-merge は両側の nav 行追加を衝突なく結合するためカウント表明 drift は merge で検出されず CI で初顕在化**。dev 側 test 14 は dev nav 10 に対し正→ feature 追加分のみ +1（14→15）。
2. **SSR list の full-e2e 並列 404**: `/admin/tag-master` の Server Component が mock API(8787) へ SSR fetch するが、単体実行は緑・full 並列は port owner 切替で稀に 404→ error boundary fallback で testid 不可視。**schema/diff 先例（mock route があっても PLAYWRIGHT_TEST=1 gated fetchAdmin fixture を重ねる）に倣い SSR fixture を追加**して決定化。

タスク仕様の Phase 9（品質保証）/ Phase 11（手動 test）への含意（SP-DEVSYNC-089/098 補強）:
- **「固定数 assertion（nav 個数・件数・toHaveCount）を持つ UI 要素を追加/変更するタスク」は、Phase 9 の DoD に『同要素を数える既存 unit + e2e の表明を全 grep して同一 PR で更新』を明記**。auto-merge は数を結合するが表明は更新しないため、sync-merge 後の CI で必ず露見する。
- **SSR で admin データを引く新規 admin page は Phase 11 で full-suite 並列の 404 リスクを評価し、`PLAYWRIGHT_TEST=1` gated `fetchAdmin` fixture を既定の deliverable に含める**（mock route 単独依存は並列実行で非決定）。
- 核心: **merge 緑 ≠ CI 緑**。sync-merge 後は `gh pr checks` まで完了条件に含める（SP-DEVSYNC-104 の「install レイヤー別途」と同じく merge 後検証を畳まない）。

- 検証: `SidebarShell.spec`/`SidebarShell.server.spec`/`tag-master/page.spec` 18 PASS → `admin-tag-master-code-edit-ui` e2e 1 passed（fixture 経由・404 消失）→ web typecheck/lint exit 0 → commit `d4b431570` push。
- 反映先: 本節 + 対の aiworkflow L-DEVSYNC-118 + 両 SKILL-changelog.md。SP-DEVSYNC-110 採番。
