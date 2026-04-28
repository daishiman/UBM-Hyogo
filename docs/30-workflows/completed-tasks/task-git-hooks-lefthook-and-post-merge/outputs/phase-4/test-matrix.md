# Phase 4 — test-matrix.md

## Status

completed

## 表記凡例

- `WT_ROOT` : 作業対象 worktree のルートパス
- `$STAGED` : `git diff --cached --name-only` で取れる staged ファイル一覧
- すべての lefthook 起動は **dry-run 相当（実 commit / 実 merge を伴わない）** で行う

## TC-PRE — pre-commit lane（staged-task-dir-guard）

| ケース | 前提 | 実行 | 期待出力 | 検証コマンド |
| --- | --- | --- | --- | --- |
| TC-PRE-01 | 現ブランチ名と一致するタスクディレクトリのみ staged | `lefthook run pre-commit --files <files>` | exit 0 / `staged-task-dir-guard ✓` | `echo $?` == 0 |
| TC-PRE-02 | 別タスクディレクトリ配下を staged | 同上 | exit !=0 / `🚫 ブランチと無関係なタスクディレクトリ` を含む | `grep -F '🚫' out.log` |
| TC-PRE-03 | staged が空 | 同上（`--files ""`） | exit 0 / 何も出力しない | `wc -l out.log` == 0 |
| TC-PRE-04 | `lefthook.yml` 自体を staged | 同上 | exit 0（guard 対象外） | `echo $?` == 0 |
| TC-PRE-05 | symlink を staged | 同上 | exit 0（パス解決後に判定） | `echo $?` == 0 |

## TC-PMG — post-merge lane（stale-worktree-notice + 再生成廃止確認）

| ケース | 前提 | 実行 | 期待出力 | 検証コマンド |
| --- | --- | --- | --- | --- |
| TC-PMG-01 | `git merge origin/main --no-edit` 直後 | `lefthook run post-merge` | `stale-worktree-notice` のみ起動 | `grep -F 'generate-index' out.log` で 0 件 |
| TC-PMG-02 | post-merge 実行後 | `git status --porcelain` | `indexes/keywords.json` / `indexes/topic-map.md` の差分が出ない | `git status --porcelain \| grep -F 'indexes/' \| wc -l` == 0 |
| TC-PMG-03 | current ブランチが main かつ stale な worktree あり | post-merge 起動 | `⚠ stale worktree:` の通知行が出る | `grep -F '⚠ stale worktree' out.log` |
| TC-PMG-04 | stale な worktree なし | post-merge 起動 | 通知行なし、exit 0 | `echo $?` == 0 |
| TC-PMG-05 | `pnpm indexes:rebuild` を明示実行 | コマンド単体 | indexes が再生成される | `git diff --stat indexes/` で差分あり |


| ケース | 前提 | 実行 | 期待出力 | 検証コマンド |
| --- | --- | --- | --- | --- |
| TC-PFT-02 | origin/main が進行していない | 同上 | exit 0、通知なし | `wc -l out.log` == 0 |

## TC-INST — lefthook install の冪等性・worktree 配布

| ケース | 前提 | 実行 | 期待出力 | 検証コマンド |
| --- | --- | --- | --- | --- |
| TC-INST-01 | clean clone 直後 | `pnpm install`（→ `prepare` 経由 lefthook install） | `.git/hooks/{pre-commit,post-merge}` の 1 行目に `lefthook` を含む | `head -1 .git/hooks/pre-commit \| grep -q lefthook` |
| TC-INST-02 | 既存 worktree (30+) | `for wt in $(git worktree list \| awk '{print $1}'); do (cd "$wt" && pnpm exec lefthook install); done` | 各 worktree の `.git/worktrees/<name>/hooks/` に hook が配置される | `find .git/worktrees -name post-merge -exec head -1 {} \; \| grep -c lefthook` == worktree 数 |
| TC-INST-03 | 2 回連続 install | `pnpm exec lefthook install && pnpm exec lefthook install` | exit 0 / 副作用なし（冪等） | `git status --porcelain` clean |
| TC-INST-04 | `lefthook-local.yml` 存在時 | `lefthook run pre-commit` | local override が反映される | `grep -F 'local override' out.log` |

## TC-BYP — `--no-verify` バイパス（Phase 6 失敗パス側で詳細化）

| ケース | 前提 | 実行 | 期待出力 |
| --- | --- | --- | --- |
| TC-BYP-01 | guard が fail する staged 状態 | `git commit --no-verify -m test` | commit 成功（lefthook がスキップ） |
| TC-BYP-02 | TC-BYP-01 後、CI で同等 check が走る | GitHub Actions の `verify-task-dir` job | CI 側で fail し merge ブロック |

## 検証フロー（実装タスクが流すコマンド束）

```bash
# A. lefthook 起動確認
mise exec -- pnpm exec lefthook run pre-commit --files "$(git diff --cached --name-only)"
mise exec -- pnpm exec lefthook run post-merge

# B. 副作用ゼロ確認
git status --porcelain | grep -F 'indexes/' && echo FAIL || echo PASS

# C. install 冪等性確認
mise exec -- pnpm exec lefthook install
mise exec -- pnpm exec lefthook install
git status --porcelain
```

## NON_VISUAL 証跡の主ソース [Feedback 4]

- 自動テスト名/件数: 上記 TC-PRE × 5 / TC-PMG × 5 / TC-PFT × 3 / TC-INST × 4 / TC-BYP × 2 = 計 19 ケース
- スクリーンショットを作らない理由: hook 動作は CLI 出力のみで完結し、UI 描画を伴わない
- 代替証跡: Phase 11 manual-test-result.md に上記コマンド束の実行ログを貼付
