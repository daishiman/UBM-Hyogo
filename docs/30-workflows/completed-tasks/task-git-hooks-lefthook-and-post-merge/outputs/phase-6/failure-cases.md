# Phase 6 — failure-cases.md

## Status

completed

## F1: `--no-verify` バイパス

| ケース | 前提 | 実行 | 期待挙動 | 検証 |
| --- | --- | --- | --- | --- |
| F1-01 | guard が fail する staged 状態 | `git commit --no-verify -m wip` | lefthook をスキップして commit 成功 | `git log -1` に該当 commit |
| F1-02 | F1-01 と同じ staged を push | `git push origin feat/...` | local では通るが GitHub Actions の同等 check で fail | PR check が red |
| F1-03 | `LEFTHOOK=0 git commit -m ...` | 環境変数による無効化 | lefthook 自体が起動しない | stderr に lefthook バナーなし |
| F1-04 | branch protection で `--no-verify` 由来 commit を block | PR 作成 | `Required status checks` が fail し merge 不可 | GitHub PR UI |

> 設計判断: `--no-verify` は **明示的に許容する**。authoritative ゲートは GitHub Actions と branch protection に置く（Phase 2 design.md セクション 6 参照）。

## F2: 環境欠落

| ケース | 前提 | 実行 | 期待挙動 | 復旧手順 |
| --- | --- | --- | --- | --- |
| F2-01 | `pnpm install` 未実行（`node_modules/.bin/lefthook` 不在） | `git commit -m test` | `.git/hooks/pre-commit` が `lefthook` を呼べず exit !=0、commit fail | `mise exec -- pnpm install` |
| F2-02 | `prepare` script 未実行（lefthook install されていない） | `git commit -m test` | `.git/hooks/*` が空または旧 shell のまま | `mise exec -- pnpm exec lefthook install` |
| F2-03 | Go バイナリが arch 不一致（M1 で x86 binary） | lefthook 起動 | `exec format error` | `mise exec -- pnpm rebuild lefthook` |
| F2-04 | `.git/hooks/pre-commit` のパーミッションが 644 | commit 実行 | hook が起動しない | `chmod +x .git/hooks/*`（または `lefthook install` 再実行） |

検証コマンド:

```bash
mise exec -- pnpm exec lefthook version || echo "F2: lefthook 不在"
test -x .git/hooks/pre-commit || echo "F2: 実行権限なし"
head -1 .git/hooks/pre-commit | grep -q lefthook || echo "F2: install 未実行"
```

## F3: `lefthook-local.yml` による override

| ケース | 前提 | 実行 | 期待挙動 |
| --- | --- | --- | --- |
| F3-01 | `lefthook-local.yml` で `pre-commit.commands.staged-task-dir-guard.skip: true` | `lefthook run pre-commit` | guard がスキップされる（local override 反映） |
| F3-02 | F3-01 のリポジトリで `git status` | — | `lefthook-local.yml` は untracked のまま（`.gitignore` 済み） |
| F3-03 | local override で全 hook を `skip: true` | `git commit -m test` | 全 hook がスキップされ commit 成功 |
| F3-04 | local override で post-merge に `indexes/*.json` 再生成を追加 | merge 実行 | 開発者の自己責任で再生成発火（チームには伝播しない） |

> 設計判断: `lefthook-local.yml` は `.gitignore` で版管理外。チーム標準は `lefthook.yml` のみ。

## F4: post-merge 回帰ガード（最重要）

旧 post-merge の `indexes/*` 自動再生成が **どんな経路でも復活しない** ことを恒久監視する。

| ケース | 前提 | 実行 | 期待挙動 | 検証 |
| --- | --- | --- | --- | --- |
| F4-01 | feat ブランチで origin/main を merge | `git merge origin/main --no-edit` | `indexes/keywords.json` / `indexes/topic-map.md` に diff が出ない | `git status --porcelain \| grep -F 'indexes/'` で 0 件 |
| F4-02 | 新規 PR 作成時 | `git diff main...HEAD --name-only` | `indexes/*.json` が変更ファイルに含まれない | CI job `verify-no-indexes-drift` |
| F4-03 | `lefthook run post-merge` 直接実行 | — | `generate-index.js` が呼ばれない | `grep -F 'generate-index'` がスクリプト出力に 0 件 |
| F4-04 | `pnpm indexes:rebuild` を意図的に実行 | コマンド実行 | indexes が再生成され diff が出る（明示再生成は許可） | `git diff --stat indexes/` で差分あり |

### F4 を CI で恒久化（派生タスク）

```yaml
- name: F4-02 verify-no-indexes-drift
  run: |
    base=$(git merge-base origin/main HEAD)
    diff=$(git diff --name-only "$base"...HEAD | grep -F 'indexes/' || true)
    if [ -n "$diff" ]; then
      echo "🚫 indexes/* に意図しない drift: $diff"
      exit 1
    fi
```

> このCI job 新設は本タスクスコープ外のため、Phase 12 unassigned-task-detection で派生タスク化する。

## 補助コマンド失敗時の挙動

| コマンド | 失敗時挙動 |
| --- | --- |
| `pnpm hooks:doctor` | 各サブチェックの失敗箇所を列挙し exit 1 |
| `pnpm indexes:rebuild` | `generate-index.js` の exit code をそのまま返す |
| `pnpm hooks:reinstall-all-worktrees` | 失敗 worktree のパスを stderr に列挙し exit 1。途中で止めず全 worktree を試行する |

## 完了条件チェック

- [x] F1〜F4 を表で網羅
- [x] 各ケースの検証コマンドを明記
- [x] F4 の CI 化方針を提示（派生タスク化を明示）
- [x] 補助コマンド失敗時の挙動を定義
