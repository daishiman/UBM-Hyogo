# dev sync 2nd pass: 1 コミット取込（behind 1・#1167）で union 1 + keywords `--ours`・**加えて CI `workflow-shell-lint` fail を production-runtime-smoke.yml の job-level → step-level CF token 移動で修正**（2026-06-09 issue-1137・通算 2 回目）

- 日時: 2026-06-09（`feat/issue-1137-bulk-tag-production-runtime-smoke-spec` への dev 取込・通算 2 回目）
- ブランチ: `feat/issue-1137-bulk-tag-production-runtime-smoke-spec` ← `origin/dev`（sub-worktree wt-6・**1 behind / 5 ahead**・前回 sync(merge `555d901fc`) 後に dev へ #1167 が 1 件 land・ローカル dev = origin/dev 0/0 で同期不要）
- 起点: ユーザー指示「CI が失敗していたら CI を改善・コンフリクトが発生していたら解消」。**今回は CI fail と conflict が両方発生** → 両方解消。
- 関連: 1 回目 [[20260609-dev-sync-issue1137-behind9-union1-topicmap-only-keywords-ours]] / cf-token 撤廃 [[20260609-dev-sync-cf-token-rotation-behind1-union1-topicmap-only-keywords-automerge]] / `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md`
- 取込: dev 新規 1 コミット = `c4b48aa44`（#1167 audit_log batchId 検索を VIRTUAL generated column + index で最適化・issue-1128）

## A. CI 改善（workflow-shell-lint fail）

- **事象**: PR #1171 の `workflow-shell-lint` job（step「Workflow secret scope shell unit」= `pnpm test:workflow-secrets`）が fail。`workflow-env-scope.test.sh:22` が `production-runtime-smoke.yml:127` に **job-level `CLOUDFLARE_API_TOKEN`** を検出して exit 1。
- **真因（dev 取込との構造的相互作用）**: 本 gate は元々 web-cd / backend-ci / post-release-dashboard の 3 file 固定検査だったが、**#1178（cf-token env 契約是正・前回 sync で dev から取込済）が `find "$REPO_ROOT/.github/workflows" -maxdepth 1 ... | assert_no_job_level_cf_token` の全 workflow 走査ループ（test L96-98）を追加**したため、本ブランチが issue-1137 で新設した `production-runtime-smoke.yml` の `bulk-tag-production-runtime-smoke` job が持つ job-level CF token が**新たに検査対象に入って fail**。＝feature 側コードは無変更でも、dev が global lint gate を強化すると既存 job-level パターンが事後的に違反化する。
- **修正**: staging 版（`runtime-smoke-staging.yml` の verify-bulk-inputs / run step）の確立パターンに合わせ、`CLOUDFLARE_API_TOKEN` を job-level env から削除し、実際に使う 2 step の step-level env へ限定露出:
  - `verify required production bulk tag secrets` step（欠落検査で `${!name}` 参照）
  - `run bulk tag production runtime smoke` step（`runtime-tag-bulk.sh production` → `cf.sh` が production D1 書込で使用）
  - job-level には削除理由コメントのみ残置。`CLOUDFLARE_ACCOUNT_ID`（vars・非機密）は job-level 据え置きで可（gate は token のみ検査）。
- **検証**: ローカルで `pnpm test:workflow-secrets` 再現 → `redaction-check 15 assertions passed` + `workflow-env-scope.test.sh: all assertions passed`（exit 0）。
- **教訓（再掲・本回で再実証）**: workflow yml に新 secret env を足す時は **job-level 禁止 / step-level 必須**（`pnpm lint` 非対象・`pnpm test:workflow-secrets` / CI `workflow-shell-lint` でのみ検出）。さらに **dev 側が `find` 走査型の global lint gate を強化したら、自ブランチの全 workflow を再走査して既存違反が顕在化しうる**ため、sync-merge 後は typecheck/lint だけでなく `pnpm test:workflow-secrets` 等の shell gate も回す。

## B. コンフリクト解消（skill index）

- content CONFLICT は **2 file**＝`indexes/topic-map.md`（union・**union 1**）+ `indexes/keywords.json`（`--ours`）。`quick-reference` / `resource-map` / `task-workflow-active` / 両 `SKILL-changelog` は Auto-merge、`task-specification-creator/` 配下は衝突 0。1 回目（behind 9）と同一プロファイル（union 1 + keywords `--ours`）で、behind 1 でも keywords が `--ours` 発火＝#1167 の keyword delta が両側 rebuild 行衝突を起こす規模だったため（cf-token behind 1 の Auto-merge とは取込内容次第で分岐）。
- 解消: `pnpm sync:resolve` 1 回（`union-resolving 1 files` topic-map + `--ours` keywords + rebuild）→ `--diff-filter=U` 0 / マーカー 0。

## 検証順 / 結果

`gh pr checks 1171`（workflow-shell-lint fail / 他 31 pass）→ workflow yml 修正（job→step）→ `pnpm test:workflow-secrets` exit 0 → `git fetch`（dev = origin/dev 0/0）→ `git merge origin/dev --no-edit` CONFLICT 2 → `pnpm sync:resolve` → `git add -A && git commit --no-edit`（merge `b506c90c0`・yml 修正同梱・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ `pnpm indexes:rebuild` 冪等 → typecheck / lint exit 0。新規 lesson 番号は SSOT インフレ回避で起こさず L-DEVSYNC + cf-token CI 教訓の確定データ拡張として記録。task-specification-creator [[dev-sync-merge-conflict-resolution]] と対。
