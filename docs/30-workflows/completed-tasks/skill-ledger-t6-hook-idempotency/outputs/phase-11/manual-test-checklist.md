# manual-test-checklist — T-6 hook 冪等化 手動 smoke checklist

> 本ワークフロー（仕様書整備 PR）では実走しない。本 checklist は実走 PR 担当が利用する操作仕様。

## 1. 前提確認（gate）

- [ ] A-2（Issue #130）が completed でマージ済み
- [ ] A-1（Issue #129）が completed でマージ済み
- [ ] 実 hook 実装 PR（別 PR）が手元の作業ブランチに準備されている
- [ ] `mise install` 済み / `pnpm install` 済み / `jq` 利用可能
- [ ] `git status` がクリーン

## 2. 2 worktree 事前 smoke（gate）

- [ ] `git checkout main`
- [ ] `bash scripts/new-worktree.sh verify/t6-1` を実行
- [ ] `bash scripts/new-worktree.sh verify/t6-2` を実行
- [ ] `pids=()` を初期化
- [ ] 2 worktree で `mise exec -- pnpm indexes:rebuild` を `&` でバックグラウンド起動し、それぞれ `pids+=("$!")`
- [ ] `for pid in "${pids[@]}"; do wait "$pid" || rc=$?; done` で個別 rc を集約（AC-6）
- [ ] `find .worktrees/verify-t6-* -name '*.json' -exec sh -c 'jq -e . "$1" || rm -v "$1"' _ {} \;` を実行
- [ ] 削除された JSON があれば `pnpm indexes:rebuild` を再実行
- [ ] 各 worktree を `git merge --no-ff` で順次マージ
- [ ] `git ls-files --unmerged | wc -l` が `0` であることを確認（AC-4）
- [ ] PASS でなければ Phase 6 / 9 へ戻し原因分離。FAIL 時は 4 worktree smoke へ進まない（AC-7）

## 3. 4 worktree full smoke

- [ ] 事前 smoke が PASS であることを確認
- [ ] `bash scripts/new-worktree.sh verify/t6-{1..4}` を実行（既存があれば `git worktree remove` で再作成）
- [ ] `pids=()` 初期化 → 4 worktree で並列再生成 → `pids+=("$!")`
- [ ] `for pid in "${pids[@]}"; do wait "$pid" || rc=$?; done` で個別 rc 集約
- [ ] `failed_pids` をログに転記
- [ ] 部分 JSON リカバリ（lane 2）を実行
- [ ] `for n in 1 2 3 4; do git merge --no-ff verify/t6-$n; done`
- [ ] `git ls-files --unmerged | wc -l` が `0` であることを確認
- [ ] `manual-smoke-log.md` に全項目を転記

## 4. 部分 JSON リカバリ実走

- [ ] `pnpm indexes:rebuild` を意図的に中断（例: 1 つ目の skill 再生成中に Ctrl-C）
- [ ] `find ... -name '*.json' -exec sh -c 'jq -e . "$1" >/dev/null 2>&1 || rm -v "$1"' _ {} \;` で破損 JSON を削除
- [ ] 削除リストを `manual-smoke-log.md` に転記
- [ ] `pnpm indexes:rebuild` を再実行 → 全 `jq -e .` PASS を確認
- [ ] hook 経由で勝手な `git add` が発生していないことを `git status` で確認（AC-1 / AC-2）

## 5. hook 副作用ガード確認（AC-1 / AC-2）

- [ ] `git log --oneline` 上、smoke 中に hook が自動 commit していない
- [ ] `git status` 上、`indexes/*.json` が staged になっていない
- [ ] 派生物が既存の場合 hook が再生成をスキップしている（タイムスタンプ比較）

## 6. 完了条件

- [ ] 全チェックボックスが ✓
- [ ] `manual-smoke-log.md` / `manual-test-result.md` を実値で更新
- [ ] 失敗事象は `discovered-issues.md` に追記
