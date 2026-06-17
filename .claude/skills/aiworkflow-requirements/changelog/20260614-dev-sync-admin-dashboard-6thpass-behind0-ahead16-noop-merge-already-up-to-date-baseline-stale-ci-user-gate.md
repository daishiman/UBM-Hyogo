# dev sync — admin-dashboard-jp-clarity-and-card-ux 6th-pass（no-op merge / baseline-stale CI user-gate）

- 日付: 2026-06-14
- ブランチ: `feat/admin-dashboard-jp-clarity-and-card-ux` ← `origin/dev`
- worktree: sub-worktree wt-9（`task-20260611-085747-wt-9`）
- 位置: **0 behind / 16 ahead**（前 pass `21e1b9926`(5th) に続く同一指示 6th-pass）
- merge: **no-op（`git merge origin/dev --no-edit` = `Already up to date.`・merge commit 不生成）**
- 新規 lesson: L-DEVSYNC-143 / SP-DEVSYNC-143

## 事象

同一ブランチへの 6 回目の sync 指示。前 pass（L-DEVSYNC-142・merge `21e1b9926`・#1228 ホーム画面日本語化取込）で origin/dev `e1f9e21ef` を既に内包済み。その後の skill-sync 2 commit で ahead が 14→16 に増えただけで、origin/dev 側は #1228 から不変。

- `git merge origin/dev --no-edit` → `Already up to date.`（exit 0・`git status --porcelain` 0 件・merge commit なし）
- `git rev-list --left-right --count HEAD...origin/dev` = `16	0`（behind 0 = ブランチが origin/dev 完全内包）
- `git rev-list --left-right --count HEAD...@{u}` = `0	0`（upstream 同期済み）

ローカル `dev` ref は origin/dev に 0/1（独自 0・FF 可能）だが、メインWT が `dev` を別セッションの未コミット skill 編集 4 件で dirty にしており `git fetch origin dev:dev` が `refusing to fetch into branch 'dev' checked out at <mainWT>` で拒否。

CI（`gh pr checks 1222`）: `visual-full`(desktop/mobile/tablet) + `playwright-smoke`(19-route) + `e2e`(chromium/firefox/webkit) + `e2e-tests-coverage-gate` が fail、その他（typecheck/lint/coverage/verify 系）は pass。

## 判定と対応

### L-DEVSYNC-143-A（no-op 再 sync の確定）
`HEAD...origin/dev` が `N	0` かつ `HEAD...@{u}` が `0	0` ＝ merge は実体変化なし・push も新規 commit なし。`Already up to date.` は正常収束であり conflict 不在を「やり残し」と誤読しない。sync の実成果物は skill 反映の docs commit のみ。ahead 増（14→16）は skill-sync commit 由来で intake 由来ではない。

### L-DEVSYNC-143-B（ローカル dev ref FF 不可は out-of-scope WT 起因なら据え置き）
メインWT 未コミット 4 件（`aiworkflow-requirements/SKILL-changelog.md` / 同 `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` / `task-specification-creator/SKILL-changelog.md` / 同 `lessons-learned/dev-sync-merge-conflict-resolution.md`）は各 `git -C <mainWT> diff origin/dev -- <f>` が非空（= origin/dev 未反映の独自編集）＝別セッション進行中。メインWT working tree を stash/checkout/discard するのはスコープ外 WT 破壊ゆえ非接触。ブランチが既に origin/dev を内包しているので dev ref behind 1 は cosmetic として最終レポート明示・強制 FF しない（L-DEVSYNC-134 / 136-B の系）。

### 🔴L-DEVSYNC-143-C（baseline-stale CI は sync で解消しない・2 点切り分け）
- (1) `gh run list --branch dev --workflow=playwright-smoke.yml --json conclusion` と `playwright-visual-full` が dev HEAD `e1f9e21ef` で `success`
- (2) `git diff origin/dev...HEAD --name-only | grep -E 'playwright|\.spec\.'` が `apps/web/playwright/**`（visual/smoke/e2e spec）を非 touch（touch は Vitest component spec 6 件のみ: `KpiGrid.spec.tsx` / `RecentActionsTable.spec.tsx` / `_dashboard/StatusDistribution.spec.tsx` / `_dashboard/__tests__/SchemaAlertCard.spec.tsx` / `_dashboard/__tests__/ZoneDistribution.spec.tsx` / `lib/admin/__tests__/dashboardGlossary.spec.ts`）

2 点が揃うため「意図的 UI 変更（管理ダッシュボード日本語化 + カード化 + 公開ステータス横バー化）による baseline 陳腐化」と確定。これは sync-merge でも docs commit でも code fix でも解消不能。Linux PNG baseline 再生成は Playwright baseline-update workflow の `workflow_dispatch`（外向き CI 操作）ゆえ **user-gated**。`e2e-tests-coverage-gate` は e2e 成功依存の downstream ゆえ e2e baseline 解消で連動回復する。

## 検証

- `git merge origin/dev --no-edit` = `Already up to date.`（status 0・merge commit 0）
- `git rev-list --left-right --count HEAD...origin/dev` = `16 0` / `HEAD...@{u}` = `0 0`
- メインWT dev 未コミット 4 件は各 `diff origin/dev` 非空 → dev ref FF 据え置き・非接触
- CI baseline-stale 確定（dev HEAD で playwright workflow success + ブランチ playwright 非 touch）→ user-gate 委譲
- skill 反映の docs commit のみ作成し push

## 参照

- L-DEVSYNC-142（同一ブランチ前 pass・#1228 取込で origin/dev 内包達成）
- L-DEVSYNC-134 / 136-B（ローカル dev ref FF 不可時に origin/dev 直接マージで代替・dev ref behind を DoD に含めない正本）
- MEMORY `project_responsive_mobile_tablet_ui_fixes_pr_created`（意図的 UI 変更 PR の visual fail = baseline stale・baseline-update workflow user 承認待ちの一次記録）
- task-specification-creator `dev-sync-merge-conflict-resolution` SP-DEVSYNC-143（task-spec 版）
