# dev sync: skill indexes のみが UU の場合は `pnpm sync:resolve` 単独で完結する

- 日時: 2026-05-22
- ブランチ: `feat/step-06-meetings-attendance-confirm-dialog` ← `dev`
- 関連: `aiworkflow-requirements/changelog/20260522-dev-sync-skill-indexes-only-conflict-standard-flow.md`
- 事象: `git merge dev` 後に UU が次の 4 ファイルのみ:
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- 解消: `pnpm sync:resolve` のみで完結（`.md` は union 採用、`keywords.json` は `--ours` + `pnpm indexes:rebuild` で再生成）。手動編集・追加スクリプトは不要。
- 検証順: `pnpm sync:resolve` → `git commit --no-edit` (lefthook pre-commit pass) → `pnpm typecheck` → `pnpm lint` で all green。
- 反映先（本 skill 側）:
  - `references/pr-pre-flight-ci-gate-checklist.md` への追記候補: 「UU が skill indexes 4 種のみの場合は `pnpm sync:resolve` 1 コマンドで full resolve 可能。`apps/**` や `docs/30-workflows/**` の UU が混在する場合のみ手動解消フェーズに進む」を明文化候補として記録。
