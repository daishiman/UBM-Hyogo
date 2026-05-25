# dev sync: skill indexes 4 種 + `task-workflow-active.md` の UU は `pnpm sync:resolve` 1 発で full resolve（再発確認）

- 日時: 2026-05-25
- ブランチ: `docs/issue-864-admin-staging-runtime-smoke-ci-gate-spec` ← `origin/dev`
- 事象: `git merge origin/dev` で UU が次の 5 ファイル（前回 `20260522-*-standard-flow` に `task-workflow-active.md` が 1 件加わったのみ・本質は同一カテゴリ）:
  - `.claude/skills/aiworkflow-requirements/indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}`
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- 解消: `pnpm sync:resolve` 単独で完結（`.md` 系 union + `keywords.json` `--ours` 後 `pnpm indexes:rebuild`）。手動編集ゼロ。
- pr-pre-flight への含意: `references/pr-pre-flight-ci-gate-checklist.md` に既載の「UU が skill indexes / `task-workflow-active.md` のみなら `pnpm sync:resolve` で full resolve」フローが今回も成立。`apps/**` や `docs/30-workflows/**` の UU が混じった場合のみ手動解消フェーズへ進む既存判断基準を継続。
- 関連: `aiworkflow-requirements/changelog/20260525-dev-sync-indexes-plus-task-workflow-active-recurrence.md`
- 再現#2 (同日): ブランチ `docs/issue-872-google-brand-4tone-icon-spec` ← `origin/dev` でも同一カテゴリの UU（aiworkflow-requirements の SKILL.md + 4 indexes + `references/task-workflow-active.md`）+ `docs/30-workflows/LOGS.md`（`.gitattributes` の `merge=union` で自動結合）。`pnpm sync:resolve` 1 発で full resolve、手動編集ゼロ。`apps/**` の UU は今回も発生せず（dev 側 add のみで current ブランチ未触のため auto-merge）。判断基準の再強化: 「UU が skill indexes / `task-workflow-active.md` / `SKILL.md` に限定 + `apps/**` 未混入」なら手動フェーズ不要。
