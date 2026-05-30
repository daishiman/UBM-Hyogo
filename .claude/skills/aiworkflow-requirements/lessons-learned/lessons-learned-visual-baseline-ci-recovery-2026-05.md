# lessons-learned: visual baseline CI 失敗の復旧手順（2026-05）

PR の `playwright-visual-full` が `toHaveScreenshot` diff で fail したときの、根本原因切り分けと baseline 再生成・CI 再走までの確定手順。レイアウトを変えた PR（header/footer 追加・primitive 差し替え等）で頻発する。

---

## L-VISBASE-001: `playwright-visual-full` fail の真因は「snapshot diff」か「runtime error」かを先に切り分ける

- 事象: PR #1014（`feat/task-c-privacy-terms-public-shell-spec`、privacy/terms に `PublicHeader`/`PublicFooter` 追加）で `visual-full (desktop/mobile/tablet)` が fail。job ログに `[WebServer] ./app/error.tsx` が大量に出ていたため一見 runtime error に見えたが、実際は **15 passed / 2 failed**（privacy / terms のみ）で error boundary には落ちていなかった。
- Why: `[WebServer] ...error.tsx` / `@sentry/node/...fastify` 等は `next build` / `next start` の **route 列挙・bundle トレースの stdout ノイズ**で、テスト失敗とは無関係。真因は末尾サマリの `Error: expect(page).toHaveScreenshot(expected) failed` と `2 failed / 15 passed`。
- How to apply:
  1. ログ抽出は `gh run view --job <id> --log | grep -iE "toHaveScreenshot|[0-9]+ passed|[0-9]+ failed|Error:"` で **サマリ行を先に読む**。`error|fail` の広い grep はビルドノイズを拾うので避ける。
  2. `N passed / M failed` で失敗が **PR が触った route に限定**されているなら snapshot diff（baseline 更新で解決）。全 route 失敗や 0 passed なら runtime error（コード修正が必要）を疑う。
  3. snapshot diff と確定したら L-VISBASE-002 の baseline 再生成へ。

## L-VISBASE-002: baseline は CI(Linux) 環境でしか正しく再生成できない — `playwright-visual-baseline-update.yml` を dispatch する

- 事象: baseline snapshot は `full-visual-<slug>-<viewport>-visual-full-chromium-<viewport>-linux.png` という **`-linux` suffix 付き**で、CI(ubuntu) のフォントレンダリングで生成されている。ローカル macOS で `--update-snapshots` しても、ファイル名は同じでもレンダリング差で CI 再 diff し再 fail する。
- How to apply:
  1. `gh workflow run playwright-visual-baseline-update.yml -f reason="<why>" --ref <feature-branch>` で起動。`reason` は required input。
  2. この workflow は `environment: visual-baseline-approval`（user approval gate）を持つ。required reviewer が設定されていれば承認待ちになる（`gh api repos/<o>/<r>/actions/runs/<id>/pending_deployments` で確認）。本リポジトリでは現状 reviewer 未設定で自動進行した。
  3. workflow は CI 上で `--update-snapshots` → `apps/web/playwright/tests/visual-full/` と `.../visual/` を `git add` → **source branch へ直 push**（`git push origin HEAD:<source-ref>`、`GITHUB_TOKEN` の `contents:write` で Ads bot push 制約を回避）。
  4. 完了後ローカルは `git pull --ff-only` で baseline を同期（add-only なので ff）。
- 留意: baseline 更新は CLAUDE.md で「visual baseline は user-gated」とされる operation。ユーザーが明示的に CI 解決を依頼した場合に限り dispatch する。レイアウト変更を伴わない PR では baseline 更新は不要（snapshot diff が出ないはず）。

## L-VISBASE-003: bot(GITHUB_TOKEN) の push は `pull_request` を再トリガーしない — close/reopen で最新 head に必須 checks を走らせる

- 事象: L-VISBASE-002 の workflow が baseline コミット `02b0d8b03` を直 push したが、PR の `statusCheckRollup` は **0 件**、commit combined status は `pending (0 statuses)`。`visual-full` を `workflow_dispatch` で起動すると success にはなるが、それは PR の `pull_request` checks には紐づかない。
- Why: GitHub の仕様で **`GITHUB_TOKEN` による push は新しい workflow（`on: pull_request` / `push`）をトリガーしない**（無限ループ防止）。よって baseline コミット上で required checks（本リポジトリは `ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate` の 5 つ。`gh api repos/<o>/<r>/branches/dev/protection/required_status_checks -q '.contexts[]'` で確認）が未実行のままになり、PR がマージ不能になる。
- How to apply:
  1. 最新 head sha に対する PR checks の有無を `gh pr view <n> --json statusCheckRollup -q '.statusCheckRollup | length'` で確認。0 なら `pull_request` 未発火。
  2. **`gh pr close <n> && gh pr reopen <n>`** で `pull_request`(reopened) を発火させ、最新 head（baseline コミット）上で全 `on: pull_request` workflow を再実行する。空コミット push より履歴を汚さず、`git push --force` も不要。
  3. `gh pr checks <n> --watch --interval 30` で全 green を待つ（e2e は ~18分かかるので background 実行が無難）。`--watch` は全 pass で exit 0、fail で exit 8。
- 留意: `workflow_dispatch` 起動の visual-full は「baseline が正しく通る」ことの **実証**には使えるが、PR の required check 反映には使えない。reopen 後に `pull_request` event で再走させること。
- 事例: 2026-05-29 PR #1014。baseline コミット `02b0d8b03` → close/reopen → `pull_request` 全 workflow 再走 → visual-full(desktop/mobile/tablet) + 必須 5 checks 含む全 check pass（`gh pr checks` exit 0）。
