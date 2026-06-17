# CI fix mirror — baseline-stale は visual-full のみ・smoke/e2e は実 fail（SP-DEVSYNC-143-(3) 訂正）

- 日付: 2026-06-14
- ブランチ: `feat/admin-dashboard-jp-clarity-and-card-ux`（sub-worktree wt-9）/ PR #1222 / 修正 commit `469c47c29`
- 新規 lesson: SP-DEVSYNC-144（aiworkflow-requirements L-DEVSYNC-144 が正本）

## 仕様書 Phase 11「CI 失敗解消」節への訂正

SP-DEVSYNC-143-(3) の baseline-stale 切り分けは `visual-full`（`toHaveScreenshot` のみの job）限定で、`playwright-smoke`/`e2e` へ拡大してはならない。UI 変更で component の DOM 構造/testid/文言が変わると、それを参照する Playwright assertion spec は spec ファイル非 touch でも fail する（本件 = smoke の axe `listitem` 違反・e2e の `getByTestId`/`getByText` drift）。

### 反映項目

1. **job 種別で分岐を明記**: `visual-full`（描画が変われば必ず diff・コードは正しい → baseline-stale 候補）／`smoke`・`e2e`（axe・testid・文言・role を直接 assert → 同じ UI 変更が実 fail）。
2. **artifact 開封を手順化**: `gh run view --log` 空時は `gh run download <runId> --name <artifact>` → smoke=`playwright-smoke-report/results.json`、e2e=monocart `index.json`、visual-full=`visual-full-<vp>-diff` の `*-diff.png` slug。`error.message` に axe JSON / 期待文字列が露出。
3. **Vitest 更新済 ≠ Playwright 更新済**: リネーム後は Phase 5 実装手順に `grep -rn <旧testid> <旧文言> apps/web/playwright` で Playwright 残存参照を洗う工程を追加。
4. **baseline 再生成**: `playwright-visual-baseline-update.yml` を `--ref <branch>` 起動 → `visual-baseline-approval` 承認ゲート → HEAD から再生成し直接 push。撮影元が HEAD ゆえ code/spec 修正 push 後に起動（順序）。

## 真因サマリ（3 job 分岐）

- smoke = `/admin` axe `listitem` serious（`StatusDistribution.tsx` `<ul role="img">`+`<li>` → `<div>` 化で根治）
- e2e = `issue-819` 旧 testid `status-distribution-chart`→`list` + `task15` 旧文言「未対応」→「要対応」
- visual-full = 全 vp `admin` slug のみ diff = 意図的再設計の baseline staleness（workflow 起動・承認待ち run 27484887787）

## 参照

- aiworkflow-requirements `lessons-learned-dev-sync-merge-conflict-resolution-2026-05` L-DEVSYNC-144（正本）
- SP-DEVSYNC-143（訂正対象の 143-(3)・no-op sync 判定 143-(1)(2) は有効維持）
