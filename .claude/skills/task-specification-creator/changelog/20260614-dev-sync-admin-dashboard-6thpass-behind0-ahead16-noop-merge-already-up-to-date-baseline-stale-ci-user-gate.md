# dev sync mirror — admin-dashboard-jp-clarity-and-card-ux 6th-pass（no-op merge / baseline-stale CI user-gate）

- 日付: 2026-06-14
- ブランチ: `feat/admin-dashboard-jp-clarity-and-card-ux` ← `origin/dev`（sub-worktree wt-9・**0 behind / 16 ahead**・6th-pass）
- merge: no-op（`Already up to date.`・merge commit 不生成）
- 新規 lesson: SP-DEVSYNC-143（aiworkflow-requirements L-DEVSYNC-143 が正本）

## 仕様書 Phase 5/11 への含意

1. **no-op 再 sync の確定基準を先頭に置く**: `git rev-list --left-right --count HEAD...origin/dev` が `N	0`（behind 0）かつ `HEAD...@{u}` が `0	0`（upstream 同期）なら `git merge origin/dev` は `Already up to date`（merge commit 不生成）が期待値。conflict 不在は健全で「失敗・再試行要」と書かない。実成果物は skill 反映の docs commit のみ。
2. **ローカル dev ref FF 不可の据え置き条件**: メインWT が dev を別セッション未コミット作業で dirty にし `git fetch origin dev:dev` が `refusing to fetch into branch 'dev' checked out at` で拒否される場合、メインWT working tree 非接触（out-of-scope WT 破壊禁止）。各未コミットファイルの `git -C <mainWT> diff origin/dev -- <f>` 非空を確認して別セッション進行中と判定し dev ref behind を cosmetic 残置（DoD に dev ref 0/0 を含めない）。
3. **🔴baseline-stale CI の 2 点切り分け**: `visual-full`+`playwright-smoke`+`e2e`+`e2e-tests-coverage-gate` 同時 fail を見たら (a) `gh run list --branch dev --workflow=playwright-smoke.yml`／`playwright-visual-full` の dev HEAD `conclusion=success`、(b) `git diff origin/dev...HEAD --name-only | grep -E 'playwright|\.spec\.'` が `apps/web/playwright/**` 非 touch（Vitest spec のみ）で「意図的 UI 変更 baseline 陳腐化」を確定。sync/docs commit/code fix で解消不能・Linux PNG 再生成は baseline-update `workflow_dispatch`（外向き CI）ゆえ user-gated。`e2e-tests-coverage-gate` は e2e 依存 downstream で連動回復。DoD に「baseline-stale fail は code fix 対象外・user-gate 委譲・no-op sync で『解消した』と報告しない」を逐語化。

## 参照

- aiworkflow-requirements `lessons-learned-dev-sync-merge-conflict-resolution-2026-05` L-DEVSYNC-143（正本）
- SP-DEVSYNC-131（ローカル dev ref FF 不可時 origin/dev 直接マージの正本）, SP-DEVSYNC-138（lock 待機 + read-only 先行調査）
- MEMORY `project_responsive_mobile_tablet_ui_fixes_pr_created`（意図的 UI 変更 PR の visual fail = baseline stale の一次記録）
