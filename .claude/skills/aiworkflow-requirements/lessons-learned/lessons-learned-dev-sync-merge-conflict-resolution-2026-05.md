# Lessons Learned — dev sync merge conflict 解消パターン (2026-05)

`origin/dev` を feature ブランチへ取り込む際に、複数 wave の workflow が並行で `.claude/skills/aiworkflow-requirements/` および `.claude/skills/task-specification-creator/` の changelog / index / active workflow / completed-tasks doc に additive 行を書き込むため、merge 時に高頻度で diff3 conflict が発生する。本書はその自律解消ポリシーの正本。

## L-DEVSYNC-001: SKILL.md / SKILL-changelog.md / references/task-workflow-active.md の changelog 表 conflict
- 症状: HEAD 側と dev 側が同じ表に**別々の追加行**を入れたために `<<<<<<< / ||||||| base / ======= / >>>>>>>` で囲まれる。
- 解消: HEAD 側追記行と dev 側追記行を**両方残し**、`||||||| base` セクション（共通祖先）は破棄する。重複行があれば版番号で最新側を採用。
- 自動化: `<<<<<<< HEAD\n(...A...)(\|\|\|\|\|\|\| base\n(...B...))?=======\n(...C...)>>>>>>> dev` を `A + C` に置換する Python regex。base セクションは optional。
- Why: changelog は append-only であり両側追加に semantic conflict はない。

## L-DEVSYNC-002: indexes/ ファイル (keywords.json / resource-map.md / topic-map.md / quick-reference.md) の conflict
- 症状: `pnpm indexes:rebuild` で生成される派生ファイルが両側で別タイミングで再生成されたために大量の reference 行が衝突。
- 解消: `git checkout --theirs <path>` で dev 側を採用 → merge commit 後に `pnpm indexes:rebuild` を実行して**派生ソース（SKILL/changelog/references）から再生成**する。
- Why: indexes は派生物。手 merge より rebuild が正規経路（CLAUDE.md `pnpm indexes:rebuild` を「post-merge 廃止後の正規経路」と規定）。CI gate `verify-indexes-up-to-date` がリポジトリの drift を検出する。

## L-DEVSYNC-003: docs/30-workflows/completed-tasks/*.md の conflict
- 症状: 同タスクのドキュメント行を HEAD と dev が並行更新。
- 解消: L-DEVSYNC-001 と同じく両側採用が原則。同一行が片側だけで semantic に変化している場合は dev 側を採用（dev = staging-validated 正本）。

## L-DEVSYNC-004: merge commit と pre-commit hook
- merge commit (`MERGE_HEAD` 存在時) は `staged-task-dir-guard` を自動 skip するため `--no-verify` 不要。
- 例外: hook 設定が古い worktree（`scripts/hooks/staged-task-dir-guard.sh` が `MERGE_HEAD` を見ない実装）では `--no-verify` が必要になる場合がある。検出時は hook 側を修正する（CLAUDE.md の sync-merge 個人開発ポリシー）。

## L-DEVSYNC-005: indexes rebuild の二段 commit パターン
- 推奨フロー:
  1. merge 対象を解消し `merge: sync <branch> with dev` で merge commit を作成（indexes は dev 側 = `--theirs`）
  2. `pnpm indexes:rebuild` を実行
  3. 派生差分があれば `chore(indexes): rebuild after dev sync merge` で別 commit
- Why: merge commit と再生成 commit を分けると、後で indexes 再生成だけを revert / replay できる。

## L-DEVSYNC-006: SKILL.md の "最新 N 件のみ列挙" 表は単純両側採用ではダメ
- 症状: `SKILL.md` の changelog 表本体は「最新 3 件のみ列挙」と明記されているが、HEAD と dev が並行で 1 行ずつ追加すると merge 後に 4 件以上残り得る。L-DEVSYNC-001 を機械適用すると規約違反となる。
- 解消: `SKILL.md` の表は両側を結合した後、**日付降順で上位 N 件**（このリポジトリでは 3 件）に切り詰める。当該 feature branch の代表行は最新 N 件に含まれる位置にあるなら残し、外れたなら捨てる。`SKILL-changelog.md` 側は L-DEVSYNC-001 通り全件保存。
- Why: SKILL.md は body load size 抑制のため上位 N 件 only。SKILL-changelog.md が full history の正本。両者の役割を混同しない。

## L-DEVSYNC-008: dev merge 後の Playwright visual-full baseline 鮮度ドリフト（恒久対応）
- 症状: `task/709-visual-baseline-runtime-capture` 系の feature ブランチで dev merge 後に `playwright-visual-full` CI が必ず fail。原因は dev 側に i01 ToastProvider Root Mount / 各 admin / public component の変更が混入し、`apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` baseline と現実 rendering の差が出るため。
- 一時対応: 手動で `gh workflow run playwright-visual-baseline-update.yml -f reason="..." -r <branch>` を叩き、user approval 後に baseline 更新 PR を取り込む。これは記憶依存で再発する。
- 恒久対応（2026-05-17 task-709 ブランチで実装）:
  1. **`apps/web/playwright/tests/visual-full/.baseline-meta.json`**: 捕捉 commit SHA / timestamp / viewport 寸法 / rendering_relevant_paths を記録する provenance ファイル。baseline と一対で版管理。
  2. **`scripts/visual-baseline-status.sh`**（`pnpm visual:baseline:status`）: `.baseline-meta.json` の captured SHA と HEAD を比較し、rendering_relevant_paths に該当する変更があれば `STALE` 判定 + 復旧コマンドを出力。
  3. **`playwright-visual-full.yml`**: 失敗時に `actions/github-script@v7` で PR コメント自動投稿（idempotent: marker `<!-- visual-full-failure-guidance -->` で更新）。stale 判定の有無で「baseline 起因 vs 真の回帰」を切り分けるガイダンスを表示。
  4. **`playwright-visual-baseline-update.yml`**: Regenerate 後 `.baseline-meta.json` を最新 commit SHA で更新するステップを追加。**baseline は PR 経由ではなく、workflow_dispatch 時の source ブランチ（`github.ref_name`）へ `git push` で直接反映する**。
- **重要な学び（2026-05-17 追記）**: 当初 `peter-evans/create-pull-request@v7` で PR 作成する設計だったが、リポジトリ設定「Allow GitHub Actions to create and approve pull requests」が無効のため `GitHub Actions is not permitted to create or approve pull requests` で fail。`GITHUB_TOKEN` の `contents: write` で source ブランチへ直接 push する方式に切替（PR 作成権限不要・`visual-baseline-approval` environment gate は維持）。
- Why: dev merge 起因の rendering 差はほぼ全 feature ブランチで再発するため、recovery を 1-click + 自己診断可能にする。`visual-baseline-approval` environment gate は維持し、人間判断を保ったまま摩擦のみ削減。
- How to apply: dev sync prompt 完了後に `pnpm visual:baseline:status` を実行し STALE なら表示された `gh workflow run` を実行。CI 失敗時は PR コメントの指示に従う。

## L-DEVSYNC-007: 自律 sync prompt 実行時の dev HEAD ≠ feature 現在ブランチ HEAD ケース
- 症状: `git fetch --prune origin` 後 `git rev-list --count origin/dev..dev = 0`（dev は最新）でも、feature ブランチが古い `b17c4efa` ベースに居る場合がある。
- 解消: dev 同期フェーズで `dev = origin/dev` を確認した後、必ず feature ブランチに対して `git merge dev --no-edit` を実行する。dev 同期成功 ≠ feature ブランチ伝搬完了。
- Why: 「dev 自体が最新」と「feature ブランチが dev を取り込み済み」は別事象。dev-sync prompt の S-SUB / S-MAIN-DEV パターンでは両方の独立検証が必要。

## L-DEVSYNC-009: HEAD ブランチが fact migration の正本である場合の `--ours` 例外
- 症状: feature ブランチが secret 名・workflow 参照などの runtime fact migration を実装している場合（例: Issue #718 で `backend-ci.yml` が `CLOUDFLARE_API_TOKEN` → `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` へ切替済）、dev 側の `references/deployment-gha.md` や `indexes/quick-reference.md` の narrative 行は**旧 fact のまま**残ることがある。L-DEVSYNC-002 の `--theirs` を機械適用すると古い narrative で HEAD を上書きしてしまう。
- 解消: `git diff origin/dev..HEAD -- .github/workflows/ apps/` で HEAD 側が実装済みの fact を確認し、HEAD 側が新事実を反映している場合のみ `git checkout --ours <path>` で HEAD を採用する。その後 `pnpm indexes:rebuild` で派生 indexes を再生成する。
- Why: indexes は派生物だが、`references/*.md` と `quick-reference.md` の一部行は派生元の fact narrative そのもの。dev 側 narrative のほうが古い場合、`--theirs` は事実後退になる。
- 適用判断: HEAD 側に当該 fact の workflow / code 変更が**コミット済み**であることを確認したうえで `--ours` を選ぶ。HEAD 側に code 変更がない単なる narrative 衝突なら従来通り `--theirs` + rebuild が安全。
- 事例: 2026-05-17 feat/issue-718-legacy-cf-token-revocation の dev sync merge で本パターンを適用、conflict file（quick-reference.md / topic-map.md / deployment-gha.md）すべて `--ours` 採用 → `pnpm indexes:rebuild` で indexes 再生成。
- 番号注記: 当初 L-DEVSYNC-006 として追記したが、dev 側で並行に L-DEVSYNC-006/007/008 が増えていたため 2026-05-17 の二回目 dev sync で L-DEVSYNC-009 に renumber 済み。

## L-DEVSYNC-010: 新規 playwright spec と mock API fixture の同時追加義務
- 症状: feature ブランチで新規 `apps/web/playwright/tests/*.spec.ts` を追加して dev sync 後に push すると、e2e (desktop-chromium / mobile-webkit) が 60s タイムアウトで失敗する。spec が叩く API path（例: `/admin/tags/queue`）が `apps/web/playwright/fixtures/auth.ts` の mock handler に未登録のため、`fetchAdmin` が 404 → page error → 期待 UI 要素 (`getByRole('button', { name: /^mem_alpha/ })` 等) が永久に出現しない。
- 解消手順:
  1. 失敗 spec が叩く path を grep（`fetchAdmin\|apiClient` で page.tsx / server-fetch.ts を辿る）
  2. `fixtures/auth.ts` の `req.method === 'GET' && url.pathname === '...'` ブロックを列挙して差分を確認
  3. 不足 endpoint ごとに `xxxBody()` 関数を追加し、handler 行を生やす（既存 `task18TagQueueFixture` 等の fixture shape を再利用）
  4. admin UI は desktop-primary のため、admin 系 spec は `playwright.config.ts` の `mobile-webkit` project `testIgnore` に追加（既存 `admin-pages.spec.ts` パターンに合わせる）
- Why: e2e CI 失敗は dev sync merge 起因と紛らわしいが、実体は spec と mock fixture の coverage gap。dev sync prompt 終了直後に CI 失敗を発見した場合、merge conflict ではなく fixture 不足を最初に疑うこと。
- 事例: 2026-05-17 feat/admin-tags-queue-resolver-drawer-mvp-recovery で `admin-tags-resolve-drawer.spec.ts` 追加時に `/admin/tags/queue` GET endpoint が `auth.ts` 未登録のため CI 失敗。`adminTagsQueueBody()` を追加し mobile-webkit `testIgnore` に spec を追加して解消（commit e871acc8）。

## 適用範囲
- task-specification-creator skill: 本 Lessons Learned は SKILL.md / changelog / references の conflict 解消にもそのまま適用される。L-DEVSYNC-006 の "最新 N 件" 規約と L-DEVSYNC-009 の fact migration 判定はいずれも `task-specification-creator/SKILL.md` / 配下 references / changelog 衝突に適用する。
- aiworkflow-requirements skill: indexes 再生成は本 skill 配下で完結する。
