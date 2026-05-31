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

## L-VISBASE-004: snapshot 不一致は pixel diff だけでなく **画像サイズ不一致（`Expected an image WxH, received W'xH'`）** も同じ baseline-update path で解決 — feature が列/要素を増やしページ幅が変わる典型。bot push を待たず **実コミット（skill 反映等）を push** すれば close/reopen と同じく `pull_request` を再発火できる（2026-05-31 PR #1034 / issue-981 admin-members enrichment）

- 事象: PR #1034（`docs/issue-981-admin-members-table-list-enrichment`、MembersTable に occupation/ubmZone/ubmMembershipType/tags を描画）で `visual-full (tablet)` / `visual-full (mobile)` が fail、**desktop は pass**。失敗テストは `visual: admin-members › admin-members` の 1 route のみ。エラーは pixel diff ではなく **`Error: expect(page).toHaveScreenshot(expected) failed / Expected an image 931px by 1024px, received 957px by 1024px`** の **画像サイズ不一致**（tablet viewport 834px に対し enriched table が overflow しページ幅が 931→957px に増加）。
- 切り分けの要点（L-VISBASE-001 の拡張）:
  1. **サイズ不一致も snapshot-diff クラス**。`Expected an image WxH, received W'xH'` は pixel 比較以前の dimension mismatch で、`maxDiffPixels` 許容では救えない hard fail。だが真因は「feature がレイアウト寸法を変えた」ことなので、解決は pixel diff と同じく **baseline 再生成**（L-VISBASE-002）。runtime error ではない。
  2. **失敗が PR の touch surface に限定されるか**で feature 起因か回帰かを判定。本例は admin-members 1 route のみ = issue-981 の enrichment 面に一致 → 機能どおりの正当な変化。
  3. **dev sync-merge 起因かの切り分け**: merge 前 commit（`38ed52584`）の run でも `playwright-visual-full` は既に failure だった → merge は無罪、feature 実装そのものが baseline を stale 化していた。`gh run list --branch <b> --json headSha,name,conclusion -q '... select(.headSha=="<pre-merge-sha>")'` で過去 commit の結果を引いて確認する。
- bot push 後の必須 check 再走（L-VISBASE-003 の代替経路）:
  - L-VISBASE-003 は `gh pr close && gh pr reopen` を推奨するが、**skill 反映や docs 追記など実コミットを push する用事があるなら、その push 自体が `pull_request` を再発火**する（自分の push は GITHUB_TOKEN ではないため再帰防止対象外）。close/reopen と同じ効果を、履歴に意味のあるコミットを足しつつ達成できる。用事が無いときだけ close/reopen を使う。
  - 手順: baseline-update workflow 完走 → `git fetch && git merge --ff-only @{u}` で bot の baseline コミットをローカル同期 → 反映コミットを baseline コミットの上に積んで push → 最新 head 上で visual-full 含む全 `pull_request` workflow が再走。
- 留意: 本リポジトリの `visual-baseline-approval` environment は現状 reviewer 未設定のため dispatch 後ほぼ即進行し、`update-baseline` job（build + playwright install + 3 viewport regenerate + smoke regenerate + `.baseline-meta.json` 更新 + 直 push）で約 11 分。完了で `apps/web/playwright/tests/visual-full/` と `.../visual/` に `-linux.png` baseline が add-only 更新される。
- 事例: 2026-05-31 PR #1034。`gh workflow run playwright-visual-baseline-update.yml -f reason="..." -r docs/issue-981-...` → run `26696416766` success（11m5s）→ baseline コミット `6f781249d` 直 push → ローカル ff 同期 → skill 反映コミットを push して `pull_request` 再走。
- 参照: L-VISBASE-001（snapshot diff vs runtime error の一次切り分け）, L-VISBASE-002（baseline は Linux CI でしか正しく再生成できない・dispatch 経路）, L-VISBASE-003（bot GITHUB_TOKEN push は pull_request を再トリガーしない）。
