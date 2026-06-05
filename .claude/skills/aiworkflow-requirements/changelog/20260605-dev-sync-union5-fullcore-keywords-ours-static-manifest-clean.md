# dev sync: union 5 = 全 aiworkflow コア（SKILL.md + map 3 + task-workflow-active）+ keywords.json `--ours`・tag CRUD spec 取込でも static-manifest drift なし（2026-06-05）

- 日時: 2026-06-05
- ブランチ: `docs/issue-1080-bulk-tag-result-member-labels-spec` ← `dev`（sub-worktree wt-17・**7 behind / 2 ahead**、ローカル dev = origin/dev 一致で dev 同期は no-op・独自コミット 0）
- 関連: `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-101**（新規）/ `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` **SP-DEVSYNC-091**（新規）
- 事象: `git merge dev --no-edit` 後の content CONFLICT は 6 file:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（派生物 = `--ours`）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - （`SKILL-changelog.md` / `LOGS/_legacy.md` / `lessons-learned/*.md` は git auto-merge で衝突回避）
  - 取込 7 コミット: #1122（issue-1070 tag reactivate + physical delete）/ #1132（issue-1076 member OG design token 整合）/ #1123（issue-1069 tag code rename）/ #1121（issue-1068 admin tag inline 作成導線）/ #1120（issue-1065 cookie 命名 SSOT）/ #1115（admin 開催日 404 + 出席 UX）/ #1114（issue-1063 cookie Secure）
- 解消: `pnpm sync:resolve` 1 回で **`union-resolving 5 files`**（aiworkflow コア 5 = SKILL.md + quick-reference + resource-map + topic-map + task-workflow-active）+ **`taking --ours for 1 derived files: keywords.json`** + 内部 `pnpm indexes:rebuild` を完遂。`WARN unhandled` 行なし exit 0・手動編集/追加スクリプト不要。
- **核心データポイント（L-DEVSYNC-099 の境界事例＝negative confirmation）**: 取込デルタは #1122/#1123 で `01-api-schema.md`（tag master CRUD spec）を変更しているにもかかわらず、merge 後 `pnpm verify:static-manifest` は `[verify-static-manifest] OK`（drift 0）でパスした。dev 側が spec 変更と同一デルタ内で `static-manifest.json` を既に再生成済（`tagDefinitions.ts` / `static-manifest.json` は `UU` でなく `M`＝git auto-merge で整合版を取込）だったため、取込 feature 側に hash drift が残らなかった。L-DEVSYNC-099 の「`01-api-schema.md` が取込デルタに含まれると `sourceSpecHashDrift` で CI fail」は、**upstream が manifest を再生成していない場合に限り顕在化する条件付き故障**であり、本件のように upstream が spec と manifest を同伴 land していれば `regenerate:static-manifest` 1 手は不要、と境界を確定。ただし「`01-api-schema.md` が delta に含まれたら `verify:static-manifest` を必ず確認する」運用自体は L-DEVSYNC-099 通り維持（drift 有無は実行して初めて分かる）。
- 検証順: `git fetch --prune origin`（dev=origin/dev 一致・独自コミット 0）→ `git rev-list --left-right --count origin/dev...HEAD` = 7/2 → `git merge dev --no-edit` で CONFLICT 6（上記）→ `pnpm sync:resolve`（`union-resolving 5 files` + `--ours` 1 + rebuild + `all skill / index conflicts resolved`）→ `git diff --name-only --diff-filter=U` = 0 / 実マーカー `<<<<<<<`・`>>>>>>>` 0 件 → **`pnpm verify:static-manifest` OK（drift 0・regenerate 不要）** → `pnpm typecheck`（7 packages 全 Done）→ `pnpm lint`（exit 0）→ `git commit --no-edit`（lefthook: main-branch-guard / lefthook-edit-guard / block-test-suffix / staged-task-dir-guard（MERGE_HEAD で auto-skip）/ block-stable-key-update 全 pass）→ merge commit `e8b397ed9`。CI failure なし。
- データポイント（member 構成の振動則の追認）: union 集合は L-DEVSYNC-097 の union 5（aiworkflow コア丸ごと + keywords `--ours`）と member 完全一致。件数 5 + keywords 衝突は L-DEVSYNC-097 の再現で、新規性は「同一 union member でも取込デルタが tag CRUD spec を含み得る／含んでも static-manifest が drift しないケースがある」という直交軸の追加。`union-resolving N files` の N と `--ours` 行はログで実確認するのが正運用。
- 反映先: `aiworkflow-requirements/lessons-learned/...-2026-05.md` L-DEVSYNC-101 / `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-091（相互参照）。
