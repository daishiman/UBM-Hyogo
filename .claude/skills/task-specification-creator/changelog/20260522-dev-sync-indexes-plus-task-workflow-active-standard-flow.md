# dev sync: `indexes/**` + `references/task-workflow-active.md` の UU は `pnpm sync:resolve` 単独で完結

- 日時: 2026-05-22
- ブランチ: `feat/issue-806-dynamic-member-og-image` ← `dev`
- 関連: `aiworkflow-requirements/changelog/20260522-dev-sync-indexes-plus-task-workflow-active-standard-flow.md`
- 事象: branch-sync プロンプト実行中の `git merge origin/dev` で UU になったのは `.claude/skills/aiworkflow-requirements/` 配下のみ:
  - `indexes/keywords.json` (derived)
  - `indexes/quick-reference.md` (union)
  - `indexes/topic-map.md` (union)
  - `references/task-workflow-active.md` (union)
- 解消手順 (standard flow):
  1. `pnpm sync:resolve` → resolver スクリプトが union 採用 + `keywords.json` を `--ours` + `pnpm indexes:rebuild`
  2. `git add -A && git commit --no-edit` で merge コミット
  3. `pnpm typecheck` / `pnpm lint` all green を確認
- task-specification-creator への含意:
  - 過去 entry (`20260522-dev-sync-skill-indexes-only-conflict-standard-flow.md`) は「`indexes/**` のみ」と限定していたが、今回 `references/task-workflow-active.md` も同じ flow で機械解消されたことを確認。
  - dev-sync runbook で「skill 内 union 対象 (`indexes/**` + `references/task-workflow-active.md` + `LOGS/_legacy.md` + `SKILL-changelog.md` + `lessons-learned/*.md`) だけが UU の場合は `sync:resolve` 1 コマンドで完結」と一般化可能。
  - 意味的競合 (apps/** / docs/30-workflows/**) が無いケースは max-2-cycle guard 不要・evidence-step parity gate もスキップ対象。
