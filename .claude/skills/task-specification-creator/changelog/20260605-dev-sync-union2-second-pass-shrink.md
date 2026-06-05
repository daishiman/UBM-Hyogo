# dev sync: 同一ブランチ二度目 sync で union 2（SKILL.md + topic-map）へ縮退・keywords `--ours` 発火（2026-06-05）

- 日時: 2026-06-05
- ブランチ: `docs/issue-1076-member-og-design-token-alignment-spec` ← `dev`（1 behind / 4 ahead、ローカル dev = origin/dev 一致で dev 同期は no-op）
- 関連: `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-098（新規）/ `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-086（既存・2026-06-05 再現を追記）
- 事象: `git merge dev --no-edit` 後の content CONFLICT は 3 file:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（派生物 = `--ours`）
  - （`indexes/{quick-reference,resource-map}.md` / `references/task-workflow-active.md` / `SKILL-changelog.md` / `LOGS/_legacy.md` / `lessons-learned/*.md` は git auto-merge で衝突回避）
  - 取込 1 コミット: #1121（admin 会員ドロワーにタグ inline 作成導線 Refs #1068）
- 解消: `pnpm sync:resolve` 1 回で `union-resolving 2 files`（SKILL.md + topic-map.md）+ `taking --ours for 1 derived files: keywords.json` + 内部 `pnpm indexes:rebuild`（5402 キーワード）を完遂。手動編集・追加スクリプト不要。merge commit `c70726663` 後の確認 `pnpm indexes:rebuild` は drift 0。
- 検証順: `pnpm sync:resolve` → `git diff --name-only --diff-filter=U` = 0 / 実マーカー `<<<<<<<`・`>>>>>>>` 0 件 → `git commit --no-edit`（lefthook 全 pass・MERGE_HEAD で staged-task-dir-guard auto-skip）→ `pnpm typecheck`（7 packages 全 Done）→ `pnpm lint`（exit 0）→ `pnpm indexes:rebuild` drift 0 で all green。CI failure なし。
- データポイント（union 件数の振動則の更新）: 同一ブランチでも一度目 sync（L-DEVSYNC-097・union 5 = aiworkflow コア丸ごと）→二度目 sync（本件・union 2）と振れる。L-DEVSYNC-096 で「union 3 が下限」と記録していたが本件で **union 2 を実測** → 実測レンジは 2〜6 に拡大。二度目以降は取込デルタが浅まり union member が縮退するが、keywords.json は累積追記を反映するため独立に衝突して `--ours` 発火しうる（union コア縮退と keywords 衝突有無は独立軸）。件数を予測せず `union-resolving N files` の N と `--ours` 行をログで実確認するのが正運用。
- 反映先: `aiworkflow-requirements/lessons-learned/...-2026-05.md` L-DEVSYNC-098（新規）/ `task-specification-creator/lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-086（再現追記）。
