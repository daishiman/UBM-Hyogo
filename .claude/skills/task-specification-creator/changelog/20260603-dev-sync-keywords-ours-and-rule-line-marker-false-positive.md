# dev sync: keywords.json `--ours` 3 ファイル CONFLICT を `pnpm sync:resolve` 単独完結 + `=` 罫線 false-positive（2026-06-03）

- 日時: 2026-06-03
- ブランチ: `fix/shell-collapse-cookie-secure-attribute` ← `dev`（6 behind / 2 ahead、ローカル dev = origin/dev 済で dev 同期は no-op）
- 関連: `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-037（5 回目事例）/ `lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-012 事例
- 事象: `git merge dev --no-edit` 後の content CONFLICT は次の 3 ファイルのみ:
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（派生物 = `--ours`）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - （`indexes/{quick-reference,resource-map}.md` / `SKILL-changelog.md` / `LOGS/_legacy.md` は git auto-merge で衝突回避）
- 解消: `pnpm sync:resolve` 1 回で union 2 + `--ours` 1 + 内部 `pnpm indexes:rebuild`（keywords 5362 件）を完遂。手動編集・追加スクリプト不要。merge commit `95fea5b08` 後の確認 `pnpm indexes:rebuild` は drift 0 で chore(indexes) 分離不要。
- 検証順: `pnpm sync:resolve` → `git ls-files -u | wc -l` = 0 → `git add -A && git commit --no-edit`（lefthook: lefthook-edit-guard / block-test-suffix / staged-task-dir-guard（MERGE_HEAD で auto-skip）/ block-stable-key-update 全 pass）→ `pnpm install`（exit 0）→ `pnpm typecheck`（全 package Done）→ `pnpm lint`（exit 0）→ `pnpm indexes:rebuild` drift 0 で all green。CI failure なし。
- 教訓（`=` 罫線 false-positive の具体実例）: 残存マーカー確認で素朴な `git grep -lE '^(<<<<<<<|=======|>>>>>>>)'` を回すと `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-11/manual-smoke-log.md` が 1 件ヒットするが、実体は L24/L26 の **60 個 `=` の markdown 罫線**で前方一致 `=======` に誤マッチしただけ。実マーカー（`<<<<<<<` / `>>>>>>>`）は 0 件で `git show HEAD:<file>` / `git show origin/dev:<file>` 両方に同罫線が存在しマージ非変更。**残存判定は `git ls-files -u | wc -l` = 0 を正本にし、grep を使うなら `^=======$` 完全一致**（罫線長 7 超の区切り線を素朴前方一致は必ず拾う）。
- 反映先: `lessons-learned/dev-sync-merge-conflict-resolution.md` SP-DEVSYNC-012 事例リスト末尾に 2026-06-03 再現を追記。aiworkflow-requirements L-DEVSYNC-037 と相互参照。
