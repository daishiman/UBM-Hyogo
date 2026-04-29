# link-checklist — Phase 11 関連リンク整合確認

> 本ワークフローは仕様書整備のみ。本 checklist は仕様書整備時点で `index.md` / `artifacts.json` / 各 phase / aiworkflow refs の相互リンク健全性を確認する。実走 PR でも同 checklist を再実行する。

## 1. 確認方針

- 各リンクは worktree のファイルが実在することを Read 系で確認する。
- 実ファイルと仕様書記述に矛盾がある場合は `discovered-issues.md` に転記する。
- `git ls-files` ではなく実ファイル存在を直接確認する（A-1 で untracked 化した派生物は対象外）。

## 2. ワークフロー内リンク

| # | パス | 状態 |
| --- | --- | --- |
| 1 | docs/30-workflows/skill-ledger-t6-hook-idempotency/index.md | [x] 存在 / メタ情報・AC・Phase 一覧が `artifacts.json` と一致 |
| 2 | docs/30-workflows/skill-ledger-t6-hook-idempotency/artifacts.json | [x] 存在 / phases[].outputs と実ファイルが一致 |
| 3 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-01.md | [x] 存在 / outputs/phase-01/main.md にリンク |
| 4 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-02.md | [x] 存在 / smoke 系列が outputs/phase-02/main.md と一致 |
| 5 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-03.md | [x] 存在 / 代替案 4 案 + PASS/MINOR/MAJOR を含む |
| 6 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-04.md 〜 phase-13.md | [x] 存在 / 各 outputs path が `artifacts.json` と一致 |
| 7 | outputs/phase-01/main.md | [x] 存在 |
| 8 | outputs/phase-02/main.md | [x] 存在 |
| 9 | outputs/phase-03/main.md | [x] 存在 |
| 10 | outputs/phase-11/{main,manual-smoke-log,manual-test-checklist,manual-test-result,link-checklist,discovered-issues}.md | [x] 全 6 件存在 |
| 11 | outputs/phase-11/screenshot-plan.json | [x] 存在（NON_VISUAL タスクのスクリーンショット不要判定） |
| 12 | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md | [x] 全 7 件存在 |
| 13 | outputs/phase-13/main.md | [x] 存在（PR 本文案 / NOT EXECUTED） |

## 3. 上位ワークフロー / 原典スペック

| # | パス | 状態 |
| --- | --- | --- |
| 14 | docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md | [x] 存在 / T-6 原典スペックと AC-1〜AC-11 が整合 |
| 15 | docs/30-workflows/skill-ledger-a1-gitignore/index.md | [x] 存在 / 上流 A-1 |
| 16 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | [x] 存在 / state ownership 表の引用元 |
| 17 | docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/unassigned-task-detection.md | [x] 存在 / T-6 検出根拠 |
| 18 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | [x] 存在 / 派生物境界 |
| 19 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md | [x] 存在 / A-2 原典 |

## 4. 正本仕様（aiworkflow-requirements）

| # | パス | 状態 |
| --- | --- | --- |
| 20 | .claude/skills/aiworkflow-requirements/references/skill-ledger-fragment-spec.md | [x] 存在 / A-2 fragment 化の正本 |
| 21 | .claude/skills/aiworkflow-requirements/references/skill-ledger-gitignore-policy.md | [x] 存在 / A-1 で確立した派生物境界 |
| 22 | .claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md | [x] 存在 / B-1 連携 |
| 23 | .claude/skills/aiworkflow-requirements/references/technology-devops-core.md | [x] 存在 / hook 運用正本 |

## 5. プロジェクト共通

| # | パス | 状態 |
| --- | --- | --- |
| 24 | CLAUDE.md | [x] hook 方針（post-merge index 再生成廃止 / `pnpm indexes:rebuild` / CI gate）が `phase-01/02/03/main.md` と整合 |
| 25 | lefthook.yml | [x] 存在 / 本 PR では編集していない（実 hook 編集は別 PR） |
| 26 | scripts/new-worktree.sh | [x] 存在 / smoke 系列で参照 |

## 6. GitHub 連携

| # | 項目 | 状態 |
| --- | --- | --- |
| 27 | Issue #161 | [x] CLOSED のまま参照のみ（再起票していない） |
| 28 | Issue #129 (A-1) | [x] 既に CLOSED |
| 29 | Issue #130 (A-2) | [x] 状態を実走 PR 着手前に再確認 |

## 7. 完了判定

すべてのチェックボックスが ✓ になり、矛盾が `discovered-issues.md` に記録されていない場合のみ Phase 12 へ進む。
