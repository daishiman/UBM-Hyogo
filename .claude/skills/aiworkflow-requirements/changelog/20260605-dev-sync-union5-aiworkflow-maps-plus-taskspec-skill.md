# dev sync: union 5 = aiworkflow（SKILL.md + map 3）+ task-specification-creator/SKILL.md の 2 スキル横断 SKILL.md 同時衝突（2026-06-05）

- 日時: 2026-06-05
- ブランチ: `docs/issue-1079-bulk-tag-audit-batch-filter-spec` ← `dev`（5 behind / 2 ahead、ローカル dev = origin/dev 一致で dev 同期は no-op）
- 関連: `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-099（新規）/ `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-090（新規）
- 事象: `git merge dev --no-edit` 後の content CONFLICT は 6 file:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（派生物 = `--ours`）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/task-specification-creator/SKILL.md`（union）← **本スキルではない第 2 スキルの SKILL.md が同一 batch で同時衝突**
  - （`references/task-workflow-active.md` は今回 Auto-merging 側へ転び衝突せず。`SKILL-changelog.md` / `LOGS/_legacy.md` / `lessons-learned/*.md` は両スキルとも git auto-merge）
  - 取込 5 コミット: #1132（issue-1076 member OG design token）/ #1123（issue-1069 tag code rename）/ #1121（issue-1068 admin tag inline create）/ #1120（issue-1065 cookie 命名 SSOT）/ #1115（admin 開催日 404 + 出席 UX）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 5 files`（aiworkflow SKILL.md + quick-reference + resource-map + topic-map + **task-spec SKILL.md**）+ `taking --ours for 1 derived files: keywords.json` + 内部 `pnpm indexes:rebuild`（5402 キーワード）を完遂。手動編集・追加スクリプト不要。merge commit `2c7102b33` 後の確認 `pnpm indexes:rebuild` は drift 0 で chore(indexes) 分離不要。
- 検証順: `pnpm sync:resolve` → `git diff --name-only --diff-filter=U` = 0 / 実マーカー `<<<<<<<`・`>>>>>>>` 0 件 → `git commit --no-edit`（lefthook: staged-task-dir-guard（MERGE_HEAD で auto-skip）/ main-branch-guard / lefthook-edit-guard / block-test-suffix / block-stable-key-update 全 pass）→ `pnpm typecheck`（7 packages 全 Done）→ `pnpm lint`（exit 0・dep-cruiser 0 violations・verify-no-inline-style OK・stablekey OK）→ `pnpm indexes:rebuild` drift 0 で all green。CI failure なし。
- データポイント（member 構成の振動則の追認）: union 件数が L-DEVSYNC-097 と同じ 5 でも、内訳は task-workflow-active ⇄ task-spec/SKILL.md で 1 member 差し替わる。さらに本件は **2 スキルの SKILL.md が同一 merge batch で同時衝突**するという新軸を実測。件数（2〜6）も内訳もスキル分布も予測子にせず、`union-resolving N files` の N と `union-resolved <path>` 各行・`--ours` 行をログで実確認するのが正運用。全 member が `.gitattributes` の union/`--ours` 登録に閉じる限り resolver は集合・スキル非依存に exit 0 で畳む。
- 反映先: `aiworkflow-requirements/lessons-learned/...-2026-05.md` L-DEVSYNC-099 / `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-090（相互参照）。
