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

## L-DEVSYNC-007: 自律 sync prompt 実行時の dev HEAD ≠ feature 現在ブランチ HEAD ケース
- 症状: `git fetch --prune origin` 後 `git rev-list --count origin/dev..dev = 0`（dev は最新）でも、feature ブランチが古い `b17c4efa` ベースに居る場合がある。
- 解消: dev 同期フェーズで `dev = origin/dev` を確認した後、必ず feature ブランチに対して `git merge dev --no-edit` を実行する。dev 同期成功 ≠ feature ブランチ伝搬完了。
- Why: 「dev 自体が最新」と「feature ブランチが dev を取り込み済み」は別事象。dev-sync prompt の S-SUB / S-MAIN-DEV パターンでは両方の独立検証が必要。

## 適用範囲
- task-specification-creator skill: 本 Lessons Learned は SKILL.md / changelog / references の conflict 解消にもそのまま適用される。L-DEVSYNC-006 の "最新 N 件" 規約も `task-specification-creator/SKILL.md` に同様に適用される。
- aiworkflow-requirements skill: indexes 再生成は本 skill 配下で完結する。
