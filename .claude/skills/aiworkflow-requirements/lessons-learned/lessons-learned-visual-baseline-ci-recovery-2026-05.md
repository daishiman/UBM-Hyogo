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

## L-VISBASE-005: visual baseline は **3 系統**あり、`playwright-visual-baseline-update.yml` が再生成するのは 2 系統だけ — `sidebar-shell-visual-*` が漏れると smoke の `visual (sidebar-shell …)` job だけ赤のまま残る（2026-06-01 docs/member-directory-form-reflection-and-admin-link-specs / member-publish-recovery ReflectionTimingNote + admin nav 14 化）

- 事象: `ReflectionTimingNote`(/members・/profile) 追加と admin nav の form-responses external link 追加（13→14）でページ寸法が変わり、`playwright-visual-full` と `playwright-smoke` が `toHaveScreenshot` diff で fail。`playwright-visual-baseline-update.yml` を dispatch して baseline 再生成 → `playwright-visual-full` は green になったが、**`playwright-smoke` の `visual (sidebar-shell desktop)` job だけ依然 fail**（`profile-1280.png` 1631→1719px / `admin-1280.png` 839→875px の diff）。
- 根本原因（baseline は 3 系統・更新 workflow は 2 系統しか触らない）: 本リポジトリの toHaveScreenshot baseline は 3 つの project family に分かれる:
  1. `visual-full-chromium-{desktop,tablet,mobile}` → `apps/web/playwright/tests/visual-full/**`（`playwright-visual-full` workflow）
  2. `visual-chromium` → `apps/web/playwright/tests/visual/**`（`playwright-smoke` の `visual (chromium, 4 screens)` job）
  3. `sidebar-shell-visual-{desktop,tablet,mobile}` → `apps/web/playwright/tests/sidebar-shell/**`（`playwright-smoke` の `visual (sidebar-shell …)` job、`needs: smoke`）
  ところが `playwright-visual-baseline-update.yml` は ①②しか `--update-snapshots` せず、③`sidebar-shell-visual-*` を再生成・commit していなかった。寸法変動が admin/profile shell に及ぶと ③ だけ取り残されて smoke が赤のまま残る。
- 解消（workflow 自体を拡張 → 再 dispatch）: `playwright-visual-baseline-update.yml` に `--project=sidebar-shell-visual-{desktop,tablet,mobile} --update-snapshots` step を追加し、commit step の `git add` に `apps/web/playwright/tests/sidebar-shell/` を追加。workflow 変更を push（workflow_dispatch は指定 ref 上の workflow 定義を使うため先に push 必須）→ baseline-update を再 dispatch → 3 系統一括再生成（②は既に最新なので diff 0、③の `admin-1280`/`profile-1280` が更新）→ bot baseline コミット `2c272cd60` を ff 同期 → 反映コミットを上に積んで push（L-VISBASE-003/004 の実 push 再走）→ `playwright-smoke`/`playwright-visual-full` を dispatch 検証して両 success。
- How to apply:
  - **L-VISBASE-005-A (寸法変動 PR では 3 系統すべてを確認)**: header/footer/nav 項目数/SLA note 等で shell 高さが変わる PR は、`visual-full` だけでなく `playwright-smoke` の `visual (chromium)` と `visual (sidebar-shell …)` の 3 job すべてが diff fail し得ると想定する。`gh run view <smoke> --log-failed` で **どの project の baseline が diff したか**（`*-visual-full-*` / `*-visual-chromium-*` / `*-sidebar-shell-visual-*`）を必ず特定し、再生成対象 project を漏らさない。
  - **L-VISBASE-005-B (baseline-update workflow の網羅性を毎回確認)**: baseline 再生成は `playwright-visual-baseline-update.yml` の `--project` 列挙が CI の全 visual project family を覆っているか確認してから dispatch する。覆っていなければ **workflow を先に拡張**（step 追加 + `git add` path 追加）→ push → dispatch。「dispatch したのに一部 job が赤」は更新 workflow の project 網羅漏れを疑う。
- 検証: workflow 拡張 commit `a636da9f7` → baseline-update 再 dispatch run `26732700618` success → baseline コミット `2c272cd60`（`admin-1280`/`profile-1280` sidebar-shell-visual-desktop 更新）→ `playwright-smoke` dispatch `26733123506` **success**（smoke / visual chromium / sidebar-shell-visual 全 job green）/ `playwright-visual-full` dispatch `26733124618` **success**。dev の required status checks（`ci`/`Validate Build`/`coverage-gate`/`lighthouse-ci`/`e2e-tests-coverage-gate`）に playwright visual は含まれず merge gate はブロックしないが、CI 全 green を達成。
- 参照: L-VISBASE-002（Linux CI 限定再生成・dispatch 経路）, L-VISBASE-003/004（bot GITHUB_TOKEN push 非トリガー・実 push 再走）, task-specification-creator [[patterns-lessons-and-pitfalls]] L-DOMSWAP-003/007（寸法変動 PR の baseline 更新規律）。

## L-VISBASE-006: `playwright-visual-full` 失敗コメントの `STALE` 判定は権威ではない — `STALE: false`（"真の視覚回帰の可能性"）でも意図的 feature 追加なら baseline 更新が正解。判定軸は L-VISBASE-001-step2 の **route-scope**（2026-06-05 PR #1139 / issue-1079 admin/audit batchId filter 追加）

- 事象: PR #1139（`docs/issue-1079-bulk-tag-audit-batch-filter-spec`、admin/audit に batchId 検索 `<FormField>` + 行表示 + `BatchIdCopyButton` copy 列を追加）で `visual-full (desktop)` / `visual-full (mobile)` が fail。失敗は `visual: admin-audit › admin-audit` の **1 route のみ**、`23912 pixels (ratio 0.03 of all image pixels) are different`（filter 欄 + copy 列の追加分）。`Post baseline refresh guidance on failure` の自動コメントは **`STALE: false` → 「真の視覚回帰の可能性（rendering-relevant ファイルに baseline 以降の変更なし — diff artifact を確認）」** と表示した。
- Why（STALE ヒューリスティクスの限界）: 失敗コメントの `STALE` 判定は `Diagnose baseline staleness` step が `.baseline-meta.json` の `captured_at_commit_sha` 以降に `rendering_relevant_paths`（`apps/web/src/**` / `apps/web/app/**` 等）が変わったかだけを見る粗い近似。baseline が feature commit と同一/後の sha で撮られている（= 「baseline 以降に rendering 変更なし」）と `STALE: false` になるが、それは「baseline が古くないこと」を意味せず、まして「runtime 回帰だからコード修正せよ」を意味しない。`STALE: true`/`false` の verdict と「真の回帰 vs 意図的変化」は直交する軸。
- How to apply（verdict ではなく route-scope で判定 — L-VISBASE-001-step2 の再確認）:
  1. 失敗コメントの `STALE` 表示（"真の回帰の可能性" / "baseline 起因") を**そのまま結論にしない**。必ず `gh run view <job> --log` から `N passed / M failed` と失敗 route 名を読み、**失敗 route が PR の touch surface に一致するか**で判定する。一致（本例 admin-audit ⟷ batchId filter 追加面）なら意図的変化 → L-VISBASE-002 の baseline 再生成。全 route 失敗 / 0 passed なら runtime 回帰を疑う。
  2. baseline 再生成は `gh workflow run playwright-visual-baseline-update.yml -f reason="<why>" -r <feature-branch>`。本リポジトリの `visual-baseline-approval` environment は reviewer 未設定で自動進行（`gh api repos/<o>/<r>/actions/runs/<id>/pending_deployments` が空で確認）、`update-baseline` job は約 11 分。
  3. 完了後は L-VISBASE-004 経路: bot baseline コミットを `git fetch && git merge --ff-only @{u}` で同期 → skill 反映等の実コミットを上に積んで push → 最新 head で `pull_request` checks 再走（bot GITHUB_TOKEN push は再トリガーしないため）。
- 事例: 2026-06-05 PR #1139。`STALE: false` 表示だが失敗は admin-audit 1 route のみ = batchId filter feature 面に一致 → 意図的変化と確定。`playwright-visual-baseline-update.yml` run `27050525423`（-r docs/issue-1079-...）で `full-visual-admin-audit-{desktop,mobile}` baseline を再生成。
- 参照: L-VISBASE-001（snapshot diff vs runtime error の一次切り分け = route-scope 軸）, L-VISBASE-002（Linux CI 限定再生成）, L-VISBASE-004（実 push で `pull_request` 再走）, task-specification-creator [[patterns-lessons-and-pitfalls]] L-DOMSWAP-006/009。
