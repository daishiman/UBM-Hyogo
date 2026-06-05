# dev sync: union 5 = 全 aiworkflow コア（SKILL.md + map 3 + task-workflow-active）+ keywords.json `--ours` 発火（2026-06-05）

- 日時: 2026-06-05
- ブランチ: `docs/issue-1076-member-og-design-token-alignment-spec` ← `dev`（4 behind / 2 ahead、ローカル dev = origin/dev 一致で dev 同期は no-op）
- 関連: `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-097（新規）/ `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-089（新規）
- 事象: `git merge dev --no-edit` 後の content CONFLICT は 6 file:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（派生物 = `--ours`）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - （`SKILL-changelog.md` / `LOGS/_legacy.md` / `lessons-learned/*.md` は git auto-merge で衝突回避）
  - 取込 4 コミット: #1120（issue-1065 cookie 命名 SSOT）/ #1115（admin 開催日 404 + 出席 UX）/ #1114（issue-1063 cookie Secure）/ #1109（会員詳細 status 404 耐性化）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 5 files`（aiworkflow コア 5 = SKILL.md + quick-reference + resource-map + topic-map + task-workflow-active）+ `taking --ours for 1 derived files: keywords.json` + 内部 `pnpm indexes:rebuild`（5375 キーワード）を完遂。手動編集・追加スクリプト不要。merge commit `c7d4ac0a2` 後の確認 `pnpm indexes:rebuild` は drift 0 で chore(indexes) 分離不要。
- 検証順: `pnpm sync:resolve` → `git diff --name-only --diff-filter=U` = 0 / 実マーカー `<<<<<<<`・`>>>>>>>` 0 件 → `git commit --no-edit`（lefthook: main-branch-guard / staged-task-dir-guard（MERGE_HEAD で auto-skip）/ block-test-suffix / block-stable-key-update 全 pass）→ `pnpm typecheck`（7 packages 全 Done）→ `pnpm lint`（exit 0・dep-cruiser 0 violations・verify-no-inline-style OK・stablekey OK）→ `pnpm indexes:rebuild` drift 0 で all green。CI failure なし。
- データポイント（member 構成の振動則の追認）: union 集合は (a) どの aiworkflow file が衝突するか (b) task-spec 配下が混じるか (c) keywords が衝突するか の 3 軸で独立に振れる。L-DEVSYNC-095（union 5 = aiworkflow 4 + task-spec 1・keywords `--ours`）/ L-DEVSYNC-096（union 3 = SKILL.md/resource-map 脱落）に対し、本件は **aiworkflow コア 5 全衝突 + keywords 衝突**という第 N 変種。件数（3〜6）も内訳も予測子にせず `union-resolving N files` の N と `--ours` 行をログで実確認するのが正運用。全 member が `.gitattributes` の union/`--ours` 登録に閉じる限り resolver は集合非依存に exit 0 で畳む。
- 反映先: `aiworkflow-requirements/lessons-learned/...-2026-05.md` L-DEVSYNC-097 / `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-089（相互参照）。
