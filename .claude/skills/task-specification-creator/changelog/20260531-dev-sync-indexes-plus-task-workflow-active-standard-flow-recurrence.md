# dev sync: indexes 3 map + task-workflow-active の UU は `pnpm sync:resolve` 単独で完結（再現確認 2026-05-31）

- 日時: 2026-05-31
- ブランチ: `feat/issue-1006-members-selected-filters-chip-ux-hardening` ← `dev`
- 関連: `aiworkflow-requirements/changelog/20260531-dev-sync-indexes-plus-task-workflow-active-standard-flow-recurrence.md`
- 事象: `git merge dev --no-edit` 後に CONFLICT(content) が次の 4 ファイルのみ:
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
  - （`indexes/keywords.json` と `SKILL-changelog.md` は `.gitattributes merge=union` で auto-merge、コンフリクトせず）
- 解消: `pnpm sync:resolve` のみで完結（`.md` 4 ファイルは union 採用 → `pnpm indexes:rebuild` で keywords/topic 再生成）。手動編集・追加スクリプト不要。`apps/**` の UU は 0 件のため手動解消フェーズへ進まなかった。
- 検証順: `pnpm sync:resolve` → 残 UU 0 件確認 → `git add -A && git commit --no-edit`（lefthook pre-commit: main-branch-guard / block-test-suffix / staged-task-dir-guard / block-stable-key-update すべて pass）→ `pnpm install`（exit 0）→ `pnpm typecheck`（全 6 package Done）→ `pnpm lint`（exit 0）で all green。
- CI failure は発生せず。lint の `stablekey-literal-lint` 警告（`PublicConsentCallout.tsx` の `"publicConsent"` literal 2 件）は dev 側既存コード由来かつ `mode=warning` の非ブロッキングで、本マージで持ち込んだものではない。
- 教訓（コンフリクトマーカー検証のピットフォール）: `grep -rn '<<<<<<<' ... | head` のように grep をパイプすると、`$?` がパイプ末尾の `head`（常に 0）の終了コードになり「マッカー残存なし」と誤判定する。残存検証は `git diff --name-only --diff-filter=U` と `git ls-files -u | wc -l`（unmerged path 0）を正本にし、grep はパイプなしで補助確認する。
- 反映先（本 skill 側）: `references/pr-pre-flight-ci-gate-checklist.md` の sync-merge 節へ「UU が skill indexes 3 map + `references/task-workflow-active.md` のみの場合も `pnpm sync:resolve` 1 コマンドで full resolve 可能（`20260522` の indexes-only パターンの拡張）。残 UU は grep ではなく `git ls-files -u` で確認」を追記候補として記録。
