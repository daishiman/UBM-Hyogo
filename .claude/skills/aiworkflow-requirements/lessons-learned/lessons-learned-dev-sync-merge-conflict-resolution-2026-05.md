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

## L-DEVSYNC-006: HEAD ブランチが fact migration の正本である場合の `--ours` 例外
- 症状: feature ブランチが secret 名・workflow 参照などの runtime fact migration を実装している場合（例: Issue #718 で `backend-ci.yml` が `CLOUDFLARE_API_TOKEN` → `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` へ切替済）、dev 側の `references/deployment-gha.md` や `indexes/quick-reference.md` の narrative 行は**旧 fact のまま**残ることがある。L-DEVSYNC-002 の `--theirs` を機械適用すると古い narrative で HEAD を上書きしてしまう。
- 解消: `git diff origin/dev..HEAD -- .github/workflows/ apps/` で HEAD 側が実装済みの fact を確認し、HEAD 側が新事実を反映している場合のみ `git checkout --ours <path>` で HEAD を採用する。その後 `pnpm indexes:rebuild` で派生 indexes を再生成する。
- Why: indexes は派生物だが、`references/*.md` と `quick-reference.md` の一部行は派生元の fact narrative そのもの。dev 側 narrative のほうが古い場合、`--theirs` は事実後退になる。
- 適用判断: HEAD 側に当該 fact の workflow / code 変更が**コミット済み**であることを確認したうえで `--ours` を選ぶ。HEAD 側に code 変更がない単なる narrative 衝突なら従来通り `--theirs` + rebuild が安全。
- 事例: 2026-05-17 feat/issue-718-legacy-cf-token-revocation の dev sync merge で本パターンを適用、4 conflict file（keywords.json / quick-reference.md / topic-map.md / deployment-gha.md）すべて `--ours` 採用 → `pnpm indexes:rebuild` で indexes 再生成。

## 適用範囲
- task-specification-creator skill: 本 Lessons Learned は SKILL.md / changelog / references の conflict 解消にもそのまま適用される。L-DEVSYNC-006 の fact migration 判定も同 skill 配下の references / changelog 衝突に適用する。
- aiworkflow-requirements skill: indexes 再生成は本 skill 配下で完結する。
