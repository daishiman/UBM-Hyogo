# System Spec Update Summary — Issue #350

## Step 1-A: SSOT 新規追加

- `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md`（新規）
- `docs/runbooks/post-release-long-term-observation.md`（新規 runbook）
- `.github/workflows/post-release-observation-reminder.yml`（新規 reminder workflow）
- `scripts/observation/`（新規 helper / template / local tests）

## Step 1-B: 既存 SSOT 更新

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` — Long-term Analytics Evidence に D+7/D+30 reminder workflow を接続
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` — Issue #350 active entry 追加
- `.claude/skills/aiworkflow-requirements/SKILL.md` / `changelog/20260506-issue350-long-term-observation.md` — 変更履歴追加
- `.claude/skills/aiworkflow-requirements/LOGS/20260506-issue350-long-term-observation.md` — usage / sync log 追加

## Step 1-C: indexes 更新

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` — Issue #350 / post-release long-term observation 行追加
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` — Issue #350 早見追加
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` — `pnpm indexes:rebuild` で `references/post-release-long-term-observation.md` を生成登録
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json` — `pnpm indexes:rebuild` で `D+7` / `D+30` / `長期観測` / `post-release observation` を含む検索語を登録

## Step 2（条件付き）: 関連 workflow trace 更新

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` — 該当行末尾に `consumed by issue-350-long-term-production-observation (2026-05-06)` 追記

## SKILL.md / SKILL-changelog.md 更新

aiworkflow-requirements skill の `SKILL.md` と `changelog/20260506-issue350-long-term-observation.md` に 1 行追記。task-specification-creator 側は本 cycle で更新不要。

## DoD

- [ ] 上記 path の変更が git diff に現れる
- [ ] `pnpm indexes:rebuild` が exit 0 で完了
- [ ] aiworkflow `verify-indexes-up-to-date` 相当の `git diff -- .claude/skills/aiworkflow-requirements/indexes` で意図した差分のみ確認済
