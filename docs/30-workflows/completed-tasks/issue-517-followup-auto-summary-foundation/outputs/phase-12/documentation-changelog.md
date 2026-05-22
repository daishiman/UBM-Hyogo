# Documentation Changelog

Changed in this cycle:

- Added Slack channel bootstrap wording to `index.md`, `phase-01.md`, `phase-02.md`, `phase-03.md`, `phase-04.md`, `phase-05.md`, `phase-11.md`, `phase-12.md`, and `phase-13.md`.
- Normalized Phase 12 output names to strict filenames.
- Added Phase 12 strict output files under `outputs/phase-12/`.
- Added `scripts/post-release-dashboard/README.md`.
- Synced `deployment-gha.md`, aiworkflow-requirements changelog, SKILL changelog, and both skill LOGS.

Indexes:

- `pnpm indexes:rebuild` completed successfully.
- Generated: `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- Generated: `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- Manual reverse-index entries were added to `quick-reference.md`, `resource-map.md`, and `task-workflow-active.md` because the generator indexes reference topics but does not synthesize workflow-root summary rows.

Phase-12 監査追補（時系列）:

1. `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-517-followup-auto-summary-2026-05.md` を新規作成（本サイクルで得た教訓を lessons-learned として正本化）。
2. `.claude/skills/aiworkflow-requirements/references/workflow-issue-517-followup-auto-summary-foundation-artifact-inventory.md` を新規作成（ワークフロー成果物 inventory を正本化）。
3. `.claude/skills/github-issue-manager/references/scheduled-pr-idempotency.md` を新規作成（scheduled PR の冪等性ポリシーを正本化）。
4. `.claude/skills/github-issue-manager/SKILL.md` を更新（Anchors / Trigger / references 表に scheduled-pr-idempotency を追加）。
5. `docs/30-workflows/unassigned-task/task-issue-517-slack-bootstrap-001.md` を新規作成（user-gated Slack bootstrap を未タスク化）。
6. `docs/30-workflows/unassigned-task/task-issue-517-30day-runtime-evidence-001.md` を新規作成（30 day gate runtime evidence を未タスク化）。
7. Phase-12 `implementation-guide.md` を改訂（Part 1 を中学生レベル日本語化、C12P2-1 〜 C12P2-5 タグを追加）。
